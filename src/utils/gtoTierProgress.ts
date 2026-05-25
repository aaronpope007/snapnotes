import {
  GTO_STUDY_TIERS as BASE_GTO_STUDY_TIERS,
  type GtoTierDefinition,
} from '../constants/gtoStudyTiers';
import type { GtoStudyTier } from '../types/gtoStudy';
import type { GtoTierProgressRow } from '../types/gtoTierProgress';
import { computeScorePerHand } from './gtoStudyUtils';

export const GTO_STUDY_TIERS: GtoTierDefinition[] = BASE_GTO_STUDY_TIERS.map((def) =>
  def.tier === 1
    ? {
        ...def,
        drillMatchers: [...def.drillMatchers, 'vs 3b preflop', 'vs 4b preflop'],
      }
    : def
);

export type { GtoTierDefinition };

function resolveDrillTier(
  explicit: GtoStudyTier | null | undefined,
  drillName: string
): GtoStudyTier | null {
  if (explicit != null && explicit >= 1 && explicit <= 3) return explicit;
  const lower = drillName.toLowerCase();
  for (const def of GTO_STUDY_TIERS) {
    if (def.drillMatchers.some((m) => lower.includes(m))) {
      return def.tier;
    }
  }
  return null;
}

export function groupRowsByTier(rows: GtoTierProgressRow[]): {
  tiers: Array<{ def: GtoTierDefinition; drills: GtoTierProgressRow[] }>;
  uncategorized: GtoTierProgressRow[];
} {
  const buckets = new Map<number, GtoTierProgressRow[]>();
  for (const def of GTO_STUDY_TIERS) {
    buckets.set(def.tier, []);
  }
  const uncategorized: GtoTierProgressRow[] = [];

  for (const row of rows) {
    const tier = resolveDrillTier(row.tier, row.name);
    if (tier == null) {
      uncategorized.push(row);
    } else {
      buckets.get(tier)?.push(row);
    }
  }

  const tiers = GTO_STUDY_TIERS.map((def) => ({
    def,
    drills: buckets.get(def.tier) ?? [],
  }));

  return { tiers, uncategorized };
}

export function tierLoggedCount(drills: GtoTierProgressRow[]): number {
  return drills.filter((d) => d.timesLogged > 0).length;
}

export function tierAverageAccuracy(drills: GtoTierProgressRow[]): number | null {
  const values = drills
    .filter((d) => d.timesLogged > 0 && d.latestAccuracy != null && Number.isFinite(d.latestAccuracy))
    .map((d) => d.latestAccuracy as number);
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Average latest score per hand across logged drills in the tier. */
export function tierAverageScorePerHand(drills: GtoTierProgressRow[]): number | null {
  const values = drills
    .map((d) => computeScorePerHand(d.latestScore, d.latestHandsPlayed))
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export type DrillStatusKind = 'not_started' | 'in_progress' | 'solid';

export function drillStatus(row: GtoTierProgressRow): DrillStatusKind {
  if (row.timesLogged === 0) return 'not_started';
  if (row.latestAccuracy != null && row.latestAccuracy >= 75) return 'solid';
  return 'in_progress';
}

export function progressBarColor(
  avgAccuracy: number | null,
  palette: { success: { main: string }; warning: { main: string }; error: { main: string } }
): string {
  if (avgAccuracy == null) return palette.error.main;
  if (avgAccuracy >= 75) return palette.success.main;
  if (avgAccuracy >= 50) return palette.warning.main;
  return palette.error.main;
}
