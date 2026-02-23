export type { PlayerTypeKey } from '../constants/playerTypes';
import type { PlayerTypeKey } from '../constants/playerTypes';

export const STAKE_VALUES = [200, 400, 800, 1000, 2000, 5000] as const;
export type StakeValue = (typeof STAKE_VALUES)[number];

export interface StakeNote {
  stake: number | null;
  text: string;
}

export interface Player {
  _id: string;
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
  stakeNotes: StakeNote[];
  exploits: string[];
  rawNote: string;
  handHistories: string;
  exploitHandExamples: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerListItem {
  _id: string;
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
}

export interface PlayerCreate {
  username: string;
  playerType?: PlayerTypeKey;
  stakesSeenAt?: number[];
  stakeNotes?: StakeNote[];
  exploits?: string[];
  rawNote?: string;
  handHistories?: string;
  exploitHandExamples?: string[];
}

export interface ImportPlayer {
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
  stakeNotes: StakeNote[];
  exploits: string[];
  rawNote: string;
}
