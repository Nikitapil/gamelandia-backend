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
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
    const base = card('Blob Wheel');
    current.hand.add(base);

    game.playCard(current.id, base.id);
    game.endTurn(current.id);

    expect(current.bases.has(base.id)).toBe(true);
    expect(current.pileDeck.has(base.id)).toBe(false);
  });

  it('executes persistent ship-played abilities without checking card names', () => {
    const game = createGame();
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
    const mechWorld = card('Mech World');
    const blob = card('Blob Fighter');
    current.hand.addMany([mechWorld, blob]);

    game.playCard(current.id, mechWorld.id);
    game.playCard(current.id, blob.id);

    expect(game.canUseCardAbility(blob, 'ally:0')).toBe(true);
  });

  it('creates and resolves a scrap pending action', () => {
    const game = createGame();
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
    const defender = game.defencePlayer!;
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
    const current = game.currentPlayer!;
    const defender = game.defencePlayer!;
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
    const opponent = restored.defencePlayer!;
    const view = restored.getViewFor(restored.currentPlayer!.id);
    const opponentView = view.players.find((item) => item.id === opponent.id)!;
    expect(opponentView.hand).toBeUndefined();
    expect(opponentView.handCount).toBe(opponent.hand.size);
  });

  it('rejects stale commands and applies a command id once', () => {
    const game = createGame();
    const current = game.currentPlayer!;
    const played = current.hand.cards[0];

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
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
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
    const current = game.currentPlayer!;
    current.hand.clear();
    current.deck.clear();
    const discarded = [
      card('Scout', 'discard-one'),
      card('Trooper', 'discard-two')
    ];
    current.pileDeck.replaceAll(discarded);

    const drawn = current.getCardsFromDeck(2);

    expect(drawn).toHaveLength(2);
    expect(new Set(drawn.map((item) => item.id))).toEqual(
      new Set(discarded.map((item) => item.id))
    );
    expect(current.pileDeck.size).toBe(0);
  });
});
