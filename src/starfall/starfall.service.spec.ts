import { StarfallService } from './starfall.service';

describe('StarfallService', () => {
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
    await service.joinGame(
      created.id,
      { expectedVersion: 0, startingHp: 50 },
      '2'
    );
    const started = await service.startGame(
      created.id,
      {
        commandId: 'start',
        expectedVersion: 1
      },
      '1'
    );
    const cardId = started.players.find((player) => player.id === '1')!.hand![0]
      .id;
    const gameId = created.id;

    const command = {
      commandId: 'play-once',
      expectedVersion: 2,
      type: 'play_card' as const,
      payload: { cardId }
    };
    const after = await service.execute(gameId, command, '1');
    const duplicate = await service.execute(gameId, command, '1');

    expect(after.version).toBe(3);
    expect(duplicate.version).toBe(3);
    expect(prisma.starfallGame.update).toHaveBeenCalledTimes(3);
  });

  it('rejects a stale state version', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');

    await expect(
      service.execute(
        created.id,
        {
          commandId: 'stale',
          expectedVersion: 10,
          type: 'end_turn',
          payload: {}
        },
        '1'
      )
    ).rejects.toThrow(/version conflict/i);
  });

  it('connects a joined player to the persisted game', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');

    await service.joinGame(
      created.id,
      { expectedVersion: 0, startingHp: 50 },
      '2'
    );

    expect(prisma.starfallGame.update).toHaveBeenCalledWith({
      where: { id_version: { id: created.id, version: 0 } },
      data: {
        version: 1,
        state: expect.any(Object),
        players: { connect: { id: 2 } }
      }
    });
  });
});
