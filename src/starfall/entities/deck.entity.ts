import { shuffleArray } from '../../shared/helpers/arrays.helpers';
import { CardZone } from '../domain/dbTypes';
import { CardEntity } from './card.entity';

export class DeckEntity {
  cards: CardEntity[];

  constructor(cards: CardEntity[] = [], readonly zone?: CardZone) {
    this.cards = [...cards];
    this.cards.forEach((card) => this.assignZone(card));
  }

  get size() {
    return this.cards.length;
  }

  has(id: string) {
    return this.cards.some((card) => card.id === id);
  }

  getCardById(id: string) {
    return this.cards.find((card) => card.id === id);
  }

  requireCardById(id: string) {
    const card = this.getCardById(id);
    if (!card) {
      throw new Error(`Card ${id} was not found in this zone`);
    }
    return card;
  }

  removeById(id: string) {
    const index = this.cards.findIndex((card) => card.id === id);
    if (index < 0) {
      throw new Error(`Card ${id} was not found in this zone`);
    }
    return this.cards.splice(index, 1)[0];
  }

  tryRemoveById(id: string) {
    try {
      const removed = this.removeById(id);
      return removed;
    } catch (e) {
      return undefined;
    }
  }

  takeTop(count = 1) {
    return this.cards.splice(0, Math.max(0, count));
  }

  putOnTop(card: CardEntity) {
    this.assignZone(card);
    this.cards.unshift(card);
  }

  add(card: CardEntity) {
    this.assignZone(card);
    this.cards.push(card);
  }

  addMany(cards: CardEntity[]) {
    cards.forEach((card) => this.add(card));
  }

  replace(cardId: string, replacement?: CardEntity) {
    const index = this.cards.findIndex((card) => card.id === cardId);
    if (index < 0) {
      throw new Error(`Card ${cardId} was not found in this zone`);
    }
    if (replacement) this.assignZone(replacement);
    const [removed] = this.cards.splice(
      index,
      1,
      ...(replacement ? [replacement] : [])
    );
    return removed;
  }

  replaceAll(cards: CardEntity[]) {
    this.cards = [...cards];
    this.cards.forEach((card) => this.assignZone(card));
  }

  clear() {
    return this.cards.splice(0);
  }

  shuffle() {
    this.cards = shuffleArray(this.cards);
  }

  takeByName(name: string, count = Number.POSITIVE_INFINITY) {
    const result: CardEntity[] = [];
    this.cards = this.cards.filter((card) => {
      if (card.card.name === name && result.length < count) {
        result.push(card);
        return false;
      }
      return true;
    });
    return result;
  }

  private assignZone(card: CardEntity) {
    if (this.zone) card.zone = this.zone;
  }
}
