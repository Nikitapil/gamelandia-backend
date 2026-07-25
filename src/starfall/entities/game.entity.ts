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
  players: PlayerEntity[];
  currentPlayer: PlayerEntity;
  tradeRow: DeckEntity;
  unusedDeck: DeckEntity; // игровая колода откуда добавляются новые карты
  explorers: DeckEntity;
  // TODO обрабатывать ли тут информацию для пользователя который запрашивает данные или отделить эту логику на уровне сервиса???

  constructor(params: GameEntityParams) {
    this.tradeRow = this.createDeckFromDbCards(params.gameCards, 'trade-row');
    this.unusedDeck = this.createDeckFromDbCards(
      params.gameCards,
      'unused-deck'
    );
    this.explorers = this.createDeckFromDbCards(params.gameCards, 'explorers');

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
    const card = this.tradeRow.getCardById(cardId);
    if (card) {
      this.currentPlayer.buyCard(card);
      this.tradeRow.replaceCard(card, this.unusedDeck.ejectCardsByCount(1)[0]);
    }
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

    if (!player.cards.length) {
      deck.updateCards(this.unusedDeck.ejectCardsByNameAndCount('Trooper', 2));
      deck.updateCards(this.unusedDeck.ejectCardsByNameAndCount('Scout', 8));
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
      discardCardsCount: player.discardCardsCount
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
    this.unusedDeck = new DeckEntity(
      shuffleArray(this.createCardsListFromDb(initialCards))
    );
    this.initTradeRow();
    this.initExplorers();
  }

  initTradeRow() {
    this.tradeRow = new DeckEntity(
      this.unusedDeck.ejectCardsByCount(TRADE_ROW_SIZE)
    );
  }

  initExplorers() {
    this.explorers = new DeckEntity(
      this.unusedDeck.ejectCardsByName('Explorer')
    );
  }

  createDeckFromDbCards(cards: CardFromDb[], deckName: CardFromDb['deck']) {
    return new DeckEntity(
      this.createCardsListFromDb(cards.filter((card) => card.deck === deckName))
    );
  }
}
