import type { GtoStudyTier } from '../types/gtoStudy';

export interface GtoTierDefinition {
  tier: GtoStudyTier;
  label: string;
  description: string;
  /** Legacy name-based assignment for drills without an explicit tier. */
  drillMatchers: string[];
}

export const GTO_STUDY_TIERS: GtoTierDefinition[] = [
  {
    tier: 1,
    label: 'Tier 1 — Foundation',
    description: 'Preflop + core SRP flop decisions',
    drillMatchers: ['preflop sb', 'preflop bb', 'srp cbet opportunity', 'srp vs cbet b33'],
  },
  {
    tier: 2,
    label: 'Tier 2 — Core Postflop (SRP)',
    description: 'Full SRP tree — all sizings, both sides, turn spots',
    drillMatchers: [
      'srp vs cbet b75',
      'srp vs cbet b150',
      'srp vs delay',
      'srp turn probe',
      'srp hero cbet',
      'delay cbet opportunity turn',
      'srp cbet b33, turn',
    ],
  },
  {
    tier: 3,
    label: 'Tier 3 — 3-Bet Pots',
    description: '3BP cbet, facing cbet, and turn spots — both sides',
    drillMatchers: ['3b pot'],
  },
];

export const GTO_STUDY_TIER_OPTIONS: Array<{ value: GtoStudyTier; label: string }> =
  GTO_STUDY_TIERS.map((t) => ({ value: t.tier, label: t.label }));

export function tierDefinition(tier: GtoStudyTier): GtoTierDefinition | undefined {
  return GTO_STUDY_TIERS.find((t) => t.tier === tier);
}

/** Infer tier from drill name when no explicit tier is stored. */
export function inferTierFromDrillName(name: string): GtoStudyTier | null {
  const lower = name.toLowerCase();
  for (const def of GTO_STUDY_TIERS) {
    if (def.drillMatchers.some((m) => lower.includes(m))) {
      return def.tier;
    }
  }
  return null;
}

export function resolveDrillTier(
  explicit: GtoStudyTier | null | undefined,
  drillName: string
): GtoStudyTier | null {
  if (explicit != null && explicit >= 1 && explicit <= 3) return explicit;
  return inferTierFromDrillName(drillName);
}
