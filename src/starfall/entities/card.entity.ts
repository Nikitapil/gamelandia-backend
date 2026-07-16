import { Card } from '../domain/constants';

interface CardEntityParams {
  card: Card;
  isPlayed: boolean;
  id: string;
}

export class CardEntity {
  card: Card;
  isPlayed: boolean;
  id: string;

  constructor(params: CardEntityParams) {
    this.card = params.card;
    this.isPlayed = params.isPlayed;
    this.id = params.id;
  }

  useAbility() {}

  useMatchAbility() {}

  useDestroyAbility() {}

  play() {
    this.isPlayed = true;
  }

  resetPlay() {
    this.isPlayed = false;
  }
}
