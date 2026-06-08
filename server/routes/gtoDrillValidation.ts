const HU_POSITIONS = ['SB', 'BB'];
const EIGHT_MAX_POSITIONS = ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'SS'];
const POT_TYPES = ['Preflop', 'SRP', '3BP', '4BP', 'FoldedTo', 'Custom'];
const ENDS_AFTER = ['FirstAction', 'StreetEnd', 'HandEnd'];
const SOLVERS = ['Lucid', 'GTO Wizard', 'Other'] as const;
const LEGACY_SOLVERS = [...SOLVERS, 'Solver Pro'] as const;

export function normalizeSolver(solver: string | undefined): (typeof SOLVERS)[number] {
  if (solver === 'Solver Pro') return 'Other';
  if (solver && SOLVERS.includes(solver as (typeof SOLVERS)[number])) {
    return solver as (typeof SOLVERS)[number];
  }
  return 'Lucid';
}
const STUDY_TIERS = [1, 2, 3];
const STREETS = ['Preflop', 'Flop', 'Turn', 'River'];

const DESCRIPTION_MAX = 500;

export interface GtoDrillBodyFields {
  name?: string;
  description?: string;
  format?: string;
  stack?: string;
  handStart?: string;
  street?: string;
  potType?: string;
  heroPosition?: string;
  villainPosition?: string;
  endsAfter?: string;
  solver?: string;
  tier?: number | null;
  archived?: boolean;
  customConfig?: {
    streetActions?: { street?: string; sizing?: string }[];
    notes?: string;
  } | null;
}

export function validateDrillFields(body: GtoDrillBodyFields, requireName = true): string | null {
  const name = body.name?.trim();
  if (requireName && !name) return 'name is required';
  if (body.description != null && body.description.length > DESCRIPTION_MAX) {
    return `description must be at most ${DESCRIPTION_MAX} characters`;
  }

  const format = body.format;
  const stack = body.stack;
  const handStart = body.handStart;
  const potType = body.potType;
  const heroPosition = body.heroPosition;
  const villainPosition = body.villainPosition;
  const endsAfter = body.endsAfter;
  const solver = body.solver ?? 'Lucid';

  if (format !== 'HU' && format !== '8max') return 'format must be HU or 8max';
  if (stack !== '100bb' && stack !== '200bb') return 'stack must be 100bb or 200bb';
  if (format === '8max' && stack !== '200bb') return '8max ring is 200bb only';
  if (handStart !== 'Preflop' && handStart !== 'Postflop') {
    return 'handStart must be Preflop or Postflop';
  }
  const streetErr = validateDrillStreet(handStart, body.street);
  if (streetErr) return streetErr;
  if (!potType || !POT_TYPES.includes(potType)) return 'invalid potType';
  if (format === '8max' && handStart === 'Postflop' && potType === 'FoldedTo') {
    return 'FoldedTo is preflop-only for 8max';
  }
  const positions = format === 'HU' ? HU_POSITIONS : EIGHT_MAX_POSITIONS;
  if (!heroPosition || !positions.includes(heroPosition)) {
    return 'invalid heroPosition for format';
  }
  if (villainPosition != null && villainPosition !== '') {
    if (handStart !== 'Postflop') return 'villainPosition is postflop-only';
    if (!positions.includes(villainPosition)) return 'invalid villainPosition for format';
  }
  if (!endsAfter || !ENDS_AFTER.includes(endsAfter)) return 'invalid endsAfter';
  if (!LEGACY_SOLVERS.includes(solver as (typeof LEGACY_SOLVERS)[number])) return 'invalid solver';

  const tierErr = validateStudyTier(body.tier);
  if (tierErr) return tierErr;

  if (potType === 'Custom') {
    const cfg = body.customConfig;
    if (!cfg || !Array.isArray(cfg.streetActions) || cfg.streetActions.length === 0) {
      return 'customConfig.streetActions required when potType is Custom';
    }
    for (const row of cfg.streetActions) {
      if (!row.street || !STREETS.includes(row.street)) return 'invalid street in customConfig';
    }
  } else if (body.customConfig != null && body.customConfig !== undefined) {
    // non-custom drills should not persist custom config
  }

  return null;
}

function validateDrillStreet(handStart: string, street?: string): string | null {
  if (street != null && street !== '' && !STREETS.includes(street)) {
    return 'street must be Preflop, Flop, Turn, or River';
  }
  if (handStart === 'Preflop' && street && street !== 'Preflop') {
    return 'street must be Preflop when hand starts at Preflop';
  }
  if (handStart === 'Postflop' && street === 'Preflop') {
    return 'street cannot be Preflop when hand starts at Postflop';
  }
  return null;
}

/** Default or normalize street for persistence. */
export function validateStudyTier(tier: unknown): string | null {
  if (tier == null || tier === '') return null;
  const n = typeof tier === 'number' ? tier : Number.parseInt(String(tier), 10);
  if (!Number.isFinite(n) || !STUDY_TIERS.includes(n)) {
    return 'tier must be 1, 2, 3, or omitted';
  }
  return null;
}

/** Persist undefined when unassigned; otherwise 1–3. */
export function normalizeStudyTier(tier: unknown): number | undefined {
  if (tier == null || tier === '') return undefined;
  const n = typeof tier === 'number' ? tier : Number.parseInt(String(tier), 10);
  if (!Number.isFinite(n) || !STUDY_TIERS.includes(n)) return undefined;
  return n;
}

export function normalizeDrillDescription(description?: string): string | undefined {
  const t = (description ?? '').trim().slice(0, DESCRIPTION_MAX);
  return t || undefined;
}

export function normalizeDrillStreet(handStart: string, street?: string): string {
  if (handStart === 'Preflop') return 'Preflop';
  const s = street && STREETS.includes(street) ? street : 'Flop';
  return s === 'Preflop' ? 'Flop' : s;
}

export function normalizeCustomConfig(
  potType: string,
  customConfig?: GtoDrillBodyFields['customConfig']
): { streetActions: { street: string; sizing: string }[]; notes: string } | undefined {
  if (potType !== 'Custom') return undefined;
  const streetActions = (customConfig?.streetActions ?? [])
    .filter((r) => r.street && STREETS.includes(r.street))
    .map((r) => ({
      street: r.street as string,
      sizing: (r.sizing ?? '').trim().slice(0, 500),
    }));
  return {
    streetActions,
    notes: (customConfig?.notes ?? '').trim().slice(0, 500),
  };
}

export function parseDate(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}
