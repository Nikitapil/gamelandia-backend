export interface CardFromDb {
  name: string;
  id: string;
  isPlayed: boolean;
  deck:
    | 'player-hand'
    | 'player-pile-deck'
    | 'player-deck'
    | 'player-bases'
    | 'player-heroes'
    | 'trade-row'
    | 'unused-deck'
    | 'explorers'
    | 'currently-played';
}

export interface PlayerFromDb {
  id: string;
  cards: CardFromDb[];
  money: number;
  attack: number;
  hp: number;
  discardCardsCount: number;
  isWinner: boolean;
}

export type GameStatus = 'waiting' | 'active' | 'finished';
