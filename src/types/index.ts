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
export type HandReviewFilterTab = 'open' | 'archived' | 'all' | 'my-open-private' | 'my-archived-private';

export interface HandToReviewComment {
  text: string;
  addedBy: string;
  addedAt: string;
  editedAt?: string;
  editedBy?: string;
  /** When true, only the hand author (createdBy) sees this comment; hidden from reviewers. */
  authorOnly?: boolean;
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
  /** When true, only the author (createdBy) sees this hand; for personal review/solver work. */
  isPrivate?: boolean;
  comments: HandToReviewComment[];
  starRatings?: HandRatingEntry[];
  spicyRatings?: HandRatingEntry[];
  archivedAt: string | null;
  taggedReviewerNames?: string[];
  reviewedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HandToReviewCreate {
  title?: string;
  handText: string;
  spoilerText?: string;
  createdBy: string;
  isPrivate?: boolean;
  taggedReviewerNames?: string[];
  initialComment?: { text: string; addedBy: string; authorOnly?: boolean };
}
