export type LeakCategory =
  | 'preflop'
  | 'cbet'
  | 'river-sizing'
  | 'sizing'
  | '3bet-defense'
  | 'bluff-frequency'
  | 'range-construction'
  | 'positional'
  | 'mental-game'
  | 'exploitative-adjustment'
  | 'study-process'
  | 'other';

export type LeakStatus = 'identified' | 'working' | 'resolved';

export interface LeakNote {
  _id: string;
  content: string;
  createdAt: string;
}

export interface Leak {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: LeakCategory;
  status: LeakStatus;
  linkedHandIds: string[];
  notes: LeakNote[];
  playerId?: string;
  playerUsername?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  nextReviewAt?: string;
  reviewStage?: 0 | 1 | 2 | 3;
}

export interface LeakCreate {
  title: string;
  description: string;
  category: LeakCategory;
  linkedHandIds?: string[];
  playerId?: string;
  playerUsername?: string;
}

export type EdgeCategory =
  | 'pool-tendency'
  | 'solver-deviation'
  | 'live-read'
  | 'sizing-exploit'
  | 'positional-edge'
  | 'meta-adjustment'
  | 'other';

export type EdgeStatus = 'developing' | 'active' | 'archived';

export interface EdgeNote {
  _id: string;
  content: string;
  createdAt: string;
}

export interface Edge {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: EdgeCategory;
  status: EdgeStatus;
  linkedHandIds: string[];
  notes: EdgeNote[];
  createdAt: string;
  updatedAt: string;
}

export interface EdgeCreate {
  title: string;
  description: string;
  category: EdgeCategory;
  linkedHandIds?: string[];
}

export interface MentalGameEntry {
  _id: string;
  userId: string;
  sessionDate: string;
  stateRating: 1 | 2 | 3 | 4 | 5;
  observation: string;
  tiltAffected: boolean;
  fatigueAffected: boolean;
  confidenceAffected: boolean;
  createdAt: string;
}

export interface MentalGameEntryCreate {
  sessionDate: string;
  stateRating: 1 | 2 | 3 | 4 | 5;
  observation: string;
  tiltAffected: boolean;
  fatigueAffected: boolean;
  confidenceAffected: boolean;
}
