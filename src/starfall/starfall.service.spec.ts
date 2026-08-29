import { StarfallService } from './starfall.service';

describe('StarfallService', () => {
  type GameListRecord = {
    id: string;
    createdAt: Date;
    players: { username: string }[];
  };

  const records = new Map<
    string,
    { id: string; version: number; state: unknown }
  >();
  const prisma = {
    starfallGame: {
      create: jest.fn(async ({ data }) => {
        records.set(data.id, data);
        return data;
      }),
      findMany: jest.fn(async (): Promise<GameListRecord[]> => []),
      findUnique: jest.fn(async ({ where }) => records.get(where.id) ?? null),
      update: jest.fn(async ({ where, data }) => {
        const key = where.id_version;
        const record = records.get(key.id);
        if (!record || record.version !== key.version) {
          throw Object.assign(new Error('Record not found'), { code: 'P2025' });
        }
        records.set(key.id, { ...record, ...data });
        return records.get(key.id);
      })
    }
  };

  beforeEach(() => {
    records.clear();
    jest.clearAllMocks();
  });

  it('persists commands with optimistic locking and idempotency', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');
    await service.joinGame({
      gameId: created.id,
      dto: { expectedVersion: 0 },
      playerId: '2'
    });
    const started = await service.startGame({
      gameId: created.id,
      dto: {
        commandId: 'start',
        expectedVersion: 1
      },
      playerId: '1'
    });
    const cardId = started.players.find((player) => player.id === '1')!.hand![0]
      .id;
    const gameId = created.id;

    const command = {
      commandId: 'play-once',
      expectedVersion: 2,
      type: 'play_card' as const,
      payload: { cardId }
    };
    const after = await service.execute({
      gameId,
      dto: command,
      playerId: '1'
    });
    const duplicate = await service.execute({
      gameId,
      dto: command,
      playerId: '1'
    });

    expect(after.version).toBe(3);
    expect(duplicate.version).toBe(3);
    expect(prisma.starfallGame.update).toHaveBeenCalledTimes(3);
  });

  it('rejects a stale state version', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');

    await expect(
      service.execute({
        gameId: created.id,
        dto: {
          commandId: 'stale',
          expectedVersion: 10,
          type: 'end_turn',
          payload: {}
        },
        playerId: '1'
      })
    ).rejects.toThrow(/version conflict/i);
  });

  it('connects a joined player to the persisted game', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 77 }, '1');

    const joined = await service.joinGame({
      gameId: created.id,
      dto: { expectedVersion: 0 },
      playerId: '2'
    });

    expect(joined.players.find((player) => player.id === '2')?.hp).toBe(77);

    expect(prisma.starfallGame.update).toHaveBeenCalledWith({
      where: { id_version: { id: created.id, version: 0 } },
      data: {
        version: 1,
        status: 'waiting',
        state: expect.any(Object),
        players: { connect: { id: 2 } }
      }
    });
  });

  it('returns all games ordered from newest to oldest', async () => {
    const service = new StarfallService(prisma as never);
    const newestCreatedAt = new Date('2026-08-29T12:00:00.000Z');
    const oldestCreatedAt = new Date('2026-08-28T12:00:00.000Z');
    prisma.starfallGame.findMany.mockResolvedValueOnce([
      {
        id: 'newest',
        createdAt: newestCreatedAt,
        players: [{ username: 'alice' }, { username: 'bob' }]
      },
      {
        id: 'oldest',
        createdAt: oldestCreatedAt,
        players: [{ username: 'charlie' }]
      }
    ]);

    const games = await service.getGames({});

    expect(prisma.starfallGame.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        players: { select: { username: true } }
      }
    });
    expect(games).toEqual([
      {
        id: 'newest',
        createdAt: newestCreatedAt,
        players: ['alice', 'bob']
      },
      {
        id: 'oldest',
        createdAt: oldestCreatedAt,
        players: ['charlie']
      }
    ]);
  });

  it('filters games that have not started', async () => {
    const service = new StarfallService(prisma as never);

    await service.getGames({ notStarted: 'true' });

    expect(prisma.starfallGame.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'waiting' } })
    );
  });
});
