import { Action, cards, TCardAbilitiesNames } from '../domain/constants';
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

  it.each([false, true])(
    'automatically resolves allies in either play order: %s',
    (reverse) => {
      const game = createGame();
      const current = game.currentPlayer;

      if (!current) {
        throw new Error('invalid current player');
      }

      const first = card('Blob Fighter', 'blob-one');
      const second = card('Trade Pod', 'blob-two');
      current.hand.addMany([first, second]);
      const handSize = current.hand.size;
      const order = reverse ? [second, first] : [first, second];

      game.playCard(current.id, order[0].id);
      expect(order[0].requireAbility('ally:0').isUsed).toBe(false);
      expect(game.canUseCardAbility(order[0], 'ally:0')).toBe(false);
      game.playCard(current.id, order[1].id);
      expect(first.requireAbility('ally:0').isUsed).toBe(true);
      expect(second.requireAbility('ally:0').isUsed).toBe(true);
      expect(current.attack).toBe(5);
      expect(current.money).toBe(3);
      expect(current.hand.size).toBe(handSize - 1);
      expect(game.pendingAction).toBeNull();

      const third = card('Trade Pod', 'blob-three');
      current.hand.add(third);
      game.playCard(current.id, third.id);
      expect(current.attack).toBe(7);
      expect(current.hand.size).toBe(handSize - 1);
      expect(() =>
        game.useCardAbility({
          playerId: current.id,
          cardId: first.id,
          abilityId: 'ally:0'
        })
      ).toThrow('not currently available');
    }
  );

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

    expect(blob.requireAbility('ally:0').isUsed).toBe(true);
    expect(game.canUseCardAbility(blob, 'ally:0')).toBe(false);
  });

  it('automatically restores authority and schedules the opponent discard', () => {
    const game = createGame();
    const current = game.players[0];
    const shuttle = card('Federation Shuttle');
    const cutter = card('Cutter');
    const cruiser = card('Battlecruiser');
    const station = card('Space Station');
    current.hand.addMany([shuttle, cutter, cruiser, station]);
    game.playCard(current.id, shuttle.id);
    game.playCard(current.id, cutter.id);
    expect(current.hp).toBe(58);
    expect(current.attack).toBe(4);
    game.playCard(current.id, cruiser.id);
    game.playCard(current.id, station.id);
    expect(game.players[1].discardCardsCount).toBe(1);
    expect(cruiser.requireAbility('ally:0').isUsed).toBe(true);
    expect(game.pendingAction).toBeNull();

    game.endTurn(current.id);
    expect(game.pendingAction?.type).toBe('discard_for_opponent');
  });

  it('resolves allied bases again at the start of their next turn', () => {
    const game = createGame();
    const current = game.players[0];
    const station = card('Space Station');
    const world = card('War World');
    current.hand.addMany([station, world]);
    game.playCard(current.id, station.id);
    game.playCard(current.id, world.id);
    expect(current.attack).toBe(11);
    game.endTurn(current.id);
    expect(current.attack).toBe(0);
    game.endTurn(game.players[1].id);
    expect(current.attack).toBe(11);
    expect(station.requireAbility('ally:0').isUsed).toBe(true);
    expect(world.requireAbility('ally:0').isUsed).toBe(true);
  });

  it('waits for the mandatory start-of-turn discard before drawing from allied bases', () => {
    const game = createGame();
    const current = game.players[0];
    const hive = card('The Hive');
    const mech = card('Mech World');
    current.hand.addMany([hive, mech]);
    game.playCard(current.id, hive.id);
    game.playCard(current.id, mech.id);
    expect(hive.requireAbility('ally:0').isUsed).toBe(true);
    game.endTurn(current.id);
    current.discardCardsCount = 1;
    current.deck.replaceAll(
      Array.from({ length: 8 }, (_, i) => card('Scout', `draw-${i}`))
    );
    game.endTurn(game.players[1].id);
    expect(current.hand.size).toBe(5);
    expect(current.hand.has('draw-5')).toBe(false);
    expect(hive.requireAbility('ally:0').isUsed).toBe(false);
    expect(game.pendingAction?.type).toBe('discard_for_opponent');
    game.resolvePendingAction(current.id, { cardIds: ['draw-0'] });
    expect(current.hand.size).toBe(5);
    expect(current.hand.has('draw-5')).toBe(true);
    expect(hive.requireAbility('ally:0').isUsed).toBe(true);
  });

  it.each([false, true])(
    'waits for a primary choice to resolve or cancel: %s',
    (cancel) => {
      const game = createGame();
      const current = game.players[0];
      const fighter = card('Blob Fighter');
      const pod = card('Battle Pod');
      current.hand.addMany([fighter, pod]);
      game.playCard(current.id, fighter.id);
      game.playCard(current.id, pod.id);
      const handSize = current.hand.size;
      expect(current.attack).toBe(7);
      expect(fighter.requireAbility('ally:0').isUsed).toBe(false);
      expect(pod.requireAbility('ally:0').isUsed).toBe(false);
      expect(game.pendingAction?.type).toBe('choose_trade_card_to_scrap');
      if (cancel) game.cancelPendingAction(current.id);
      else
        game.resolvePendingAction(current.id, {
          cardId: game.tradeRow.cards[0].id
        });
      expect(current.attack).toBe(9);
      expect(current.hand.size).toBe(handSize + 1);
      expect(game.pendingAction).toBeNull();
    }
  );

  it('resumes automatic copied allies only after the copied primary choice, including after reload', () => {
    const game = createGame();
    const current = game.players[0];
    const mech = card('Battle Mech');
    const needle = card('Stealth Needle');
    current.hand.addMany([mech, needle]);
    game.playCard(current.id, mech.id);
    game.resolvePendingAction(current.id, { cardIds: [] });
    game.playCard(current.id, needle.id);
    game.resolvePendingAction(current.id, { cardId: mech.id });
    expect(game.pendingAction?.type).toBe('choose_cards_to_scrap');
    expect(mech.requireAbility('ally:0').isUsed).toBe(false);
    expect(needle.requireAbility('copied:ally:0').isUsed).toBe(false);
    const restored = GameEntity.fromSnapshot(game.toSnapshot());
    const handSize = restored.players[0].hand.size;
    restored.resolvePendingAction(current.id, { cardIds: [] });
    expect(restored.players[0].hand.size).toBe(handSize + 2);
    const ships = restored.getViewFor(current.id).players[0].playedShips;
    expect(
      ships
        .flatMap((ship) => ship.abilityStates)
        .filter((ability) => ability.kind === 'ally')
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'ally:0',
          isUsed: true,
          isAvailable: false
        }),
        expect.objectContaining({
          id: 'copied:ally:0',
          isUsed: true,
          isAvailable: false
        })
      ])
    );
  });

  it('preserves the continuation after a copied choice and waits for every nested choice', () => {
    const game = createGame();
    const current = game.players[0];
    const mech = card('Battle Mech');
    const needle = new CardEntity({
      id: 'nested-copy',
      card: {
        ...card('Stealth Needle').card,
        abilities: [
          {
            name: TCardAbilitiesNames.SEQUENCE,
            actions: [
              { name: TCardAbilitiesNames.COPY_SHIP },
              {
                name: TCardAbilitiesNames.CHOOSE_ONE,
                options: [[{ name: TCardAbilitiesNames.PLUS_MONEY, value: 3 }]]
              }
            ]
          }
        ]
      }
    });
    current.hand.addMany([mech, needle]);
    game.playCard(current.id, mech.id);
    game.resolvePendingAction(current.id, { cardIds: [] });
    game.playCard(current.id, needle.id);
    const handSize = current.hand.size;
    game.resolvePendingAction(current.id, { cardId: mech.id });
    expect(game.pendingAction?.type).toBe('choose_cards_to_scrap');
    expect(current.hand.size).toBe(handSize);
    game.resolvePendingAction(current.id, { cardIds: [] });
    expect(game.pendingAction?.type).toBe('choose_effect');
    expect(current.hand.size).toBe(handSize);
    expect(current.money).toBe(0);
    game.resolvePendingAction(current.id, { optionIndex: 0 });
    expect(game.pendingAction).toBeNull();
    expect(current.money).toBe(3);
    expect(current.hand.size).toBe(handSize + 2);
  });

  it.each(['Blob Carrier', 'Blob Destroyer', 'Patrol Mech', 'Command Ship'])(
    'keeps choice-based allies manual: %s',
    (name) => {
      const game = createGame();
      const current = game.players[0];
      const source = card(name);
      const mech = card('Mech World');
      current.hand.addMany([source, mech]);
      game.playCard(current.id, mech.id);
      game.playCard(current.id, source.id);
      if (game.pendingAction)
        game.resolvePendingAction(current.id, { optionIndex: 0 });
      expect(game.pendingAction).toBeNull();
      for (const ability of source.matchedAbilities) {
        expect(ability.isUsed).toBe(false);
        expect(game.canUseCardAbility(source, ability.id)).toBe(true);
      }
      game.useCardAbility({
        playerId: current.id,
        cardId: source.id,
        abilityId: 'ally:0'
      });
      expect(source.requireAbility('ally:0').isUsed).toBe(true);
    }
  );

  it('keeps optional destruction manual even with exactly one target', () => {
    const game = createGame();
    const current = game.players[0];
    const destroyer = card('Blob Destroyer');
    const ram = card('Ram');
    const base = card('Blob Wheel');
    game.players[1].putCardInPlay(base);
    current.hand.addMany([destroyer, ram]);
    game.playCard(current.id, destroyer.id);
    game.playCard(current.id, ram.id);
    expect(destroyer.requireAbility('ally:0').isUsed).toBe(false);
    expect(game.players[1].bases.has(base.id)).toBe(true);
    game.useCardAbility({
      playerId: current.id,
      cardId: destroyer.id,
      abilityId: 'ally:0'
    });
    expect(game.pendingAction?.type).toBe('choose_base_to_destroy');
    game.cancelPendingAction(current.id);
    expect(game.players[1].bases.has(base.id)).toBe(true);
  });

  it('resolves nested automatic effects but leaves an entire mixed sequence manual', () => {
    const game = createGame();
    const current = game.players[0];
    const automatic: Action = {
      name: TCardAbilitiesNames.SEQUENCE,
      actions: [
        { name: TCardAbilitiesNames.PLUS_MONEY, value: 2 },
        { name: TCardAbilitiesNames.PUT_NEXT_SHIP_ON_TOP },
        { name: TCardAbilitiesNames.ALL_FACTIONS_ALLY },
        {
          name: TCardAbilitiesNames.IF_BASES_IN_PLAY,
          min: 1,
          actions: [
            {
              name: TCardAbilitiesNames.DRAW_PER_FACTION_CARD,
              fraction: 'blobs'
            }
          ]
        }
      ]
    };
    const mixed: Action = {
      name: TCardAbilitiesNames.SEQUENCE,
      actions: [
        { name: TCardAbilitiesNames.PLUS_ATTACK, value: 100 },
        {
          name: TCardAbilitiesNames.IF_BASES_IN_PLAY,
          min: 1,
          actions: [
            {
              name: TCardAbilitiesNames.CHOOSE_ONE,
              options: [[{ name: TCardAbilitiesNames.GET_CARDS, value: 1 }]]
            }
          ]
        }
      ]
    };
    const source = new CardEntity({
      id: 'compound-ally',
      card: { ...card('Ram').card, matchAbilities: [automatic, mixed] }
    });
    const mech = card('Mech World');
    current.hand.addMany([source, mech]);
    const handSize = current.hand.size;
    game.playCard(current.id, mech.id);
    game.playCard(current.id, source.id);
    expect(current.money).toBe(2);
    expect(current.nextShipToTop).toBe(true);
    expect(current.hand.size).toBe(handSize - 1);
    expect(current.attack).toBe(5);
    expect(source.requireAbility('ally:0').isUsed).toBe(true);
    expect(source.requireAbility('ally:1').isUsed).toBe(false);
    expect(source.requireAbility('scrap:0').isUsed).toBe(false);
    expect(game.pendingAction).toBeNull();
    game.useCardAbility({
      playerId: current.id,
      cardId: source.id,
      abilityId: 'ally:1'
    });
    expect(current.attack).toBe(105);
    expect(game.pendingAction?.type).toBe('choose_effect');
  });

  it('does not repeat automatic effects when retrying a command or restoring its snapshot', () => {
    const game = createGame();
    const current = game.players[0];
    const fighter = card('Blob Fighter');
    const ram = card('Ram');
    current.hand.addMany([fighter, ram]);
    game.playCard(current.id, fighter.id);
    const command = {
      commandId: 'play-ally-once',
      expectedVersion: game.version,
      command: () => game.playCard(current.id, ram.id)
    };
    game.executeCommand(command);
    const snapshot = game.toSnapshot();
    game.executeCommand(command);
    expect(game.toSnapshot()).toEqual(snapshot);
    const restored = GameEntity.fromSnapshot(snapshot);
    restored.getViewFor(current.id);
    restored.executeCommand({
      ...command,
      command: () => {
        throw new Error('Duplicate command executed');
      }
    });
    expect(restored.toSnapshot()).toEqual(snapshot);
    expect(restored.players[0].attack).toBe(10);
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
    expect(needle.requireAbility('copied:ally:0').isUsed).toBe(true);
    expect(ram.requireAbility('ally:0').isUsed).toBe(true);
    expect(player.attack).toBe(14);
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
