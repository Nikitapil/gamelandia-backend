import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StarfallModule } from './starfall.module';
import { StarfallGameViewDto } from './dto/starfall-game-view.dto';

describe('Starfall HTTP + Socket.IO integration', () => {
  let app: INestApplication;
  let url: string;
  const jwt = new JwtService();
  const sockets: Socket[] = [];
  const records = new Map<string, any>();
  const oldSecret = process.env.ACCESS_SECRET;
  const token = (id: number, expiresIn = 60) =>
    jwt.sign(
      { id },
      {
        secret: process.env.ACCESS_SECRET,
        expiresIn
      }
    );
  const users = [1, 2, 3].map((id) => ({ id, username: `Player ${id}` }));
  const related = (ids: number[]) =>
    ids.map((id) => users.find((user) => user.id === id));
  const prisma = {
    user: {
      findUnique: jest.fn(async ({ where }) =>
        users.find((user) => user.id === where.id)
      )
    },
    starfallGame: {
      create: jest.fn(async ({ data }) => {
        const record = { ...data, playerIds: [data.players.connect.id] };
        records.set(data.id, record);
        return { ...record, players: related(record.playerIds) };
      }),
      findUnique: jest.fn(async ({ where }) => {
        const record = records.get(where.id);
        return record
          ? { ...record, players: related(record.playerIds) }
          : null;
      }),
      update: jest.fn(async ({ where, data }) => {
        const record = records.get(where.id_version.id);
        if (!record || record.version !== where.id_version.version) {
          throw Object.assign(new Error('Conflict'), { code: 'P2025' });
        }
        const updated = {
          ...record,
          ...data,
          playerIds: data.players
            ? [...record.playerIds, data.players.connect.id]
            : record.playerIds
        };
        records.set(updated.id, updated);
        return { ...updated, players: related(updated.playerIds) };
      })
    }
  };

  beforeAll(async () => {
    process.env.ACCESS_SECRET = 'starfall-realtime-test-secret';
    const module = await Test.createTestingModule({
      imports: [PrismaModule, StarfallModule],
      providers: [JwtStrategy]
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('/api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });
  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
    records.clear();
  });
  afterAll(async () => {
    await app?.close();
    if (oldSecret === undefined) delete process.env.ACCESS_SECRET;
    else process.env.ACCESS_SECRET = oldSecret;
  });

  function connect(gameId: string, accessToken = token(1)) {
    const socket = io(`${url}/starfall`, {
      transports: ['websocket'],
      reconnection: false,
      autoConnect: false,
      auth: { gameId, token: accessToken }
    });
    sockets.push(socket);
    return socket;
  }
  function event<T>(socket: Socket, name: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`Timed out waiting for ${name}`)),
        4000
      );
      socket.once(name, (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
  }
  const http = (id: number) => ({ Authorization: `Bearer ${token(id)}` });
  async function create() {
    const response = await request(app.getHttpServer())
      .post('/api/starfall/games')
      .set(http(1))
      .send({ startingHp: 50 })
      .expect(201);
    return response.body as StarfallGameViewDto;
  }

  it('pushes join and HTTP commands to all participants with GET-equivalent private views and isolates games', async () => {
    const created = await create();
    const another = await create();
    const first = connect(created.id);
    const firstInitial = event<StarfallGameViewDto>(first, 'game:state');
    first.connect();
    expect(await firstInitial).toEqual(created);
    const other = connect(another.id);
    const otherInitial = event(other, 'game:state');
    other.connect();
    await otherInitial;
    const foreignUpdates = jest.fn();
    other.on('game:state', foreignUpdates);

    const joinedPush = event<StarfallGameViewDto>(first, 'game:state');
    await request(app.getHttpServer())
      .post(`/api/starfall/games/${created.id}/join`)
      .set(http(2))
      .send({ expectedVersion: 0 })
      .expect(201);
    const joined = await joinedPush;
    expect(joined.status).toBe('active');
    expect(
      joined.players.find((player) => player.id === '2')?.hand
    ).toBeUndefined();
    const second = connect(created.id, token(2));
    const secondInitial = event(second, 'game:state');
    second.connect();
    await secondInitial;
    // A second tab of the same user must also receive the command.
    const tab = connect(created.id);
    const tabInitial = event(tab, 'game:state');
    tab.connect();
    await tabInitial;

    const updates = [first, second, tab].map((socket) =>
      event<StarfallGameViewDto>(socket, 'game:state')
    );
    const actor = Number(joined.currentPlayerId);
    await request(app.getHttpServer())
      .post(`/api/starfall/games/${created.id}/commands`)
      .set(http(actor))
      .send({
        commandId: '123e4567-e89b-42d3-a456-426614174000',
        expectedVersion: joined.version,
        type: 'end_turn',
        payload: {}
      })
      .expect(201);
    const [one, two, duplicate] = await Promise.all(updates);
    const getOne = await request(app.getHttpServer())
      .get(`/api/starfall/games/${created.id}`)
      .set(http(1))
      .expect(200);
    const getTwo = await request(app.getHttpServer())
      .get(`/api/starfall/games/${created.id}`)
      .set(http(2))
      .expect(200);
    expect(one).toEqual(getOne.body);
    expect(two).toEqual(getTwo.body);
    expect(duplicate).toEqual(one);
    expect(
      one.players.find((player) => player.id === '2')?.hand
    ).toBeUndefined();
    expect(
      two.players.find((player) => player.id === '1')?.hand
    ).toBeUndefined();
    expect(foreignUpdates).not.toHaveBeenCalled();

    first.disconnect();
    const recovered = event<StarfallGameViewDto>(first, 'game:state');
    first.connect();
    expect(await recovered).toEqual(getOne.body);
  });

  it.each([
    ['invalid token', () => 'invalid', 401],
    ['expired token', () => token(1, -1), 401],
    ['deleted user', () => token(99), 401],
    ['non-participant', () => token(3), 403]
  ])(
    'rejects %s before joining the private room',
    async (_name, accessToken, status) => {
      const game = await create();
      const socket = connect(game.id, (accessToken as () => string)());
      const rejected = event<{ data: { status: number } }>(
        socket,
        'connect_error'
      );
      const received = jest.fn();
      socket.on('game:state', received);
      socket.connect();
      expect((await rejected).data.status).toBe(status);
      expect(socket.connected).toBe(false);
      expect(received).not.toHaveBeenCalled();
    }
  );

  it('rejects an unknown game', async () => {
    const socket = connect('missing-game');
    const rejected = event<{ data: { status: number } }>(
      socket,
      'connect_error'
    );
    socket.connect();
    expect((await rejected).data.status).toBe(404);
  });

  it('disconnects an established socket when its access token expires', async () => {
    const game = await create();
    const socket = connect(game.id, token(1, 2));
    const initial = event(socket, 'game:state');
    socket.connect();
    await initial;
    const expired = event<{ status: number }>(socket, 'game:error');
    const disconnected = event(socket, 'disconnect');
    expect(await expired).toEqual({ status: 401 });
    await disconnected;
    expect(socket.connected).toBe(false);
  });
});
