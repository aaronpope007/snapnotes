export type { PlayerTypeKey } from '../constants/playerTypes';
import type { PlayerTypeKey } from '../constants/playerTypes';

export const STAKE_VALUES = [200, 400, 800, 1000, 2000, 5000] as const;
export type StakeValue = (typeof STAKE_VALUES)[number];

export { FORMAT_OPTIONS, ORIGIN_OPTIONS } from '../constants/stakes';

export interface NoteEntry {
  text: string;
  addedBy: string;
  addedAt: string;
  source?: 'import';
}

export interface HandHistoryEntry {
  title: string;
  content: string;
}

export interface Player {
  _id: string;
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
  formats: string[];
  origin: string;
  notes: NoteEntry[];
  exploits: string[];
  handHistories: HandHistoryEntry[];
  exploitHandExamples: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerListItem {
  _id: string;
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
  formats: string[];
  origin: string;
}

export interface PlayerCreate {
  username: string;
  playerType?: PlayerTypeKey;
  stakesSeenAt?: number[];
  formats?: string[];
  origin?: string;
  notes?: NoteEntry[];
  exploits?: string[];
  handHistories?: HandHistoryEntry[];
  exploitHandExamples?: string[];
}

export interface ParsedImportPlayer {
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
  noteText: string;
  exploits: string[];
}

export interface ImportPlayer {
  username: string;
  playerType: PlayerTypeKey;
  stakesSeenAt: number[];
  formats: string[];
  origin: string;
  notes: NoteEntry[];
  exploits: string[];
  importedBy: string;
}
