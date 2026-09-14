import { StarfallService } from './starfall.service';

describe('StarfallService', () => {
  type GameListRecord = {
    id: string;
    createdAt: Date;
    players: { username: string }[];
  };

  const users = new Map<number, string>();
  const records = new Map<
    string,
    { id: string; version: number; state: unknown; playerIds: number[] }
  >();
  const relatedPlayers = (ids: number[]) =>
    ids.map((id) => ({ id, username: users.get(id)! }));
  const prisma = {
    user: {
      findMany: jest.fn(() => {
        throw new Error('Unexpected standalone user query');
      })
    },
    starfallGame: {
      create: jest.fn(async ({ data }) => {
        const record = { ...data, playerIds: [data.players.connect.id] };
        records.set(data.id, record);
        return { ...record, players: relatedPlayers(record.playerIds) };
      }),
      findMany: jest.fn(async (): Promise<GameListRecord[]> => []),
      findUnique: jest.fn(async ({ where }) => {
        const record = records.get(where.id);
        return record
          ? { ...record, players: relatedPlayers(record.playerIds).reverse() }
          : null;
      }),
      update: jest.fn(async ({ where, data, select }) => {
        const key = where.id_version;
        const record = records.get(key.id);
        if (!record || record.version !== key.version) {
          throw Object.assign(new Error('Record not found'), { code: 'P2025' });
        }
        const updated = {
          ...record,
          ...data,
          playerIds: data.players
            ? [...record.playerIds, data.players.connect.id]
            : record.playerIds
        };
        records.set(key.id, updated);
        return select.players
          ? { id: key.id, players: relatedPlayers(updated.playerIds) }
          : { id: key.id };
      })
    }
  };

  beforeEach(() => {
    records.clear();
    users.clear();
    users.set(1, 'Alice');
    users.set(2, 'Bob');
    users.set(3, 'Charlie');
    jest.clearAllMocks();
  });

  it('persists commands with optimistic locking and idempotency', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');
    const joined = await service.joinGame({
      gameId: created.id,
      dto: { expectedVersion: 0 },
      playerId: '2'
    });
    const actorId = joined.currentPlayerId;

    if (!actorId) {
      throw new Error('Actor not found');
    }

    const started = await service.getGameView(created.id, actorId);
    const cardId = started.players.find((player) => player.id === actorId)
      ?.hand?.[0].id;
    const gameId = created.id;

    const command = {
      commandId: 'play-once',
      expectedVersion: 1,
      type: 'play_card' as const,
      payload: { cardId }
    };
    const after = await service.execute({
      gameId,
      dto: command,
      playerId: actorId
    });
    const duplicate = await service.execute({
      gameId,
      dto: command,
      playerId: actorId
    });

    expect(after.players.map((player) => player.username)).toEqual([
      'Alice',
      'Bob'
    ]);
    expect(duplicate.players).toEqual(after.players);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.starfallGame.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        select: { id: true, players: false }
      })
    );
    expect(after.version).toBe(2);
    expect(duplicate.version).toBe(2);
    expect(prisma.starfallGame.update).toHaveBeenCalledTimes(2);
  });

  it('loads current related names with the game, without persisting them in the snapshot', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');
    users.set(1, 'Renamed Alice');
    const view = await service.getGameView(created.id, '1');
    const lobby = await service.getLobby(created.id);
    expect(view.players[0].username).toBe('Renamed Alice');
    expect(lobby.players).toEqual([{ id: '1', username: 'Renamed Alice' }]);
    expect(prisma.starfallGame.findUnique).toHaveBeenCalledWith({
      where: { id: created.id },
      select: { state: true, players: { select: { id: true, username: true } } }
    });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(JSON.stringify(records.get(created.id)!.state)).not.toContain(
      'username'
    );
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

    expect(created.players[0].username).toBe('Alice');
    expect(joined.players.map((player) => player.username)).toEqual([
      'Alice',
      'Bob'
    ]);
    expect(joined.players.find((player) => player.id === '2')?.hp).toBe(77);

    expect(prisma.starfallGame.update).toHaveBeenCalledWith({
      where: { id_version: { id: created.id, version: 0 } },
      data: {
        version: 1,
        status: 'active',
        state: expect.any(Object),
        players: { connect: { id: 2 } }
      },
      select: { id: true, players: { select: { id: true, username: true } } }
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
  it('exposes lobby metadata before join, then starts and returns private hands', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');
    const lobby = await service.getLobby(created.id);
    expect(lobby).toEqual({
      id: created.id,
      status: 'waiting',
      version: 0,
      startingHp: 50,
      players: [{ id: '1', username: 'Alice' }]
    });
    await expect(service.getGameView(created.id, '2')).rejects.toMatchObject({
      status: 403
    });
    const joined = await service.joinGame({
      gameId: created.id,
      dto: { expectedVersion: lobby.version },
      playerId: '2'
    });
    expect(joined.status).toBe('active');
    expect(joined.turnNumber).toBe(1);
    expect(joined.players.map((p) => p.id)).toContain(joined.currentPlayerId);
    expect(
      joined.players.find((p) => p.id === joined.currentPlayerId)?.handCount
    ).toBe(3);
    expect(
      joined.players.find((p) => p.id !== joined.currentPlayerId)?.handCount
    ).toBe(5);
    expect(joined.players.find((p) => p.id === '1')?.hand).toBeUndefined();
    expect(joined.players.find((p) => p.id === '2')?.hand).toBeDefined();
    const repeated = await service.joinGame({
      gameId: created.id,
      dto: { expectedVersion: 0 },
      playerId: '2'
    });
    expect(repeated).toEqual(joined);
    expect(prisma.starfallGame.update).toHaveBeenCalledTimes(1);
  });

  it('rejects concurrent joins using the persisted version', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');
    const results = await Promise.allSettled(
      ['2', '3'].map((playerId) =>
        service.joinGame({
          gameId: created.id,
          dto: { expectedVersion: 0 },
          playerId
        })
      )
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const failure = results.find(
      (r) => r.status === 'rejected'
    ) as PromiseRejectedResult;
    expect(failure.reason.status).toBe(409);
    expect((await service.getLobby(created.id)).players).toHaveLength(2);
  });

  it('does not accept commands from a nonparticipant', async () => {
    const service = new StarfallService(prisma as never);
    const created = await service.createGame({ startingHp: 50 }, '1');
    await expect(
      service.execute({
        gameId: created.id,
        playerId: '3',
        dto: {
          commandId: 'outsider',
          expectedVersion: 0,
          type: 'end_turn',
          payload: {}
        }
      })
    ).rejects.toMatchObject({ status: 403 });
    expect(prisma.starfallGame.update).not.toHaveBeenCalled();
  });
});
