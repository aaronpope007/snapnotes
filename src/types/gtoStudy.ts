export type GtoFormat = 'HU' | '8max';

export type GtoStack = '100bb' | '200bb';

export type GtoHandStart = 'Preflop' | 'Postflop';

export type GtoPotType = 'Preflop' | 'SRP' | '3BP' | '4BP' | 'FoldedTo' | 'Custom';

export type GtoHuPosition = 'SB' | 'BB';

export type Gto8maxPosition = 'UTG' | 'UTG1' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB' | 'SS';

export type GtoPosition = GtoHuPosition | Gto8maxPosition;

export type GtoEndsAfter = 'FirstAction' | 'StreetEnd' | 'HandEnd';

export type GtoSolver = 'Lucid' | 'GTO Wizard' | 'Other';

/** Study curriculum tier (1–3). Omit or null = unassigned. */
export type GtoStudyTier = 1 | 2 | 3;

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
  accuracy?: number;
  bestActionRate?: number;
  evDiff?: number;
  score?: number;
}

export interface GtoDrill {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  street?: GtoStreetName;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  solver: GtoSolver;
  tier?: GtoStudyTier | null;
  archived?: boolean;
  customConfig?: GtoCustomConfig;
  createdAt: string;
  updatedAt: string;
  recentResultsSummary?: GtoDrillResultSummarySnippet[];
}

export interface GtoDrillCreate {
  name: string;
  description?: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  street?: GtoStreetName;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition?: GtoPosition;
  endsAfter: GtoEndsAfter;
  solver?: GtoSolver;
  tier?: GtoStudyTier | null;
  customConfig?: GtoCustomConfig;
}

export type GtoDrillUpdate = Partial<GtoDrillCreate> & {
  archived?: boolean;
  customConfig?: GtoCustomConfig | null;
};

export interface GtoDrillResult {
  _id: string;
  drillId: string;
  userId: string;
  date: string;
  evLoss?: number;
  handsPlayed?: number;
  accuracy?: number;
  bestActionRate?: number;
  evDiff?: number;
  score?: number;
  notes?: string;
  studySessionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Result row from GET /gto-drills/results/recent (includes drill metadata). */
export interface GtoRecentDrillResult extends GtoDrillResult {
  drillName: string;
  drillFormat: GtoFormat;
  drillArchived?: boolean;
}

export interface GtoDrillResultCreate {
  date: string;
  evLoss?: number;
  handsPlayed?: number;
  accuracy?: number;
  bestActionRate?: number;
  evDiff?: number;
  score?: number;
  notes?: string;
  studySessionId?: string;
}

export interface GtoDrillResultUpdate {
  date?: string;
  evLoss?: number | null;
  handsPlayed?: number | null;
  accuracy?: number | null;
  bestActionRate?: number | null;
  evDiff?: number | null;
  score?: number | null;
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
