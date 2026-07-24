export enum TCardAbilitiesNames {
  SCRAP_CARD_FROM_HAND = 'scrap_card_from_hand', // можно уничтожить карту с руки
  SCRAP_CARD_FROM_PILE = 'scrap_card_from_pile', // можно  уничтожить карту из сброса
  PLUS_ATTACK = 'plus_attack', // добавляет атаку
  DISCARD_OPPONENT_CARD = 'discard_opponent_card', // соперник должен сбросить карту
  GET_CARDS = 'get_cards' // соперник должен сбросить карту
}

enum TEventNames {
  HYPER_JUMP = 'hyper_jump'
}

export type Action = { name: TCardAbilitiesNames; value?: number };

type Event = { name: TEventNames; description: string };

const actionsCreators: Record<TCardAbilitiesNames, (value?: number) => Action> =
  {
    scrap_card_from_hand: () => ({
      name: TCardAbilitiesNames.SCRAP_CARD_FROM_HAND
    }),
    scrap_card_from_pile: () => ({
      name: TCardAbilitiesNames.SCRAP_CARD_FROM_PILE
    }),
    plus_attack: (value) => ({
      name: TCardAbilitiesNames.PLUS_ATTACK,
      value
    }),
    discard_opponent_card: () => ({
      name: TCardAbilitiesNames.DISCARD_OPPONENT_CARD
    }),
    get_cards: (value) => ({
      name: TCardAbilitiesNames.GET_CARDS,
      value
    })
  } as const;

const eventCreators: Record<TEventNames, (value?: number) => Event> = {
  hyper_jump: () => ({
    name: TEventNames.HYPER_JUMP,
    description: 'Choose 2 cards, it will be added at the top of your deck' // Каждый берет 3 карты и кладет 2 поверх колоды
  })
};

type CardType = 'ship' | 'base' | 'event' | 'hero';

type FractionType = 'blobs' | 'trades' | 'empire' | 'techno' | 'none';

export interface Card {
  fraction: FractionType;
  type: CardType;
  name: string;
  count: number;
  cost: number;
  abilities: Action[];
  matchAbilities: Action[];
  removeAbility: Action | null;
  event?: Event;
  money: number;
  attack: number;
  picture: string;
  health?: number;
}

export const cards: Card[] = [
  {
    fraction: 'none',
    type: 'ship',
    name: 'Explorer',
    count: 10,
    cost: 2,
    abilities: [],
    matchAbilities: [],
    removeAbility: actionsCreators.plus_attack(2),
    money: 2,
    attack: 0,
    picture: ''
  },
  {
    fraction: 'none',
    type: 'ship',
    name: 'Trooper',
    count: 4,
    cost: 0,
    abilities: [],
    matchAbilities: [],
    removeAbility: null,
    money: 0,
    attack: 1,
    picture: ''
  },
  {
    fraction: 'none',
    type: 'ship',
    name: 'Scout',
    count: 16,
    cost: 0,
    abilities: [],
    matchAbilities: [],
    removeAbility: null,
    money: 1,
    attack: 0,
    picture: ''
  },
  {
    fraction: 'none',
    type: 'event',
    name: 'HyperJump',
    count: 1,
    cost: 0,
    abilities: [],
    matchAbilities: [],
    removeAbility: null,
    event: eventCreators.hyper_jump(),
    money: 0,
    attack: 0,
    picture: ''
  }
];
