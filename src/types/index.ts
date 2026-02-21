export const PLAYER_TYPES = [
  'Whale',
  'Calling Station',
  'Rock',
  'Maniac',
  'Weak-Tight Reg',
  'TAG',
  'LAG',
  'GTO Grinder',
  'Unknown',
] as const;

export type PlayerType = (typeof PLAYER_TYPES)[number];

export const STAKE_VALUES = [25, 50, 100, 200, 400, 800] as const;

export const PLAYER_TYPE_COLORS: Record<PlayerType, string> = {
  Whale: '#ff9800',
  'Calling Station': '#009688',
  Rock: '#9e9e9e',
  Maniac: '#e91e63',
  'Weak-Tight Reg': '#ffeb3b',
  TAG: '#2196f3',
  LAG: '#f44336',
  'GTO Grinder': '#9c27b0',
  Unknown: '#bdbdbd',
};

export interface Player {
  _id: string;
  username: string;
  playerType: PlayerType;
  stakesSeenAt: number[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerCreate {
  username: string;
  playerType?: PlayerType;
  stakesSeenAt?: number[];
  notes?: string;
}

export interface ImportPlayer {
  username: string;
  playerType?: string;
  stakesSeenAt?: number[];
  notes: string;
}
