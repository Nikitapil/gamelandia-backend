import { CardEntity } from './card.entity';
import { DeckEntity } from './deck.entity';

export interface PlayerEntityParams {
  hp: number;
  id: string;
  pileDeck?: DeckEntity;
  deck?: DeckEntity;
  hand?: DeckEntity;
  bases?: DeckEntity;
  heroes?: DeckEntity;
  currentPlayedCards?: DeckEntity;
  money?: number;
  attack?: number;
  discardCardsCount?: number;
  isWinner?: boolean;
  nextShipToTop?: boolean;
}

export class PlayerEntity {
  readonly id: string;
  hp: number;
  pileDeck: DeckEntity;
  deck: DeckEntity;
  hand: DeckEntity;
  bases: DeckEntity;
  heroes: DeckEntity;
  currentPlayedCards: DeckEntity;
  money: number;
  attack: number;
  discardCardsCount: number;
  isWinner: boolean;
  nextShipToTop: boolean;

  constructor(params: PlayerEntityParams) {
    this.hp = params.hp;
    this.id = params.id;
    this.pileDeck = params.pileDeck ?? new DeckEntity([], 'player-pile-deck');
    this.deck = params.deck ?? new DeckEntity([], 'player-deck');
    this.hand = params.hand ?? new DeckEntity([], 'player-hand');
    this.bases = params.bases ?? new DeckEntity([], 'player-bases');
    this.heroes = params.heroes ?? new DeckEntity();
    this.currentPlayedCards =
      params.currentPlayedCards ?? new DeckEntity([], 'currently-played');
    this.money = Math.max(0, params.money ?? 0);
    this.attack = Math.max(0, params.attack ?? 0);
    this.discardCardsCount = Math.max(0, params.discardCardsCount ?? 0);
    this.isWinner = params.isWinner ?? false;
    this.nextShipToTop = params.nextShipToTop ?? false;
  }

  get cardsInPlay() {
    return [...this.bases.cards, ...this.currentPlayedCards.cards];
  }

  addHp(value: number) {
    this.hp = this.hp + value;
  }

  reduceHp(value: number) {
    if (value < 0) {
      throw new Error('Damage cannot be negative');
    }
    this.hp = this.hp - value;
  }

  takeCardFromHand(cardId: string) {
    return this.hand.removeById(cardId);
  }

  putCardInPlay(card: CardEntity) {
    card.play();
    if (card.card.type === 'base') {
      this.bases.add(card);
    } else {
      this.currentPlayedCards.add(card);
    }
    this.money += card.card.money;
    this.attack += card.card.attack;
  }

  resetPlayedCards() {
    const ships = this.currentPlayedCards.clear();
    ships.forEach((card) => card.leavePlay());
    this.pileDeck.addMany(ships);
  }

  discardHand() {
    const cards = this.hand.clear();
    cards.forEach((card) => card.leavePlay());
    this.pileDeck.addMany(cards);
  }

  finishTurn() {
    this.resetPlayedCards();
    this.discardHand();
    this.money = 0;
    this.attack = 0;
    this.nextShipToTop = false;
  }

  startTurn() {
    this.bases.cards.forEach((card) => {
      card.resetForTurn();
      this.attack += card.card.attack;
      this.money += card.card.money;
    });
  }

  getCardFromDeck() {
    if (!this.deck.size && this.pileDeck.size) {
      const cards = this.pileDeck.clear();
      this.deck.replaceAll(cards);
      this.deck.shuffle();
    }
    const card = this.deck.takeTop(1)[0];
    if (card) {
      this.hand.add(card);
    }
    return card;
  }

  getCardsFromDeck(count: number) {
    const drawn: CardEntity[] = [];
    for (let index = 0; index < count; index++) {
      const card = this.getCardFromDeck();
      if (!card) break;
      drawn.push(card);
    }
    return drawn;
  }

  addAttack(value: number) {
    this.attack = Math.max(0, this.attack + value);
  }

  addMoney(value: number) {
    this.money = Math.max(0, this.money + value);
  }

  canBuyCard(card: CardEntity) {
    return this.money >= card.card.cost;
  }

  payFor(card: CardEntity) {
    if (!this.canBuyCard(card)) {
      throw new Error('Not enough trade to acquire this card');
    }
    this.money -= card.card.cost;
  }

  acquire(card: CardEntity, destination: 'discard' | 'top' = 'discard') {
    if (destination === 'top') {
      this.deck.putOnTop(card);
    } else {
      this.pileDeck.add(card);
    }
  }
}
