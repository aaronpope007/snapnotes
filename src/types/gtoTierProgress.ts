import type { GtoStudyTier } from './gtoStudy';

export interface GtoTierProgressRow {
  drillId: string;
  name: string;
  tier: GtoStudyTier | null;
  potType: string;
  street: string;
  heroPosition: string;
  endsAfter: string;
  stack: string;
  latestScore: number | null;
  latestHandsPlayed: number | null;
  latestAccuracy: number | null;
  latestDate: string | null;
  timesLogged: number;
}
