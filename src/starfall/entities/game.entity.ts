import { PlayerEntity } from './player.entity';
import { CardEntity } from './card.entity';
import { shuffleArray } from '../../shared/helpers/arrays.helpers';
import {
  cards as originalCards,
  TCardAbilitiesNames
} from '../domain/constants';
import { CardFromDb, PlayerFromDb } from '../domain/dbTypes';
import { DeckEntity } from './deck.entity';

interface GameEntityParams {
  players: PlayerFromDb[];
  currentPlayerId: string;
  gameCards: CardFromDb[];
}

const TRADE_ROW_SIZE = 5;

export class GameEntity {
  players: PlayerEntity[] = [];
  currentPlayer: PlayerEntity;
  tradeRow: DeckEntity;
  unusedDeck: DeckEntity; // игровая колода откуда добавляются новые карты
  explorers: DeckEntity;
  starterCards: DeckEntity;
  // TODO обрабатывать ли тут информацию для пользователя который запрашивает данные или отделить эту логику на уровне сервиса???

  constructor(params: GameEntityParams) {
    const unusedCards = this.createDeckFromDbCards(
      params.gameCards,
      'unused-deck'
    ).cards;

    this.tradeRow = this.createDeckFromDbCards(params.gameCards, 'trade-row');
    this.unusedDeck = new DeckEntity(
      unusedCards.filter((card) => card.card.deck === 'trade')
    );
    this.explorers = new DeckEntity([
      ...this.createDeckFromDbCards(params.gameCards, 'explorers').cards,
      ...unusedCards.filter((card) => card.card.deck === 'explorer')
    ]);
    this.starterCards = new DeckEntity(
      unusedCards.filter((card) => card.card.deck === 'starter')
    );

    params.players.forEach((player) => {
      const playerEntity = this.joinPlayer(player);
      if (player.id === params.currentPlayerId) {
        this.currentPlayer = playerEntity;
      }
    });
  }

  get defencePlayer() {
    return this.players.find((player) => player.id !== this.currentPlayer.id);
  }

  buyCard(cardId: string) {
    let card = this.tradeRow.getCardById(cardId);
    if (card) {
      this.currentPlayer.buyCard(card);
      const nextCardForTradeRow = this.unusedDeck.ejectCardsByCount(1)[0];
      if (nextCardForTradeRow) {
        this.tradeRow.replaceCard(card, nextCardForTradeRow);
      } else {
        this.tradeRow.ejectById(cardId);
      }
      return;
    }
    card = this.explorers.getCardById(cardId);

    if (card) {
      this.currentPlayer.buyCard(card);
      this.explorers.ejectById(cardId);
      return;
    }
    throw new Error('Card is unavailabale for trade');
  }

  useCardAbility(card: CardEntity, name: TCardAbilitiesNames) {
    card.useAbility(name, this);
  }

  attackPlayer() {
    if (!this.defencePlayer) {
      throw new Error('Unexpected player');
    }
    // TODO prevent for bases
    this.defencePlayer.reduceHp(this.currentPlayer.attack);
  }

  joinPlayer(player: PlayerFromDb) {
    const pileDeck = this.createDeckFromDbCards(
      player.cards,
      'player-pile-deck'
    );
    const deck = this.createDeckFromDbCards(player.cards, 'player-deck');
    const hand = this.createDeckFromDbCards(player.cards, 'player-hand');
    const bases = this.createDeckFromDbCards(player.cards, 'player-bases');
    const heroes = this.createDeckFromDbCards(player.cards, 'player-heroes');
    const currentPlayedCards = this.createDeckFromDbCards(
      player.cards,
      'currently-played'
    );

    if (!player.cards.length) {
      deck.addCards(this.starterCards.ejectCardsByNameAndCount('Trooper', 2));
      deck.addCards(this.starterCards.ejectCardsByNameAndCount('Scout', 8));
    }

    const playerEntity = new PlayerEntity({
      id: player.id,
      hp: player.hp,
      pileDeck,
      deck,
      hand,
      bases,
      heroes,
      money: player.money,
      attack: player.attack,
      discardCardsCount: player.discardCardsCount,
      currentPlayedCards
    });

    this.players.push(playerEntity);

    return playerEntity;
  }

  createCardsListFromDb(cards: CardFromDb[]) {
    return cards.map((card) => {
      const original = originalCards.find((c) => c.name === card.name);
      if (!original) {
        throw new Error('No originalCardFound');
      }
      return new CardEntity({
        card: original,
        id: card.id,
        isPlayed: card.isPlayed,
        usedAbilities: []
      });
    });
  }

  initNewGame(initialCards: CardFromDb[]) {
    const cards = this.createCardsListFromDb(initialCards);

    this.explorers = new DeckEntity(
      cards.filter((card) => card.card.deck === 'explorer')
    );
    this.starterCards = new DeckEntity(
      cards.filter((card) => card.card.deck === 'starter')
    );
    this.unusedDeck = new DeckEntity(
      shuffleArray(cards.filter((card) => card.card.deck === 'trade'))
    );

    this.initTradeRow();
  }

  initTradeRow() {
    this.tradeRow = new DeckEntity(
      this.unusedDeck.ejectCardsByCount(TRADE_ROW_SIZE)
    );
  }

  createDeckFromDbCards(cards: CardFromDb[], deckName: CardFromDb['deck']) {
    return new DeckEntity(
      this.createCardsListFromDb(cards.filter((card) => card.deck === deckName))
    );
  }
}
