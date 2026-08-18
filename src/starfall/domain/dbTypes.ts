import { TCardAbilitiesNames } from './constants';

export type GameStatus = 'waiting' | 'active' | 'finished';

export type CardZone =
  | 'player-hand'
  | 'player-pile-deck'
  | 'player-deck'
  | 'player-bases'
  | 'currently-played'
  | 'trade-row'
  | 'unused-deck'
  | 'explorers'
  | 'starter-cards'
  | 'scrapped';

export interface CardFromDb {
  name: string;
  id: string;
  isPlayed: boolean;
  playedThisTurn?: boolean;
  deck: CardZone;
  ownerId?: string | null;
  position?: number;
  usedAbilities?: string[];
  currentDefense?: number | null;
  copiedCardId?: string | null;
}

export interface PlayerFromDb {
  id: string;
  cards: CardFromDb[];
  money: number;
  attack: number;
  hp: number;
  discardCardsCount: number;
  isWinner: boolean;
  nextShipToTop?: boolean;
}

export type PendingAction =
  | {
      type: 'choose_cards_to_scrap';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      zones: Array<'player-hand' | 'player-pile-deck'>;
      min: number;
      max: number;
      drawPerScrapped: number;
      continuation: SerializedAction[];
    }
  | {
      type: 'choose_trade_card_to_scrap';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      optional: boolean;
      continuation: SerializedAction[];
    }
  | {
      type: 'choose_base_to_destroy';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      optional: boolean;
      continuation: SerializedAction[];
    }
  | {
      type: 'discard_then_draw';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      max: number;
      continuation: SerializedAction[];
    }
  | {
      type: 'choose_ship_to_copy';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      continuation: SerializedAction[];
    }
  | {
      type: 'choose_free_ship';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      continuation: SerializedAction[];
    }
  | {
      type: 'choose_effect';
      playerId: string;
      sourceCardId: string;
      abilityId: string;
      options: SerializedAction[][];
      continuation: SerializedAction[];
    }
  | {
      type: 'discard_for_opponent';
      playerId: string;
      count: number;
    };

// JSON-compatible shape used inside PendingAction without introducing a
// circular runtime dependency on the constants module.
export type SerializedAction = {
  name: TCardAbilitiesNames;
  value?: number;
  max?: number;
  min?: number;
  optional?: boolean;
  drawPerScrapped?: number;
  fraction?: string;
  actions?: SerializedAction[];
  options?: SerializedAction[][];
};

export interface StarfallSnapshot {
  id: string;
  startingHp: number;
  status: GameStatus;
  currentPlayerId: string | null;
  turnNumber: number;
  version: number;
  pendingAction: PendingAction | null;
  processedCommandIds: string[];
  cards: CardFromDb[];
  players: PlayerFromDb[];
}
