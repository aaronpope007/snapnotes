export type GtoFormat = 'HU' | '8max';

export type GtoStack = '100bb' | '200bb';

export type GtoHandStart = 'Preflop' | 'Postflop';

export type GtoPotType = 'SRP' | '3BP' | '4BP' | 'FoldedTo' | 'Custom';

export type GtoHuPosition = 'SB' | 'BB';

export type Gto8maxPosition = 'UTG' | 'UTG1' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export type GtoPosition = GtoHuPosition | Gto8maxPosition;

export type GtoEndsAfter = 'FirstAction' | 'StreetEnd' | 'HandEnd';

export type GtoSolver = 'Lucid' | 'GTO Wizard' | 'Solver Pro';

export type GtoStreetName = 'Preflop' | 'Flop' | 'Turn' | 'River';

export interface GtoStreetAction {
  street: GtoStreetName;
  sizing: string;
}

export interface GtoCustomConfig {
  streetActions: GtoStreetAction[];
  notes?: string;
}

/** Embedded from GET /gto-drills?recentResults=1 (sorted newest-first). */
export interface GtoDrillResultSummarySnippet {
  _id: string;
  date: string;
  evLoss?: number;
  handsPlayed?: number;
}

export interface GtoDrill {
  _id: string;
  userId: string;
  name: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  solver: GtoSolver;
  customConfig?: GtoCustomConfig;
  createdAt: string;
  updatedAt: string;
  recentResultsSummary?: GtoDrillResultSummarySnippet[];
}

export interface GtoDrillCreate {
  name: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  solver?: GtoSolver;
  customConfig?: GtoCustomConfig;
}

export type GtoDrillUpdate = Partial<GtoDrillCreate> & {
  customConfig?: GtoCustomConfig | null;
};

export interface GtoDrillResult {
  _id: string;
  drillId: string;
  userId: string;
  date: string;
  evLoss?: number;
  handsPlayed?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GtoDrillResultCreate {
  date: string;
  evLoss?: number;
  handsPlayed?: number;
  notes?: string;
}

export interface GtoDrillResultUpdate {
  date?: string;
  evLoss?: number | null;
  handsPlayed?: number | null;
  notes?: string;
}

/** @deprecated Legacy flat session — read-only via /api/gto-study */
export interface GtoStudySession {
  _id: string;
  userId: string;
  sessionDate: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: string;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  evLoss?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
