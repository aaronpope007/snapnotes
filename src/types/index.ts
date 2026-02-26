export type { PlayerTypeKey } from '../constants/playerTypes';
import type { PlayerTypeKey } from '../constants/playerTypes';

export const STAKE_VALUES = [200, 400, 800, 1000, 2000, 5000] as const;
export type StakeValue = (typeof STAKE_VALUES)[number];

export { GAME_TYPE_OPTIONS, FORMAT_OPTIONS, ORIGIN_OPTIONS } from '../constants/stakes';

export interface NoteEntry {
  text: string;
  addedBy: string;
  addedAt: string;
  source?: 'import';
  editedBy?: string;
  editedAt?: string;
}

export interface HandHistoryComment {
  text: string;
  addedBy: string;
  addedAt: string;
  editedAt?: string;
  editedBy?: string;
}

export interface HandHistoryEntry {
  title: string;
  content: string;
  spoilerText?: string;
  comments?: HandHistoryComment[];
}

export interface Player {
  _id: string;
  username: string;
  playerType: PlayerTypeKey;
  gameTypes: string[];
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
  gameTypes: string[];
  stakesSeenAt: number[];
  formats: string[];
  origin: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface PlayerCreate {
  username: string;
  playerType?: PlayerTypeKey;
  gameTypes?: string[];
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
  gameTypes: string[];
  stakesSeenAt: number[];
  formats: string[];
  origin: string;
  notes: NoteEntry[];
  exploits: string[];
  importedBy: string;
}

// Hands to Review
export type HandToReviewStatus = 'open' | 'archived';

export interface HandToReviewComment {
  text: string;
  addedBy: string;
  addedAt: string;
  editedAt?: string;
  editedBy?: string;
}

export interface HandRatingEntry {
  user: string;
  rating: number;
}

export interface HandToReview {
  _id: string;
  title: string;
  handText: string;
  spoilerText?: string;
  status: HandToReviewStatus;
  createdBy: string;
  comments: HandToReviewComment[];
  starRatings?: HandRatingEntry[];
  spicyRatings?: HandRatingEntry[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HandToReviewCreate {
  title?: string;
  handText: string;
  spoilerText?: string;
  createdBy: string;
  initialComment?: { text: string; addedBy: string };
}
