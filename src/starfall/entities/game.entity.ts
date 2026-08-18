import { v4 as randomUUID } from 'uuid';
import {
  Action,
  CardTrigger,
  cards as originalCards,
  FractionType,
  TCardAbilitiesNames
} from '../domain/constants';
import {
  CardFromDb,
  GameStatus,
  PendingAction,
  PlayerFromDb,
  SerializedAction,
  StarfallSnapshot
} from '../domain/dbTypes';
import { Ability } from './abilities/ability.entity';
import { CardEntity } from './card.entity';
import { DeckEntity } from './deck.entity';
import { PlayerEntity } from './player.entity';

export interface GameEntityParams {
  id?: string;
  startingHp?: number;
  players: PlayerFromDb[];
  currentPlayerId?: string | null;
  gameCards: CardFromDb[];
  status?: GameStatus;
  turnNumber?: number;
  version?: number;
  pendingAction?: PendingAction | null;
  processedCommandIds?: string[];
}

export interface PendingSelection {
  cardId?: string;
  cardIds?: string[];
  optionIndex?: number;
  cancel?: boolean;
}

interface ExecuteCommandParams<T> {
  commandId: string;
  expectedVersion: number;
  command: () => T;
}

interface UseCardAbilityParams {
  playerId: string;
  cardId: string;
  abilityId: string;
}

interface ExecuteActionsParams {
  actions: Action[];
  source: CardEntity;
  abilityId: string;
}

interface ExecuteActionParams {
  action: Action;
  source: CardEntity;
  abilityId: string;
  continuation: SerializedAction[];
}

interface ExecuteContinuationParams {
  continuation: SerializedAction[];
  source: CardEntity;
  abilityId: string;
}

interface SerializeCardParams {
  card: CardEntity;
  deck: CardFromDb['deck'];
  ownerId?: string;
  position: number;
}

const TRADE_ROW_SIZE = 5;
const HAND_SIZE = 5;

export class GameEntity {
  readonly id: string;
  readonly startingHp: number;
  readonly players: PlayerEntity[] = [];
  currentPlayer: PlayerEntity | null = null;
  tradeRow = new DeckEntity([], 'trade-row');
  unusedDeck = new DeckEntity([], 'unused-deck');
  explorers = new DeckEntity([], 'explorers');
  starterCards = new DeckEntity([], 'starter-cards');
  scrappedCards = new DeckEntity([], 'scrapped');
  status: GameStatus;
  turnNumber: number;
  version: number;
  pendingAction: PendingAction | null;
  readonly processedCommandIds: Set<string>;

  constructor(params: GameEntityParams) {
    this.id = params.id ?? randomUUID();
    this.startingHp = params.startingHp ?? 50;
    this.status = params.status ?? 'waiting';
    this.turnNumber = params.turnNumber ?? 0;
    this.version = params.version ?? 0;
    this.pendingAction = params.pendingAction ?? null;
    this.processedCommandIds = new Set(params.processedCommandIds ?? []);

    const globalCards = this.createCardsListFromDb(params.gameCards);
    this.tradeRow = this.zone(globalCards, 'trade-row');
    this.unusedDeck = this.zone(globalCards, 'unused-deck');
    this.explorers = this.zone(globalCards, 'explorers');
    this.starterCards = this.zone(globalCards, 'starter-cards');
    this.scrappedCards = this.zone(globalCards, 'scrapped');

    params.players.forEach((player) => this.joinPlayer(player));
    this.currentPlayer =
      this.players.find((player) => player.id === params.currentPlayerId) ??
      null;
    this.players.forEach((player) => {
      player.currentPlayedCards.cards.forEach((source) => {
        if (!source.copiedCardId) return;
        const copied = player.currentPlayedCards.getCardById(
          source.copiedCardId
        );
        if (copied) source.applyCopy(copied);
      });
    });
  }

  get winner() {
    return this.players.find((player) => player.isWinner) ?? null;
  }

  get defencePlayer() {
    if (!this.currentPlayer) {
      return null;
    }
    return (
      this.players.find((player) => player.id !== this.currentPlayer?.id) ??
      null
    );
  }

  get allCards() {
    return [
      ...this.tradeRow.cards,
      ...this.unusedDeck.cards,
      ...this.explorers.cards,
      ...this.starterCards.cards,
      ...this.scrappedCards.cards,
      ...this.players.flatMap((player) => [
        ...player.deck.cards,
        ...player.hand.cards,
        ...player.pileDeck.cards,
        ...player.bases.cards,
        ...player.currentPlayedCards.cards,
        ...player.heroes.cards
      ])
    ];
  }

  executeCommand<T>({
    commandId,
    expectedVersion,
    command
  }: ExecuteCommandParams<T>): T | undefined {
    if (this.processedCommandIds.has(commandId)) {
      return undefined;
    }
    if (expectedVersion !== this.version) {
      throw new Error(
        `State version conflict: expected ${expectedVersion}, actual ${this.version}`
      );
    }
    const result = command();
    this.processedCommandIds.add(commandId);
    this.version++;
    return result;
  }

  initNewGame(initialCards: CardFromDb[]) {
    if (this.status !== 'waiting' || this.turnNumber > 0) {
      throw new Error('Only a new waiting game can be initialized');
    }
    const cards = this.createCardsListFromDb(initialCards);
    this.tradeRow.clear();
    this.scrappedCards.clear();
    this.explorers.replaceAll(
      cards.filter((card) => card.card.deck === 'explorer')
    );
    this.starterCards.replaceAll(
      cards.filter((card) => card.card.deck === 'starter')
    );
    this.unusedDeck.replaceAll(
      cards.filter((card) => card.card.deck === 'trade')
    );
    this.unusedDeck.shuffle();
    this.fillTradeRow();
    this.dealStarterDecks();
  }

  addPlayer(playerId: string) {
    if (this.status !== 'waiting' || this.turnNumber > 0) {
      throw new Error('Players can join only a waiting game');
    }
    if (this.players.length >= 2) {
      throw new Error('The game already has two players');
    }
    if (this.players.some((player) => player.id === playerId)) {
      throw new Error('The player has already joined this game');
    }
    const player = new PlayerEntity({ id: playerId, hp: this.startingHp });
    this.players.push(player);
    this.dealStarterDecks();
    return player;
  }

  startGame(requestedFirstPlayerId?: string) {
    if (this.status !== 'waiting') {
      throw new Error('Only a waiting game can be started');
    }
    if (this.players.length !== 2) {
      throw new Error('A Starfall game requires exactly two players');
    }
    if (this.winner) {
      throw new Error('A new game cannot already have a winner');
    }
    this.dealStarterDecks();
    this.currentPlayer =
      this.players.find((player) => player.id === requestedFirstPlayerId) ??
      this.currentPlayer ??
      this.players[0];

    if (!this.currentPlayer) {
      throw new Error('The current player does not exist');
    }
    this.players.forEach((player) => player.deck.shuffle());
    const second = this.players.find(
      (player) => player.id !== this.currentPlayer?.id
    );

    if (!second) {
      throw new Error('The second player does not exist');
    }

    if (!this.currentPlayer.hand.size) {
      this.currentPlayer.getCardsFromDeck(3);
    }
    if (!second.hand.size) {
      second.getCardsFromDeck(5);
    }
    this.status = 'active';
    this.turnNumber = 1;
    this.currentPlayer.startTurn();
  }

  endTurn(playerId: string) {
    if (!this.currentPlayer) {
      throw new Error('The current player does not exist');
    }
    this.assertCanAct(playerId);
    this.assertNoPendingAction();
    const previous = this.currentPlayer;
    previous.finishTurn();
    const next = this.defencePlayer;
    if (!next) {
      throw new Error('The second player does not exist');
    }
    this.currentPlayer = next;
    this.turnNumber++;
    next.getCardsFromDeck(HAND_SIZE - next.hand.size);
    next.startTurn();
    this.prepareOpponentDiscard(next);
  }

  playCard(playerId: string, cardId: string) {
    this.assertCanAct(playerId);
    this.assertNoPendingAction();
    const player = this.currentPlayer;
    if (!player) {
      throw new Error('The current player does not exist');
    }
    const card = player.takeCardFromHand(cardId);
    try {
      player.putCardInPlay(card);
      if (card.card.type === 'ship') {
        this.executePersistentAbilities(player, 'ship_played');
        for (const ability of card.abilities) {
          if (this.pendingAction) break;
          this.executeAbility(card, ability);
        }
      }
      return card;
    } catch (error) {
      player.hand.add(card);
      throw error;
    }
  }

  buyCard(playerId: string, cardId: string) {
    this.assertCanAct(playerId);
    this.assertNoPendingAction();
    const player = this.currentPlayer!;
    const isExplorer = this.explorers.has(cardId);
    const source = isExplorer ? this.explorers : this.tradeRow;
    const card = source.requireCardById(cardId);
    player.payFor(card);
    source.removeById(cardId);
    const destination =
      player.nextShipToTop && card.card.type === 'ship' ? 'top' : 'discard';
    player.acquire(card, destination);
    if (destination === 'top') player.nextShipToTop = false;
    if (!isExplorer) this.fillTradeRow();
    return card;
  }

  useCardAbility({ playerId, cardId, abilityId }: UseCardAbilityParams) {
    this.assertCanAct(playerId);
    this.assertNoPendingAction();
    const card = this.requireCurrentPlayersCardInPlay(cardId);
    if (!this.canUseCardAbility(card, abilityId)) {
      throw new Error(`Ability ${abilityId} is not currently available`);
    }
    const ability = card.requireAbility(abilityId);
    this.executeAbility(card, ability);
  }

  canUseCardAbility(card: CardEntity, abilityId: string) {
    const ability = card.requireAbility(abilityId);
    return (
      card.canUseAbility(abilityId) &&
      (ability.kind !== 'ally' || this.hasAllyFor(card))
    );
  }

  private executeAbility(source: CardEntity, ability: Ability) {
    if (ability.isUsed) {
      throw new Error(`Ability ${ability.id} has already been used`);
    }
    if (!this.currentPlayer?.cardsInPlay.includes(source)) {
      throw new Error('The source card is not in play');
    }
    if (ability.kind === 'ally' && !this.hasAllyFor(source)) {
      throw new Error('The ally condition is not satisfied');
    }
    if (ability.kind === 'scrap') {
      this.scrapPlayedCard(source);
    }
    this.executeActions({
      actions: [ability.action],
      source,
      abilityId: ability.id
    });
    ability.markAsUsed();
  }

  private executePersistentAbilities(
    player: PlayerEntity,
    trigger: CardTrigger
  ) {
    for (const card of player.cardsInPlay) {
      card.card.persistentAbilities.forEach((ability, index) => {
        if (ability.trigger !== trigger) return;
        this.executeActions({
          actions: [ability.action],
          source: card,
          abilityId: `persistent:${trigger}:${index}`
        });
      });
    }
  }

  executeActions({ actions, source, abilityId }: ExecuteActionsParams) {
    for (let index = 0; index < actions.length; index++) {
      const action = actions[index];
      const continuation = actions.slice(index + 1);
      if (this.executeAction({ action, source, abilityId, continuation })) {
        return;
      }
    }
  }

  resolvePendingAction(playerId: string, selection: PendingSelection) {
    this.assertActive();
    const pending = this.pendingAction;
    if (!pending) throw new Error('There is no pending action');
    if (pending.playerId !== playerId) {
      throw new Error('This pending action belongs to another player');
    }
    const player = this.requirePlayer(playerId);
    this.pendingAction = null;

    if (pending.type === 'discard_for_opponent') {
      const ids = selection.cardIds ?? [];
      const required = Math.min(pending.count, player.hand.size);
      if (ids.length !== required || new Set(ids).size !== ids.length) {
        throw new Error(`Exactly ${required} distinct cards must be discarded`);
      }
      ids.forEach((id) => player.pileDeck.add(player.hand.removeById(id)));
      player.discardCardsCount = 0;
      return;
    }

    const source =
      this.allCards.find((card) => card.id === pending.sourceCardId) ??
      this.scrappedCards.getCardById(pending.sourceCardId);
    if (!source) throw new Error('Pending action source no longer exists');

    switch (pending.type) {
      case 'choose_cards_to_scrap': {
        const ids = selection.cardIds ?? [];
        if (
          ids.length < pending.min ||
          ids.length > pending.max ||
          new Set(ids).size !== ids.length
        ) {
          throw new Error(
            `Choose between ${pending.min} and ${pending.max} distinct cards`
          );
        }
        ids.forEach((id) => {
          const zone = pending.zones
            .map((name) =>
              name === 'player-hand' ? player.hand : player.pileDeck
            )
            .find((deck) => deck.has(id));
          if (!zone) throw new Error(`Card ${id} cannot be scrapped`);
          const card = zone.removeById(id);
          card.leavePlay();
          this.scrappedCards.add(card);
        });
        player.getCardsFromDeck(ids.length * pending.drawPerScrapped);
        break;
      }
      case 'choose_trade_card_to_scrap': {
        if (selection.cancel && pending.optional) break;
        if (!selection.cardId) throw new Error('A trade card must be selected');
        const card = this.tradeRow.removeById(selection.cardId);
        card.leavePlay();
        this.scrappedCards.add(card);
        this.fillTradeRow();
        break;
      }
      case 'choose_base_to_destroy': {
        if ((selection.cancel && pending.optional) || !this.defencePlayer) {
          break;
        }
        if (!selection.cardId) throw new Error('A base must be selected');
        this.destroyBase(this.defencePlayer, selection.cardId);
        break;
      }
      case 'discard_then_draw': {
        const ids = selection.cardIds ?? [];
        if (ids.length > pending.max || new Set(ids).size !== ids.length) {
          throw new Error(`Choose at most ${pending.max} distinct cards`);
        }
        ids.forEach((id) => player.pileDeck.add(player.hand.removeById(id)));
        player.getCardsFromDeck(ids.length);
        break;
      }
      case 'choose_ship_to_copy': {
        if (selection.cancel) break;
        if (!selection.cardId) throw new Error('A ship must be selected');
        const copied = player.currentPlayedCards.requireCardById(
          selection.cardId
        );
        if (copied.id === source.id || copied.card.type !== 'ship') {
          throw new Error('Stealth Needle must copy another played ship');
        }
        source.applyCopy(copied);
        player.addMoney(copied.card.money);
        player.addAttack(copied.card.attack);
        this.executeActions({
          actions: copied.card.abilities,
          source,
          abilityId: pending.abilityId
        });
        break;
      }
      case 'choose_free_ship': {
        if (selection.cancel) break;
        if (!selection.cardId) throw new Error('A ship must be selected');
        const card = this.tradeRow.requireCardById(selection.cardId);
        if (card.card.type !== 'ship') {
          throw new Error('Only a ship can be acquired');
        }
        this.tradeRow.removeById(card.id);
        player.acquire(card, 'top');
        this.fillTradeRow();
        break;
      }
      case 'choose_effect': {
        const option = pending.options[selection.optionIndex ?? -1];
        if (!option) throw new Error('A valid effect option must be selected');
        this.executeActions({
          actions: option as Action[],
          source,
          abilityId: pending.abilityId
        });
        if (this.pendingAction) {
          this.appendContinuation(pending.continuation);
          return;
        }
        break;
      }
    }

    this.executeContinuation({
      continuation: pending.continuation,
      source,
      abilityId: pending.abilityId
    });
  }

  cancelPendingAction(playerId: string) {
    this.resolvePendingAction(playerId, { cancel: true });
  }

  attackBase(playerId: string, baseId: string) {
    if (!this.defencePlayer || !this.currentPlayer) {
      throw new Error('Game not started');
    }
    this.assertCanAct(playerId);
    this.assertNoPendingAction();
    const defender = this.defencePlayer;
    const base = defender.bases.requireCardById(baseId);
    const outposts = defender.bases.cards.filter((card) => card.card.outpost);
    if (outposts.length && !base.card.outpost) {
      throw new Error('An outpost must be destroyed first');
    }
    const defense = base.currentDefense ?? base.card.health ?? 0;
    if (this.currentPlayer.attack < defense) {
      throw new Error('Not enough combat to destroy this base');
    }
    this.currentPlayer.attack -= defense;
    this.destroyBase(defender, baseId);
  }

  attackPlayer(playerId: string, amount: number) {
    if (!this.defencePlayer || !this.currentPlayer) {
      throw new Error('Game not started');
    }
    this.assertCanAct(playerId);
    this.assertNoPendingAction();
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Combat amount must be a positive integer');
    }
    const defender = this.defencePlayer;
    if (defender.bases.cards.some((card) => card.card.outpost)) {
      throw new Error('The opponent is protected by an outpost');
    }
    if (this.currentPlayer.attack < amount) {
      throw new Error('Not enough combat');
    }
    this.currentPlayer.attack -= amount;
    defender.reduceHp(amount);
    if (defender.hp === 0) {
      this.finishGame(this.currentPlayer.id);
    }
  }

  finishGame(winnerId: string) {
    if (this.status !== 'active') {
      throw new Error('Only an active game can be finished');
    }
    const winner = this.requirePlayer(winnerId);
    this.players.forEach((player) => {
      player.isWinner = false;
    });
    winner.isWinner = true;
    this.status = 'finished';
    this.pendingAction = null;
  }

  hasAllyFor(source: CardEntity) {
    if (!this.currentPlayer) {
      throw new Error('Game not started');
    }
    const fraction = this.effectiveFraction(source);
    if (fraction === 'none') return false;
    return this.currentPlayer.cardsInPlay.some((candidate) => {
      if (candidate.id === source.id) return false;
      const copied = candidate.copiedCardId
        ? this.currentPlayer?.currentPlayedCards.getCardById(
            candidate.copiedCardId
          )
        : undefined;
      return candidate.hasFraction(fraction, copied);
    });
  }

  getViewFor(playerId: string) {
    const viewer = this.requirePlayer(playerId);
    return {
      id: this.id,
      startingHp: this.startingHp,
      status: this.status,
      currentPlayerId: this.currentPlayer?.id ?? null,
      winnerId: this.winner?.id ?? null,
      turnNumber: this.turnNumber,
      version: this.version,
      pendingAction:
        this.pendingAction?.playerId === playerId ? this.pendingAction : null,
      tradeRow: this.tradeRow.cards.map((card) => this.publicCard(card)),
      explorersCount: this.explorers.size,
      unusedTradeDeckCount: this.unusedDeck.size,
      scrappedCards: this.scrappedCards.cards.map((card) =>
        this.publicCard(card)
      ),
      players: this.players.map((player) => ({
        id: player.id,
        hp: player.hp,
        money: player.money,
        attack: player.attack,
        isWinner: player.isWinner,
        hand:
          player.id === viewer.id
            ? player.hand.cards.map((card) => this.publicCard(card))
            : undefined,
        handCount: player.hand.size,
        deckCount: player.deck.size,
        discard: player.pileDeck.cards.map((card) => this.publicCard(card)),
        bases: player.bases.cards.map((card) => this.publicCard(card)),
        playedShips: player.currentPlayedCards.cards.map((card) =>
          this.publicCard(card)
        )
      }))
    };
  }

  toSnapshot(): StarfallSnapshot {
    const cards: CardFromDb[] = [];
    const pushZone = ({
      deck,
      zone,
      ownerId
    }: {
      deck: DeckEntity;
      zone: CardFromDb['deck'];
      ownerId?: string;
    }) =>
      deck.cards.forEach((card, position) =>
        cards.push(this.serializeCard({ card, deck: zone, ownerId, position }))
      );
    pushZone({ deck: this.tradeRow, zone: 'trade-row' });
    pushZone({ deck: this.unusedDeck, zone: 'unused-deck' });
    pushZone({ deck: this.explorers, zone: 'explorers' });
    pushZone({ deck: this.starterCards, zone: 'starter-cards' });
    pushZone({ deck: this.scrappedCards, zone: 'scrapped' });
    this.players.forEach((player) => {
      pushZone({ deck: player.deck, zone: 'player-deck', ownerId: player.id });
      pushZone({ deck: player.hand, zone: 'player-hand', ownerId: player.id });
      pushZone({
        deck: player.pileDeck,
        zone: 'player-pile-deck',
        ownerId: player.id
      });
      pushZone({
        deck: player.bases,
        zone: 'player-bases',
        ownerId: player.id
      });
      pushZone({
        deck: player.currentPlayedCards,
        zone: 'currently-played',
        ownerId: player.id
      });
    });
    return {
      id: this.id,
      startingHp: this.startingHp,
      status: this.status,
      currentPlayerId: this.currentPlayer?.id ?? null,
      turnNumber: this.turnNumber,
      version: this.version,
      pendingAction: this.pendingAction,
      processedCommandIds: [...this.processedCommandIds],
      cards,
      players: this.players.map((player) => ({
        id: player.id,
        cards: cards.filter((card) => card.ownerId === player.id),
        money: player.money,
        attack: player.attack,
        hp: player.hp,
        discardCardsCount: player.discardCardsCount,
        isWinner: player.isWinner,
        nextShipToTop: player.nextShipToTop
      }))
    };
  }

  static fromSnapshot(snapshot: StarfallSnapshot) {
    const playerCardIds = new Set(
      snapshot.players.flatMap((player) =>
        snapshot.cards
          .filter((card) => card.ownerId === player.id)
          .map((card) => card.id)
      )
    );
    return new GameEntity({
      id: snapshot.id,
      startingHp: snapshot.startingHp,
      status: snapshot.status,
      currentPlayerId: snapshot.currentPlayerId,
      turnNumber: snapshot.turnNumber,
      version: snapshot.version,
      pendingAction: snapshot.pendingAction,
      processedCommandIds: snapshot.processedCommandIds,
      gameCards: snapshot.cards.filter((card) => !playerCardIds.has(card.id)),
      players: snapshot.players.map((player) => ({
        ...player,
        cards: snapshot.cards.filter((card) => card.ownerId === player.id)
      }))
    });
  }

  private executeAction({
    action,
    source,
    abilityId,
    continuation
  }: ExecuteActionParams) {
    if (!this.currentPlayer || !this.defencePlayer) {
      throw new Error('Unable to execute action');
    }
    const player = this.currentPlayer;
    switch (action.name) {
      case TCardAbilitiesNames.PLUS_ATTACK:
        player.addAttack(action.value);
        return false;
      case TCardAbilitiesNames.PLUS_MONEY:
        player.addMoney(action.value);
        return false;
      case TCardAbilitiesNames.PLUS_AUTHORITY:
        player.addHp(action.value);
        return false;
      case TCardAbilitiesNames.GET_CARDS:
        player.getCardsFromDeck(action.value);
        return false;
      case TCardAbilitiesNames.DISCARD_OPPONENT_CARD:
        this.defencePlayer.discardCardsCount += action.value;
        return false;
      case TCardAbilitiesNames.SCRAP_CARD_FROM_HAND:
      case TCardAbilitiesNames.SCRAP_CARD_FROM_PILE:
      case TCardAbilitiesNames.SCRAP_CARD_FROM_HAND_OR_PILE: {
        const max =
          action.name === TCardAbilitiesNames.SCRAP_CARD_FROM_HAND_OR_PILE
            ? action.max
            : 1;
        const optional =
          action.name === TCardAbilitiesNames.SCRAP_CARD_FROM_HAND_OR_PILE
            ? action.optional
            : false;
        this.pendingAction = {
          type: 'choose_cards_to_scrap',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          zones:
            action.name === TCardAbilitiesNames.SCRAP_CARD_FROM_HAND
              ? ['player-hand']
              : action.name === TCardAbilitiesNames.SCRAP_CARD_FROM_PILE
              ? ['player-pile-deck']
              : ['player-hand', 'player-pile-deck'],
          min: optional ? 0 : 1,
          max,
          drawPerScrapped:
            action.name === TCardAbilitiesNames.SCRAP_CARD_FROM_HAND_OR_PILE
              ? action.drawPerScrapped ?? 0
              : 0,
          continuation
        };
        return true;
      }
      case TCardAbilitiesNames.SCRAP_CARD_FROM_TRADE_ROW:
        this.pendingAction = {
          type: 'choose_trade_card_to_scrap',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          optional: true,
          continuation
        };
        return true;
      case TCardAbilitiesNames.DESTROY_BASE:
        if (!this.defencePlayer?.bases.size) return false;
        this.pendingAction = {
          type: 'choose_base_to_destroy',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          optional: action.optional,
          continuation
        };
        return true;
      case TCardAbilitiesNames.DISCARD_THEN_DRAW:
        this.pendingAction = {
          type: 'discard_then_draw',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          max: action.max,
          continuation
        };
        return true;
      case TCardAbilitiesNames.PUT_NEXT_SHIP_ON_TOP:
        player.nextShipToTop = true;
        return false;
      case TCardAbilitiesNames.ACQUIRE_SHIP_FOR_FREE_ON_TOP:
        if (!this.tradeRow.cards.some((card) => card.card.type === 'ship')) {
          return false;
        }
        this.pendingAction = {
          type: 'choose_free_ship',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          continuation
        };
        return true;
      case TCardAbilitiesNames.COPY_SHIP:
        if (
          !player.currentPlayedCards.cards.some((card) => card.id !== source.id)
        ) {
          return false;
        }
        this.pendingAction = {
          type: 'choose_ship_to_copy',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          continuation
        };
        return true;
      case TCardAbilitiesNames.ALL_FACTIONS_ALLY:
        return false;
      case TCardAbilitiesNames.DRAW_PER_FACTION_CARD: {
        const count = player.cardsInPlay.filter(
          (card) => card.card.fraction === action.fraction
        ).length;
        player.getCardsFromDeck(count);
        return false;
      }
      case TCardAbilitiesNames.SEQUENCE:
        this.executeActions({
          actions: [...action.actions, ...(continuation as Action[])],
          source,
          abilityId
        });
        return true;
      case TCardAbilitiesNames.CHOOSE_ONE:
        this.pendingAction = {
          type: 'choose_effect',
          playerId: player.id,
          sourceCardId: source.id,
          abilityId,
          options: action.options as SerializedAction[][],
          continuation
        };
        return true;
      case TCardAbilitiesNames.IF_BASES_IN_PLAY:
        if (player.bases.size >= action.min) {
          this.executeActions({
            actions: [...action.actions, ...(continuation as Action[])],
            source,
            abilityId
          });
          return true;
        }
        return false;
    }
  }

  private prepareOpponentDiscard(player: PlayerEntity) {
    if (!player.discardCardsCount) return;
    if (!player.hand.size) {
      player.discardCardsCount = 0;
      return;
    }
    this.pendingAction = {
      type: 'discard_for_opponent',
      playerId: player.id,
      count: Math.min(player.discardCardsCount, player.hand.size)
    };
  }

  private executeContinuation({
    continuation,
    source,
    abilityId
  }: ExecuteContinuationParams) {
    if (continuation.length) {
      this.executeActions({
        actions: continuation as Action[],
        source,
        abilityId
      });
    }
  }

  private appendContinuation(continuation: SerializedAction[]) {
    if (!this.pendingAction || !('continuation' in this.pendingAction)) return;
    this.pendingAction.continuation.push(...continuation);
  }

  private scrapPlayedCard(card: CardEntity) {
    if (!this.currentPlayer) {
      throw new Error('player not found');
    }
    const player = this.currentPlayer;
    const removed =
      player.currentPlayedCards.tryRemoveById(card.id) ??
      player.bases.tryRemoveById(card.id);
    if (!removed) throw new Error('Only a card in play can scrap itself');
    removed.leavePlay();
    this.scrappedCards.add(removed);
  }

  private destroyBase(owner: PlayerEntity, baseId: string) {
    const base = owner.bases.removeById(baseId);
    base.leavePlay();
    owner.pileDeck.add(base);
  }

  private fillTradeRow() {
    this.tradeRow.addMany(
      this.unusedDeck.takeTop(TRADE_ROW_SIZE - this.tradeRow.size)
    );
  }

  private dealStarterDecks() {
    this.players.forEach((player) => {
      if (
        player.deck.size ||
        player.hand.size ||
        player.pileDeck.size ||
        player.currentPlayedCards.size
      ) {
        return;
      }
      player.deck.addMany(this.starterCards.takeByName('Trooper', 2));
      player.deck.addMany(this.starterCards.takeByName('Scout', 8));
      if (player.deck.size !== 10) {
        throw new Error('There are not enough starter cards for both players');
      }
    });
  }

  private joinPlayer(player: PlayerFromDb) {
    const cards = this.createCardsListFromDb(player.cards);
    const entity = new PlayerEntity({
      id: player.id,
      hp: player.hp,
      pileDeck: this.zone(cards, 'player-pile-deck'),
      deck: this.zone(cards, 'player-deck'),
      hand: this.zone(cards, 'player-hand'),
      bases: this.zone(cards, 'player-bases'),
      heroes: new DeckEntity(),
      currentPlayedCards: this.zone(cards, 'currently-played'),
      money: player.money,
      attack: player.attack,
      discardCardsCount: player.discardCardsCount,
      isWinner: player.isWinner,
      nextShipToTop: player.nextShipToTop
    });
    this.players.push(entity);
    return entity;
  }

  private createCardsListFromDb(cards: CardFromDb[]) {
    return cards
      .slice()
      .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
      .map((card) => {
        const original = originalCards.find((item) => item.name === card.name);
        if (!original) throw new Error(`Unknown card definition: ${card.name}`);
        return new CardEntity({
          card: original,
          id: card.id,
          isPlayed: card.isPlayed,
          playedThisTurn: card.playedThisTurn,
          usedAbilities: card.usedAbilities,
          currentDefense: card.currentDefense,
          copiedCardId: card.copiedCardId,
          zone: card.deck
        });
      });
  }

  private zone(entities: CardEntity[], zone: CardFromDb['deck']) {
    return new DeckEntity(
      entities.filter((entity) => entity.zone === zone),
      zone
    );
  }

  private assertActive() {
    if (this.status !== 'active') {
      throw new Error('Game actions are only allowed in an active game');
    }
  }

  private assertCanAct(playerId: string) {
    this.assertActive();
    if (!this.currentPlayer || this.currentPlayer.id !== playerId) {
      throw new Error('It is not this player’s turn');
    }
  }

  private assertNoPendingAction() {
    if (this.pendingAction) {
      throw new Error('The pending action must be resolved first');
    }
  }

  private requirePlayer(playerId: string) {
    const player = this.players.find((item) => item.id === playerId);
    if (!player) throw new Error(`Player ${playerId} is not in this game`);
    return player;
  }

  private requireCurrentPlayersCardInPlay(cardId: string) {
    const card = this.currentPlayer?.cardsInPlay.find(
      (item) => item.id === cardId
    );
    if (!card) throw new Error('The card is not in the current player’s play');
    return card;
  }

  private effectiveFraction(card: CardEntity): FractionType {
    if (card.copiedCardId) {
      return (
        this.currentPlayer?.currentPlayedCards.getCardById(card.copiedCardId)
          ?.card.fraction ?? card.card.fraction
      );
    }
    return card.card.fraction;
  }

  private publicCard(card: CardEntity) {
    return {
      id: card.id,
      ...card.card,
      currentDefense: card.currentDefense,
      playedThisTurn: card.playedThisTurn,
      usedAbilities: card.usedAbilities
    };
  }

  private serializeCard({
    card,
    deck,
    ownerId,
    position
  }: SerializeCardParams): CardFromDb {
    return {
      id: card.id,
      name: card.card.name,
      deck,
      ownerId: ownerId ?? null,
      position,
      isPlayed: card.isPlayed,
      playedThisTurn: card.playedThisTurn,
      usedAbilities: card.usedAbilities,
      currentDefense: card.currentDefense,
      copiedCardId: card.copiedCardId
    };
  }
}
