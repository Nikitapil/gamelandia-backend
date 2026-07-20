import { PlayerEntity } from './player.entity';
import { CardEntity } from './card.entity';
import { shuffleArray } from '../../shared/helpers/arrays.helpers';
import { cards as originalCards } from '../domain/constants';
import { CardFromDb, PlayerFromDb } from '../domain/dbTypes';
import { DeckEntity } from './deck.entity';

interface GameEntityParams {}

const TRADE_ROW_SIZE = 5;

export class GameEntity {
  players: PlayerEntity[];
  currentPlayer: PlayerEntity;
  tradeRow: DeckEntity;
  unusedDeck: DeckEntity; // игровая колода откуда добавляются новые карты
  explorers: DeckEntity;
  // TODO обрабатывать ли тут информацию для пользователя который запрашивает данные или отделить эту логику на уровне сервиса???

  constructor(params: GameEntityParams) {}

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

  useCardAbility() {}

  attackPlayer() {
    if (!this.defencePlayer) {
      throw new Error('Unexpected player');
    }
    // TODO prevent for bases
    this.defencePlayer.hp -= this.currentPlayer.attack;
  }

  initNewGameData() {}

  joinPlayer(player: PlayerFromDb) {
    const pileDeck = new DeckEntity(
      this.createCardsListFromDb(
        player.cards.filter((card) => card.deck === 'player-pile-deck')
      )
    );
    const deck = new DeckEntity(
      this.createCardsListFromDb(
        player.cards.filter((card) => card.deck === 'player-deck')
      )
    );
    const hand = new DeckEntity(
      this.createCardsListFromDb(
        player.cards.filter((card) => card.deck === 'player-hand')
      )
    );
    const bases = new DeckEntity(
      this.createCardsListFromDb(
        player.cards.filter((card) => card.deck === 'player-bases')
      )
    );
    const heroes = new DeckEntity([]);
    if (!player.cards.length) {
      // TODO add started Cards
    }

    this.players.push(
      new PlayerEntity({
        id: player.id,
        hp: player.hp,
        pileDeck,
        deck,
        hand,
        bases,
        heroes,
        money: player.money,
        attack: player.attack
      })
    );
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
        isPlayed: card.isPlayed
      });
    });
  }

  initNewGame(initialCards: CardFromDb[]) {
    this.unusedDeck = new DeckEntity(
      shuffleArray(this.createCardsListFromDb(initialCards))
    );
    this.initTradeRow();
    this.initExplorers();
    // TODO Continue here
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
}
