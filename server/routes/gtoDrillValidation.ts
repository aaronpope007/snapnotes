const HU_POSITIONS = ['SB', 'BB'];
const EIGHT_MAX_POSITIONS = ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POT_TYPES = ['SRP', '3BP', '4BP', 'FoldedTo', 'Custom'];
const ENDS_AFTER = ['FirstAction', 'StreetEnd', 'HandEnd'];
const SOLVERS = ['Lucid', 'GTO Wizard', 'Solver Pro'];
const STREETS = ['Preflop', 'Flop', 'Turn', 'River'];

export interface GtoDrillBodyFields {
  name?: string;
  format?: string;
  stack?: string;
  handStart?: string;
  potType?: string;
  heroPosition?: string;
  villainPosition?: string;
  endsAfter?: string;
  solver?: string;
  customConfig?: {
    streetActions?: { street?: string; sizing?: string }[];
    notes?: string;
  } | null;
}

export function validateDrillFields(body: GtoDrillBodyFields, requireName = true): string | null {
  const name = body.name?.trim();
  if (requireName && !name) return 'name is required';

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
  if (!SOLVERS.includes(solver)) return 'invalid solver';

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
