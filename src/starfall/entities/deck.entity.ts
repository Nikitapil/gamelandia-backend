import { CardEntity } from './card.entity';

export class DeckEntity {
  cards: CardEntity[];

  constructor(cards: CardEntity[]) {
    this.cards = cards;
  }

  ejectCardsByName(name: string) {
    const updated: CardEntity[] = [];
    const ejected: CardEntity[] = [];
    this.cards.forEach((card) => {
      if (card.card.name === name) {
        ejected.push(card);
      } else {
        updated.push(card);
      }
    });

    this.cards = updated;
    return ejected;
  }

  ejectCardsByNameAndCount(name: string, count: number) {
    const updated: CardEntity[] = [];
    const ejected: CardEntity[] = [];
    this.cards.forEach((card) => {
      if (card.card.name === name && ejected.length < count) {
        ejected.push(card);
      } else {
        updated.push(card);
      }
    });

    this.cards = updated;
    return ejected;
  }

  replaceCard(cardToBeReplaced: CardEntity, cardToReplaceWith: CardEntity) {
    const index = this.cards.findIndex(
      (card) => card.id === cardToBeReplaced.id
    );
    if (index >= 0) {
      this.cards.splice(index, 1, cardToReplaceWith);
    }
  }

  ejectCardsByCount(count: number) {
    return this.cards.splice(0, count);
  }

  updateCards(cards: CardEntity[]) {
    this.cards = cards;
  }

  getCardById(id: string) {
    return this.cards.find((card) => card.id === id);
  }

  addCards(cards: CardEntity[]) {
    this.cards.push(...cards);
  }
}
