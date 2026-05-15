export type GtoFormat = 'HU' | '8max';

export type GtoStack = '100bb' | '200bb';

export type GtoHandStart = 'Preflop' | 'Postflop';

export type GtoPotType = 'SRP' | '3BP' | '4BP' | 'Folded To' | 'Custom';

export type GtoHuPosition = 'SB' | 'BB';

export type Gto8maxPosition = 'UTG' | 'UTG1' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export type GtoPosition = GtoHuPosition | Gto8maxPosition;

export type GtoEndsAfter = 'FirstAction' | 'StreetEnd' | 'HandEnd';

export interface GtoStudySession {
  _id: string;
  userId: string;
  sessionDate: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  evLoss?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GtoStudySessionCreate {
  sessionDate: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  evLoss?: number;
  notes?: string;
}

export interface GtoStudySessionUpdate {
  sessionDate?: string;
  format?: GtoFormat;
  stack?: GtoStack;
  handStart?: GtoHandStart;
  potType?: GtoPotType;
  heroPosition?: GtoPosition;
  villainPosition?: GtoPosition | null;
  endsAfter?: GtoEndsAfter;
  evLoss?: number | null;
  notes?: string;
}
