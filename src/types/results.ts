export type SessionGameType = 'NLHE' | 'PLO';

export interface SessionResult {
  _id: string;
  userId: string;
  date: string;
  totalTime: number | null;
  hands: number | null;
  dailyNet: number | null;
  startTime: string | null;
  endTime: string | null;
  stake: number | null;
  isRing: boolean | null;
  isHU: boolean | null;
  gameType: SessionGameType;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResultCreate {
  date?: string;
  totalTime?: number | null;
  hands?: number | null;
  dailyNet?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  stake?: number | null;
  isRing?: boolean | null;
  isHU?: boolean | null;
  gameType?: SessionGameType;
}

/** Row format for bulk upload (e.g. CSV: Date, total time, hands, Daily Net) */
export interface SessionUploadRow {
  date: string | number | Date;
  totalTime?: number | string | null;
  hands?: number | string | null;
  dailyNet?: number | string | null;
}

export const RESULTS_STAKE_OPTIONS = [200, 400, 800, 1000, 2000] as const;
export type ResultsStakeValue = (typeof RESULTS_STAKE_OPTIONS)[number];
