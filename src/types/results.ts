export type SessionGameType = 'NLHE' | 'PLO';

export type SessionRating = 'A' | 'B' | 'C' | 'D' | 'F';

export const SESSION_RATING_OPTIONS: SessionRating[] = ['A', 'B', 'C', 'D', 'F'];

export interface SessionResult {
  _id: string;
  userId: string;
  date: string;
  totalTime: number | null;
  hands: number | null;
  handsStartedAt: number | null;
  handsEndedAt: number | null;
  dailyNet: number | null;
  startBankroll: number | null;
  endBankroll: number | null;
  startTime: string | null;
  endTime: string | null;
  stake: number | null;
  isRing: boolean | null;
  isHU: boolean | null;
  gameType: SessionGameType;
  rating: SessionRating | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResultCreate {
  date?: string;
  totalTime?: number | null;
  hands?: number | null;
  handsStartedAt?: number | null;
  handsEndedAt?: number | null;
  dailyNet?: number | null;
  startBankroll?: number | null;
  endBankroll?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  stake?: number | null;
  isRing?: boolean | null;
  isHU?: boolean | null;
  gameType?: SessionGameType;
  rating?: SessionRating | null;
  notes?: string | null;
}

/** Row format for bulk upload (e.g. CSV: Date, total time, hands, Daily Net, Hands Start, Hands End, Account End) */
export interface SessionUploadRow {
  date: string | number | Date;
  totalTime?: number | string | null;
  hands?: number | string | null;
  handsStartedAt?: number | string | null;
  handsEndedAt?: number | string | null;
  dailyNet?: number | string | null;
  endBankroll?: number | string | null;
}

export const RESULTS_STAKE_OPTIONS = [200, 400, 800, 1000, 2000] as const;
export type ResultsStakeValue = (typeof RESULTS_STAKE_OPTIONS)[number];

export interface Withdrawal {
  _id: string;
  userId: string;
  date: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalCreate {
  date?: string;
  amount: number;
  notes?: string | null;
}
