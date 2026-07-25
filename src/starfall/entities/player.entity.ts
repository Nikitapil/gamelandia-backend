import { CardEntity } from './card.entity';
import { shuffleArray } from '../../shared/helpers/arrays.helpers';
import { DeckEntity } from './deck.entity';

interface PlayerEntityParams {
  hp: number;
  id: string;
  pileDeck: DeckEntity;
  deck: DeckEntity;
  hand: DeckEntity;
  bases: DeckEntity;
  heroes: DeckEntity;
  currentPlayedCards: DeckEntity;
  money: number;
  attack: number;
  discardCardsCount: number;
}

const HAND_SIZE = 5;

export class PlayerEntity {
  id: string;
  hp: number;
  pileDeck: DeckEntity; // сброс
  deck: DeckEntity; // закрытая колода
  hand: DeckEntity; // текущая рука
  bases: DeckEntity; // базы
  heroes: DeckEntity; // герои
  currentPlayedCards: DeckEntity; // текущие разыгранные карты
  money = 0;
  attack = 0;
  discardCardsCount = 0;

  constructor(params: PlayerEntityParams) {
    this.hp = params.hp;
    this.id = params.id;
    this.pileDeck = params.pileDeck;
    this.deck = params.deck;
    this.hand = params.hand;
    this.bases = params.bases;
    this.heroes = params.heroes;
    this.money = params.money;
    this.attack = params.attack;
    this.discardCardsCount = params.discardCardsCount;
    this.currentPlayedCards = params.currentPlayedCards;
  }

  addHp(value: number) {
    this.hp += value;
  }

  reduceHp(value: number) {
    this.hp -= value;
  }

  playCard(cardId: string) {
    const card = this.hand.getCardById(cardId);

    if (!card) {
      throw new Error('No card in hand with id ' + cardId);
    }

    if (card.isPlayed) {
      throw new Error('Played hand with id ' + cardId);
    }

    card.play();

    this.currentPlayedCards.addCards([card]);
    this.hand.ejectById(card.id);

    this.money += card.card.money;
    this.attack += card.card.attack;
  }

  resetPlayedCards() {
    this.currentPlayedCards.cards.forEach((card) => {
      card.resetPlay();
    });
    this.pileDeck.addCards(this.currentPlayedCards.cards);
    this.currentPlayedCards = new DeckEntity([]);
  }

  updateHand() {
    this.hand.cards.forEach((card) => {
      card.resetPlay();
    });

    this.pileDeck.updateCards([...this.pileDeck.cards, ...this.hand.cards]);
    this.hand.updateCards([]);

    this.getCardsFromDeck(HAND_SIZE);
  }

  finishTurn() {
    this.resetPlayedCards();
    this.updateHand();
  }

  getCardFromDeck() {
    if (!this.deck.cards.length) {
      this.deck.updateCards(shuffleArray(this.pileDeck.cards));
      this.pileDeck.updateCards([]);
    }
    this.hand.addCards(this.deck.ejectCardsByCount(1));
  }

  getCardsFromDeck(count: number) {
    for (let i = 0; i < count; i++) {
      this.getCardFromDeck();
    }
  }

  addAttack(value: number) {
    this.attack += value;
  }

  buyCard(card: CardEntity) {
    this.pileDeck.addCards([card]);
    this.money -= card.card.cost;
  }
}
