export interface CardFromDb {
  name: string;
  id: string;
  isPlayed: boolean;
  deck:
    | 'player-hand'
    | 'player-pile-deck'
    | 'player-deck'
    | 'player-bases'
    | 'player-heroes';
}

export interface PlayerFromDb {
  id: string;
  cards: CardFromDb[];
  money: number;
  attack: number;
  hp: number;
}
