export enum TCardAbilitiesNames {
  SCRAP_CARD_FROM_HAND = 'scrap_card_from_hand', // утилизировать карту с руки
  SCRAP_CARD_FROM_PILE = 'scrap_card_from_pile', // утилизировать карту из стопки сброса
  SCRAP_CARD_FROM_HAND_OR_PILE = 'scrap_card_from_hand_or_pile', // утилизировать карту с руки или из сброса
  SCRAP_CARD_FROM_TRADE_ROW = 'scrap_card_from_trade_row', // утилизировать карту из торгового ряда
  PLUS_ATTACK = 'plus_attack', // получить очки боя
  PLUS_MONEY = 'plus_money', // получить очки торговли
  PLUS_AUTHORITY = 'plus_authority', // восстановить очки влияния
  DISCARD_OPPONENT_CARD = 'discard_opponent_card', // заставить соперника сбросить карту
  GET_CARDS = 'get_cards', // взять карты из личной колоды
  DESTROY_BASE = 'destroy_base', // уничтожить выбранную базу
  DISCARD_THEN_DRAW = 'discard_then_draw', // сбросить карты и взять столько же новых
  PUT_NEXT_SHIP_ON_TOP = 'put_next_ship_on_top', // положить следующий купленный корабль наверх колоды
  ACQUIRE_SHIP_FOR_FREE_ON_TOP = 'acquire_ship_for_free_on_top', // бесплатно купить корабль и положить наверх колоды
  COPY_SHIP = 'copy_ship', // скопировать другой разыгранный корабль
  ALL_FACTIONS_ALLY = 'all_factions_ally', // считать карту союзником для всех фракций
  DRAW_PER_FACTION_CARD = 'draw_per_faction_card', // брать карты за разыгранные карты указанной фракции
  SEQUENCE = 'sequence', // последовательно выполнить несколько действий
  CHOOSE_ONE = 'choose_one', // выбрать один из нескольких эффектов
  IF_BASES_IN_PLAY = 'if_bases_in_play' // выполнить эффект при наличии нужного числа баз
}

type ValueActionName =
  | TCardAbilitiesNames.PLUS_ATTACK
  | TCardAbilitiesNames.PLUS_MONEY
  | TCardAbilitiesNames.PLUS_AUTHORITY
  | TCardAbilitiesNames.GET_CARDS
  | TCardAbilitiesNames.DISCARD_OPPONENT_CARD;

type ValueAction = {
  name: ValueActionName;
  value: number;
};

type SimpleAction = {
  name:
    | TCardAbilitiesNames.SCRAP_CARD_FROM_HAND
    | TCardAbilitiesNames.SCRAP_CARD_FROM_PILE
    | TCardAbilitiesNames.SCRAP_CARD_FROM_TRADE_ROW
    | TCardAbilitiesNames.PUT_NEXT_SHIP_ON_TOP
    | TCardAbilitiesNames.ACQUIRE_SHIP_FOR_FREE_ON_TOP
    | TCardAbilitiesNames.COPY_SHIP
    | TCardAbilitiesNames.ALL_FACTIONS_ALLY;
};

export type Action =
  | ValueAction
  | SimpleAction
  | {
      name: TCardAbilitiesNames.SCRAP_CARD_FROM_HAND_OR_PILE;
      max: number;
      optional: boolean;
      drawPerScrapped?: number;
    }
  | {
      name: TCardAbilitiesNames.DESTROY_BASE;
      optional: boolean;
    }
  | {
      name: TCardAbilitiesNames.DISCARD_THEN_DRAW;
      max: number;
    }
  | {
      name: TCardAbilitiesNames.DRAW_PER_FACTION_CARD;
      fraction: Exclude<FractionType, 'none'>;
    }
  | {
      name: TCardAbilitiesNames.SEQUENCE;
      actions: Action[];
    }
  | {
      name: TCardAbilitiesNames.CHOOSE_ONE;
      options: Action[][];
    }
  | {
      name: TCardAbilitiesNames.IF_BASES_IN_PLAY;
      min: number;
      actions: Action[];
    };

type CardType = 'ship' | 'base';

export type CardDeckType = 'trade' | 'explorer' | 'starter';

export type FractionType = 'blobs' | 'trades' | 'empire' | 'techno' | 'none';

export type CardTrigger = 'ship_played';

export interface PersistentAbility {
  trigger: CardTrigger;
  action: Action;
}

export interface Card {
  deck: CardDeckType;
  fraction: FractionType;
  type: CardType;
  name: string;
  count: number;
  cost: number;
  abilities: Action[];
  matchAbilities: Action[];
  removeAbility: Action | null;
  persistentAbilities: PersistentAbility[];
  money: number;
  attack: number;
  picture: string;
  health?: number;
  outpost: boolean;
}

const action = {
  attack: (value: number): Action => ({
    name: TCardAbilitiesNames.PLUS_ATTACK,
    value
  }),
  money: (value: number): Action => ({
    name: TCardAbilitiesNames.PLUS_MONEY,
    value
  }),
  authority: (value: number): Action => ({
    name: TCardAbilitiesNames.PLUS_AUTHORITY,
    value
  }),
  draw: (value = 1): Action => ({
    name: TCardAbilitiesNames.GET_CARDS,
    value
  }),
  discardOpponent: (value = 1): Action => ({
    name: TCardAbilitiesNames.DISCARD_OPPONENT_CARD,
    value
  }),
  scrap: ({
    max = 1,
    optional = true,
    drawPerScrapped
  }: {
    max?: number;
    optional?: boolean;
    drawPerScrapped?: number;
  } = {}): Action => ({
    name: TCardAbilitiesNames.SCRAP_CARD_FROM_HAND_OR_PILE,
    max,
    optional,
    drawPerScrapped
  }),
  scrapTradeRow: (): Action => ({
    name: TCardAbilitiesNames.SCRAP_CARD_FROM_TRADE_ROW
  }),
  destroyBase: (optional = true): Action => ({
    name: TCardAbilitiesNames.DESTROY_BASE,
    optional
  }),
  choose: (...options: Action[][]): Action => ({
    name: TCardAbilitiesNames.CHOOSE_ONE,
    options
  }),
  sequence: (...actions: Action[]): Action => ({
    name: TCardAbilitiesNames.SEQUENCE,
    actions
  })
};

type CardData = Pick<Card, 'fraction' | 'type' | 'name' | 'count' | 'cost'> &
  Partial<
    Pick<
      Card,
      | 'abilities'
      | 'deck'
      | 'matchAbilities'
      | 'removeAbility'
      | 'persistentAbilities'
      | 'money'
      | 'attack'
      | 'health'
      | 'outpost'
    >
  >;

const defineCard = (data: CardData): Card => ({
  deck: 'trade',
  abilities: [],
  matchAbilities: [],
  removeAbility: null,
  persistentAbilities: [],
  money: 0,
  attack: 0,
  picture: '',
  outpost: false,
  ...data
});

export const cards: Card[] = [
  // Basic cards
  defineCard({
    fraction: 'none',
    type: 'ship',
    name: 'Explorer',
    deck: 'explorer',
    count: 10,
    cost: 2,
    money: 2,
    removeAbility: action.attack(2)
  }),
  defineCard({
    fraction: 'none',
    type: 'ship',
    name: 'Trooper',
    deck: 'starter',
    count: 4,
    cost: 0,
    attack: 1
  }),
  defineCard({
    fraction: 'none',
    type: 'ship',
    name: 'Scout',
    deck: 'starter',
    count: 16,
    cost: 0,
    money: 1
  }),

  // Blobs
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Battle Blob',
    count: 1,
    cost: 6,
    attack: 8,
    matchAbilities: [action.draw()],
    removeAbility: action.attack(4)
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Battle Pod',
    count: 2,
    cost: 2,
    attack: 4,
    abilities: [action.scrapTradeRow()],
    matchAbilities: [action.attack(2)]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Blob Carrier',
    count: 1,
    cost: 6,
    attack: 7,
    matchAbilities: [{ name: TCardAbilitiesNames.ACQUIRE_SHIP_FOR_FREE_ON_TOP }]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Blob Destroyer',
    count: 2,
    cost: 4,
    attack: 6,
    matchAbilities: [action.destroyBase(), action.scrapTradeRow()]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Blob Fighter',
    count: 3,
    cost: 1,
    attack: 3,
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'base',
    name: 'Blob Wheel',
    count: 3,
    cost: 3,
    attack: 1,
    health: 5,
    removeAbility: action.money(3)
  }),
  defineCard({
    fraction: 'blobs',
    type: 'base',
    name: 'Blob World',
    count: 1,
    cost: 8,
    health: 7,
    abilities: [
      action.choose(
        [action.attack(5)],
        [
          {
            name: TCardAbilitiesNames.DRAW_PER_FACTION_CARD,
            fraction: 'blobs'
          }
        ]
      )
    ]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Mothership',
    count: 1,
    cost: 7,
    attack: 6,
    abilities: [action.draw()],
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Ram',
    count: 2,
    cost: 3,
    attack: 5,
    matchAbilities: [action.attack(2)],
    removeAbility: action.money(3)
  }),
  defineCard({
    fraction: 'blobs',
    type: 'base',
    name: 'The Hive',
    count: 1,
    cost: 5,
    attack: 3,
    health: 5,
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'blobs',
    type: 'ship',
    name: 'Trade Pod',
    count: 3,
    cost: 2,
    money: 3,
    matchAbilities: [action.attack(2)]
  }),

  // Machine Cult
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Battle Mech',
    count: 1,
    cost: 5,
    attack: 4,
    abilities: [action.scrap()],
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'techno',
    type: 'base',
    name: 'Battle Station',
    count: 2,
    cost: 3,
    health: 5,
    outpost: true,
    removeAbility: action.attack(5)
  }),
  defineCard({
    fraction: 'techno',
    type: 'base',
    name: 'Brain World',
    count: 1,
    cost: 8,
    health: 6,
    outpost: true,
    abilities: [action.scrap({ max: 2, drawPerScrapped: 1 })]
  }),
  defineCard({
    fraction: 'techno',
    type: 'base',
    name: 'Junkyard',
    count: 1,
    cost: 6,
    health: 5,
    outpost: true,
    abilities: [action.scrap()]
  }),
  defineCard({
    fraction: 'techno',
    type: 'base',
    name: 'Machine Base',
    count: 1,
    cost: 7,
    health: 6,
    outpost: true,
    abilities: [
      action.sequence(action.draw(), {
        name: TCardAbilitiesNames.SCRAP_CARD_FROM_HAND
      })
    ]
  }),
  defineCard({
    fraction: 'techno',
    type: 'base',
    name: 'Mech World',
    count: 1,
    cost: 5,
    health: 6,
    outpost: true,
    abilities: [{ name: TCardAbilitiesNames.ALL_FACTIONS_ALLY }]
  }),
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Missile Bot',
    count: 3,
    cost: 2,
    attack: 2,
    abilities: [action.scrap()],
    matchAbilities: [action.attack(2)]
  }),
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Missile Mech',
    count: 1,
    cost: 6,
    attack: 6,
    abilities: [action.destroyBase()],
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Patrol Mech',
    count: 2,
    cost: 4,
    abilities: [action.choose([action.money(3)], [action.attack(5)])],
    matchAbilities: [action.scrap()]
  }),
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Stealth Needle',
    count: 1,
    cost: 4,
    abilities: [{ name: TCardAbilitiesNames.COPY_SHIP }]
  }),
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Supply Bot',
    count: 3,
    cost: 3,
    money: 2,
    abilities: [action.scrap()],
    matchAbilities: [action.attack(2)]
  }),
  defineCard({
    fraction: 'techno',
    type: 'ship',
    name: 'Trade Bot',
    count: 3,
    cost: 1,
    money: 1,
    abilities: [action.scrap()],
    matchAbilities: [action.attack(2)]
  }),

  // Star Empire
  defineCard({
    fraction: 'empire',
    type: 'ship',
    name: 'Battlecruiser',
    count: 1,
    cost: 6,
    attack: 5,
    abilities: [action.draw()],
    matchAbilities: [action.discardOpponent()],
    removeAbility: action.sequence(action.draw(), action.destroyBase())
  }),
  defineCard({
    fraction: 'empire',
    type: 'ship',
    name: 'Corvette',
    count: 2,
    cost: 2,
    attack: 1,
    abilities: [action.draw()],
    matchAbilities: [action.attack(2)]
  }),
  defineCard({
    fraction: 'empire',
    type: 'ship',
    name: 'Dreadnaught',
    count: 1,
    cost: 7,
    attack: 7,
    abilities: [action.draw()],
    removeAbility: action.attack(5)
  }),
  defineCard({
    fraction: 'empire',
    type: 'base',
    name: 'Fleet HQ',
    count: 1,
    cost: 8,
    health: 8,
    persistentAbilities: [
      {
        trigger: 'ship_played',
        action: action.attack(1)
      }
    ]
  }),
  defineCard({
    fraction: 'empire',
    type: 'ship',
    name: 'Imperial Fighter',
    count: 3,
    cost: 1,
    attack: 2,
    abilities: [action.discardOpponent()],
    matchAbilities: [action.attack(2)]
  }),
  defineCard({
    fraction: 'empire',
    type: 'ship',
    name: 'Imperial Frigate',
    count: 3,
    cost: 3,
    attack: 4,
    abilities: [action.discardOpponent()],
    matchAbilities: [action.attack(2)],
    removeAbility: action.draw()
  }),
  defineCard({
    fraction: 'empire',
    type: 'base',
    name: 'Recycling Station',
    count: 2,
    cost: 4,
    health: 4,
    outpost: true,
    abilities: [
      action.choose(
        [action.money(1)],
        [{ name: TCardAbilitiesNames.DISCARD_THEN_DRAW, max: 2 }]
      )
    ]
  }),
  defineCard({
    fraction: 'empire',
    type: 'base',
    name: 'Royal Redoubt',
    count: 1,
    cost: 6,
    attack: 3,
    health: 6,
    outpost: true,
    matchAbilities: [action.discardOpponent()]
  }),
  defineCard({
    fraction: 'empire',
    type: 'base',
    name: 'Space Station',
    count: 2,
    cost: 4,
    attack: 2,
    health: 4,
    outpost: true,
    matchAbilities: [action.attack(2)],
    removeAbility: action.money(4)
  }),
  defineCard({
    fraction: 'empire',
    type: 'ship',
    name: 'Survey Ship',
    count: 3,
    cost: 3,
    money: 1,
    abilities: [action.draw()],
    removeAbility: action.discardOpponent()
  }),
  defineCard({
    fraction: 'empire',
    type: 'base',
    name: 'War World',
    count: 1,
    cost: 5,
    attack: 3,
    health: 4,
    outpost: true,
    matchAbilities: [action.attack(4)]
  }),

  // Trade Federation
  defineCard({
    fraction: 'trades',
    type: 'base',
    name: 'Barter World',
    count: 2,
    cost: 4,
    health: 4,
    abilities: [action.choose([action.authority(2)], [action.money(2)])],
    removeAbility: action.attack(5)
  }),
  defineCard({
    fraction: 'trades',
    type: 'base',
    name: 'Central Office',
    count: 1,
    cost: 7,
    money: 2,
    health: 6,
    abilities: [{ name: TCardAbilitiesNames.PUT_NEXT_SHIP_ON_TOP }],
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Command Ship',
    count: 1,
    cost: 8,
    attack: 5,
    abilities: [action.authority(4), action.draw(2)],
    matchAbilities: [action.destroyBase(false)]
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Cutter',
    count: 3,
    cost: 2,
    money: 2,
    abilities: [action.authority(4)],
    matchAbilities: [action.attack(4)]
  }),
  defineCard({
    fraction: 'trades',
    type: 'base',
    name: 'Defense Center',
    count: 1,
    cost: 5,
    health: 5,
    outpost: true,
    abilities: [action.choose([action.authority(3)], [action.attack(2)])],
    matchAbilities: [action.attack(2)]
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Embassy Yacht',
    count: 2,
    cost: 3,
    money: 2,
    abilities: [
      action.authority(3),
      {
        name: TCardAbilitiesNames.IF_BASES_IN_PLAY,
        min: 2,
        actions: [action.draw(2)]
      }
    ]
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Federation Shuttle',
    count: 3,
    cost: 1,
    money: 2,
    matchAbilities: [action.authority(4)]
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Flagship',
    count: 1,
    cost: 6,
    attack: 5,
    abilities: [action.draw()],
    matchAbilities: [action.authority(5)]
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Freighter',
    count: 2,
    cost: 4,
    money: 4,
    matchAbilities: [{ name: TCardAbilitiesNames.PUT_NEXT_SHIP_ON_TOP }]
  }),
  defineCard({
    fraction: 'trades',
    type: 'base',
    name: 'Port of Call',
    count: 1,
    cost: 6,
    money: 3,
    health: 6,
    outpost: true,
    removeAbility: action.sequence(action.draw(), action.destroyBase())
  }),
  defineCard({
    fraction: 'trades',
    type: 'ship',
    name: 'Trade Escort',
    count: 1,
    cost: 5,
    attack: 4,
    abilities: [action.authority(4)],
    matchAbilities: [action.draw()]
  }),
  defineCard({
    fraction: 'trades',
    type: 'base',
    name: 'Trading Post',
    count: 2,
    cost: 3,
    health: 4,
    outpost: true,
    abilities: [action.choose([action.authority(1)], [action.money(1)])],
    removeAbility: action.attack(3)
  })
];
