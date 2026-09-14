import { cards } from '../domain/constants';
import { CardFromDb, PlayerFromDb } from '../domain/dbTypes';
import { CardEntity } from './card.entity';
import { GameEntity } from './game.entity';

const player = (id: string): PlayerFromDb => ({
  id,
  cards: [],
  hp: 50,
  money: 0,
  attack: 0,
  discardCardsCount: 0,
  isWinner: false
});

const initialCards = (): CardFromDb[] =>
  cards.flatMap((definition) =>
    Array.from({ length: definition.count }, (_, index) => ({
      id: `${definition.name}-${index}`,
      name: definition.name,
      isPlayed: false,
      deck:
        definition.deck === 'trade'
          ? ('unused-deck' as const)
          : definition.deck === 'explorer'
          ? ('explorers' as const)
          : ('starter-cards' as const)
    }))
  );

const createGame = () => {
  const records = initialCards();
  const game = new GameEntity({
    id: 'game',
    players: [player('one'), player('two')],
    currentPlayerId: 'one',
    gameCards: records,
    status: 'waiting'
  });
  game.initNewGame(records);
  game.startGame('one');
  return game;
};

const card = (name: string, id = `test-${name}`) => {
  const definition = cards.find((item) => item.name === name);
  if (!definition) throw new Error(`Missing test definition ${name}`);
  return new CardEntity({ card: definition, id });
};

describe('GameEntity', () => {
  it('projects names by player ID without adding profile data to snapshots', () => {
    const game = createGame();
    const snapshot = game.toSnapshot();
    game.setPlayerNames([
      { id: 'two', username: 'Bob' },
      { id: 'one', username: 'Alice' }
    ]);
    expect(game.playerNames).toEqual([
      { id: 'one', username: 'Alice' },
      { id: 'two', username: 'Bob' }
    ]);
    expect(
      game.getViewFor('one').players.map((player) => player.username)
    ).toEqual(['Alice', 'Bob']);
    expect(game.toSnapshot()).toEqual(snapshot);
  });

  it('separates decks and deals the correct opening hands', () => {
    const game = createGame();

    expect(game.tradeRow.size).toBe(5);
    expect(
      game.tradeRow.cards.every((item) => item.card.deck === 'trade')
    ).toBe(true);
    expect(game.explorers.size).toBe(10);
    expect(game.players[0].hand.size).toBe(3);
    expect(game.players[1].hand.size).toBe(5);
    expect(game.players[0].deck.size).toBe(7);
    expect(game.players[1].deck.size).toBe(5);
    game.players.forEach((item) => {
      const starterCards = [...item.hand.cards, ...item.deck.cards];
      expect(
        starterCards.filter((starter) => starter.card.name === 'Scout')
      ).toHaveLength(8);
      expect(
        starterCards.filter((starter) => starter.card.name === 'Trooper')
      ).toHaveLength(2);
    });
  });

  it('moves a played ship once and discards it at end of turn', () => {
    const game = createGame();
    const current = game.currentPlayer;
    if (!current) {
      throw new Error('invalid current player');
    }
    const played = current.hand.cards[0];

    game.playCard(current.id, played.id);
    expect(current.hand.has(played.id)).toBe(false);
    expect(current.currentPlayedCards.has(played.id)).toBe(true);
    expect(() => game.playCard(current.id, played.id)).toThrow();

    game.endTurn(current.id);
    expect(current.currentPlayedCards.size).toBe(0);
    expect(current.pileDeck.has(played.id)).toBe(true);
    expect(played.isPlayed).toBe(false);
  });

  it('keeps a base in play across turns', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid current player');
    }

    const base = card('Blob Wheel');
    current.hand.add(base);

    game.playCard(current.id, base.id);
    game.endTurn(current.id);

    expect(current.bases.has(base.id)).toBe(true);
    expect(current.pileDeck.has(base.id)).toBe(false);
  });

  it('executes persistent ship-played abilities without checking card names', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid current player');
    }

    const fleetHq = card('Fleet HQ');
    const firstShip = card('Scout', 'fleet-ship-one');
    const secondShip = card('Scout', 'fleet-ship-two');
    current.hand.addMany([fleetHq, firstShip, secondShip]);

    game.playCard(current.id, fleetHq.id);
    game.playCard(current.id, firstShip.id);
    game.playCard(current.id, secondShip.id);

    expect(current.attack).toBe(2);
  });

  it('activates ally abilities in either play order', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid current player');
    }

    const first = card('Blob Fighter', 'blob-one');
    const second = card('Trade Pod', 'blob-two');
    current.hand.addMany([first, second]);

    game.playCard(current.id, first.id);
    expect(game.canUseCardAbility(first, 'ally:0')).toBe(false);
    game.playCard(current.id, second.id);
    expect(game.canUseCardAbility(first, 'ally:0')).toBe(true);
    expect(game.canUseCardAbility(second, 'ally:0')).toBe(true);
  });

  it('uses Mech World as an ally for every faction', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid current player');
    }

    const mechWorld = card('Mech World');
    const blob = card('Blob Fighter');
    current.hand.addMany([mechWorld, blob]);

    game.playCard(current.id, mechWorld.id);
    game.playCard(current.id, blob.id);

    expect(game.canUseCardAbility(blob, 'ally:0')).toBe(true);
  });

  it('creates and resolves a scrap pending action', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid current player');
    }

    const bot = card('Trade Bot');
    const target = card('Scout', 'scrap-target');
    current.hand.addMany([bot, target]);

    game.playCard(current.id, bot.id);
    expect(game.pendingAction?.type).toBe('choose_cards_to_scrap');
    expect(() => game.endTurn(current.id)).toThrow();

    game.resolvePendingAction(current.id, { cardIds: [target.id] });
    expect(game.scrappedCards.has(target.id)).toBe(true);
    expect(current.hand.has(target.id)).toBe(false);
  });

  it('copies another played ship with Stealth Needle', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid current player');
    }

    const fighter = card('Blob Fighter', 'copy-target');
    const needle = card('Stealth Needle');
    current.hand.addMany([fighter, needle]);

    game.playCard(current.id, fighter.id);
    const attackBeforeCopy = current.attack;
    game.playCard(current.id, needle.id);
    expect(game.pendingAction?.type).toBe('choose_ship_to_copy');
    game.resolvePendingAction(current.id, { cardId: fighter.id });

    expect(needle.copiedCardId).toBe(fighter.id);
    expect(current.attack).toBe(attackBeforeCopy + fighter.card.attack);
  });

  it('blocks player and regular bases while an outpost exists', () => {
    const game = createGame();
    const current = game.currentPlayer;
    const defender = game.defencePlayer;

    if (!current || !defender) {
      throw new Error('invalid current player');
    }

    const outpost = card('Battle Station');
    const regular = card('Blob Wheel');
    outpost.play();
    regular.play();
    defender.bases.addMany([outpost, regular]);
    current.attack = 20;

    expect(() => game.attackPlayer(current.id, 1)).toThrow(/outpost/);
    expect(() => game.attackBase(current.id, regular.id)).toThrow(/outpost/);
    game.attackBase(current.id, outpost.id);
    expect(defender.pileDeck.has(outpost.id)).toBe(true);
    game.attackBase(current.id, regular.id);
    expect(defender.pileDeck.has(regular.id)).toBe(true);
  });

  it('finishes the game with exactly one winner', () => {
    const game = createGame();
    const current = game.currentPlayer;
    const defender = game.defencePlayer;

    if (!current || !defender) {
      throw new Error('invalid current player');
    }

    current.attack = defender.hp;

    game.attackPlayer(current.id, defender.hp);

    expect(game.status).toBe('finished');
    expect(game.winner?.id).toBe(current.id);
    expect(game.players.filter((item) => item.isWinner)).toHaveLength(1);
  });

  it('restores the full state from a snapshot without revealing hidden cards', () => {
    const game = createGame();
    const snapshot = game.toSnapshot();
    const restored = GameEntity.fromSnapshot(snapshot);

    expect(restored.toSnapshot()).toEqual(snapshot);
    const opponent = restored.defencePlayer;

    if (!restored.currentPlayer || !opponent) {
      throw new Error('invalid players state');
    }

    const view = restored.getViewFor(restored.currentPlayer.id);
    const opponentView = view.players.find((item) => item.id === opponent.id);
    expect(opponentView?.hand).toBeUndefined();
    expect(opponentView?.handCount).toBe(opponent.hand.size);
  });

  it('rejects stale commands and applies a command id once', () => {
    const game = createGame();
    const current = game.currentPlayer;

    const played = current?.hand.cards[0];

    if (!played || !current) {
      throw new Error('invalid players state');
    }

    game.executeCommand({
      commandId: 'command',
      expectedVersion: 0,
      command: () => game.playCard(current.id, played.id)
    });
    expect(game.version).toBe(1);
    game.executeCommand({
      commandId: 'command',
      expectedVersion: 1,
      command: () => {
        throw new Error('must not execute twice');
      }
    });
    expect(game.version).toBe(1);
    expect(() =>
      game.executeCommand({
        commandId: 'new-command',
        expectedVersion: 0,
        command: () => undefined
      })
    ).toThrow(/version conflict/);
  });

  it('shrinks the trade row after the trade deck is exhausted', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid players state');
    }

    game.unusedDeck.clear();
    current.money = 100;
    const before = game.tradeRow.size;
    const bought = game.tradeRow.cards[0];

    game.buyCard(current.id, bought.id);

    expect(game.tradeRow.size).toBe(before - 1);
    expect(current.pileDeck.has(bought.id)).toBe(true);
  });

  it('does not mutate purchase zones when trade is insufficient', () => {
    const game = createGame();
    const current = game.currentPlayer;

    if (!current) {
      throw new Error('invalid players state');
    }

    const expensive = game.tradeRow.cards.reduce((left, right) =>
      left.card.cost > right.card.cost ? left : right
    );
    current.money = Math.max(0, expensive.card.cost - 1);
    const rowIds = game.tradeRow.cards.map((item) => item.id);

    expect(() => game.buyCard(current.id, expensive.id)).toThrow(
      /not enough trade/i
    );
    expect(game.tradeRow.cards.map((item) => item.id)).toEqual(rowIds);
    expect(current.pileDeck.has(expensive.id)).toBe(false);
  });

  it('reshuffles the discard pile when the personal deck is empty', () => {
    const game = createGame();
    const current = game.currentPlayer;

    current?.hand.clear();
    current?.deck.clear();
    const discarded = [
      card('Scout', 'discard-one'),
      card('Trooper', 'discard-two')
    ];
    current?.pileDeck.replaceAll(discarded);

    const drawn = current?.getCardsFromDeck(2);

    expect(drawn).toHaveLength(2);
    expect(new Set(drawn?.map((item) => item.id))).toEqual(
      new Set(discarded.map((item) => item.id))
    );
    expect(current?.pileDeck.size).toBe(0);
  });
  it('finishes on overkill and rejects further actions', () => {
    const game = createGame();
    const player = game.currentPlayer;
    if (!player || !game.defencePlayer) {
      throw new Error('invalid game state');
    }
    player.attack = 51;
    game.attackPlayer(player.id, 51);
    expect(game.defencePlayer.hp).toBe(0);
    expect(game.status).toBe('finished');
    expect(game.winner?.id).toBe(player.id);
    expect(() => game.endTurn(player.id)).toThrow(/active/);
  });

  it('exposes real explorers and spends the next-ship flag only on a ship', () => {
    const game = createGame();
    const player = game.currentPlayer;
    const office = card('Central Office');
    if (!player) {
      throw new Error('invalid game state');
    }
    player.hand.add(office);
    game.playCard(player.id, office.id);
    game.useCardAbility({
      playerId: player.id,
      cardId: office.id,
      abilityId: 'primary:0'
    });
    const restored = GameEntity.fromSnapshot(game.toSnapshot());
    const current = restored.currentPlayer;
    if (!current) {
      throw new Error('invalid game state');
    }
    const view = restored.getViewFor(current.id);
    expect(view.players.find((p) => p.id === current.id)?.nextShipToTop).toBe(
      true
    );
    expect(
      view.players.find((p) => p.id !== current.id)?.nextShipToTop
    ).toBeUndefined();
    current.money = 100;
    const base = card('Blob Wheel');
    restored.tradeRow.add(base);
    restored.buyCard(current.id, base.id);
    expect(current.nextShipToTop).toBe(true);
    expect(current.pileDeck.has(base.id)).toBe(true);
    if (!view.explorer) {
      throw new Error('invalid game view state');
    }
    restored.buyCard(current.id, view.explorer?.id);
    expect(current.deck.cards[0].id).toBe(view.explorer?.id);
    expect(current.nextShipToTop).toBe(false);
  });

  it('keeps copied abilities and usage after scrapping the original and restoring', () => {
    const game = createGame();
    const player = game.currentPlayer;
    if (!player) {
      throw new Error('invalid game state');
    }
    const ram = card('Ram');
    const needle = card('Stealth Needle');
    const ally = card('Blob Fighter');
    player.hand.addMany([ram, needle, ally]);
    game.playCard(player.id, ram.id);
    game.playCard(player.id, needle.id);
    game.resolvePendingAction(player.id, { cardId: ram.id });
    game.useCardAbility({
      playerId: player.id,
      cardId: needle.id,
      abilityId: 'copied:ally:0'
    });
    game.useCardAbility({
      playerId: player.id,
      cardId: ram.id,
      abilityId: 'scrap:0'
    });
    game.playCard(player.id, ally.id);
    const restored = GameEntity.fromSnapshot(game.toSnapshot());
    const copy = restored.currentPlayer?.currentPlayedCards.requireCardById(
      needle.id
    );
    expect(copy?.requireAbility('copied:ally:0').isUsed).toBe(true);
    expect(copy?.requireAbility('copied:scrap:0').isUsed).toBe(false);
    if (!copy) {
      throw new Error('invalid game state');
    }
    expect(restored.hasAllyFor(copy)).toBe(true);
    const publicCopy = restored
      .getViewFor(player.id)
      .players.find((p) => p.id === player.id)
      ?.playedShips.find((c) => c.id === needle.id);
    expect(publicCopy?.copiedCardId).toBe(ram.id);
    expect(
      publicCopy?.abilityStates.find((a) => a.id === 'copied:scrap:0')
        ?.isAvailable
    ).toBe(true);
    expect(
      publicCopy?.abilityStates.find((a) => a.id === 'copied:ally:0')
        ?.isAvailable
    ).toBe(false);
    if (!restored.defencePlayer) {
      throw new Error('invalid game state');
    }
    const opponentView = restored.getViewFor(restored.defencePlayer.id);
    expect(
      opponentView.players
        .flatMap((p) => p.playedShips)
        .flatMap((c) => c.abilityStates)
        .every((a) => !a.isAvailable)
    ).toBe(true);
  });

  it('does not deadlock mandatory scrap when there are no eligible cards', () => {
    const game = createGame();
    const player = game.currentPlayer;
    if (!player) {
      throw new Error('invalid game state');
    }
    player.hand.clear();
    player.deck.clear();
    player.pileDeck.clear();
    const base = card('Machine Base');
    player.hand.add(base);
    game.playCard(player.id, base.id);
    game.useCardAbility({
      playerId: player.id,
      cardId: base.id,
      abilityId: 'primary:0'
    });
    expect(game.pendingAction).toBeNull();
    expect(() => game.endTurn(player.id)).not.toThrow();
  });
});
