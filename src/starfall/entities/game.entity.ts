import { PlayerEntity } from './player.entity';
import { CardEntity } from './card.entity';
import { shuffleArray } from '../../shared/helpers/arrays.helpers';
import { cards as originalCards } from '../domain/constants';
import { CardFromDb } from '../domain/dbTypes';
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

  buyCard() {}

  useCardAbility() {}

  attackPlayer() {}

  initNewGameData() {}

  joinPlayer() {}

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
    this.tradeRow = new DeckEntity(this.unusedDeck.ejectCardsByCount(5));
  }

  initExplorers() {
    this.explorers = new DeckEntity(
      this.unusedDeck.ejectCardsByName('Explorer')
    );
  }
}
