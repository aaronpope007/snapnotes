import {
  GTO_STUDY_TIERS as BASE_GTO_STUDY_TIERS,
  type GtoTierDefinition,
} from '../constants/gtoStudyTiers';
import type { GtoFormat, GtoStudyTier } from '../types/gtoStudy';
import type { GtoTierProgressRow } from '../types/gtoTierProgress';
import { computeScorePerHand } from './gtoStudyUtils';

export const HU_TIERS: GtoTierDefinition[] = BASE_GTO_STUDY_TIERS.map((def) =>
  def.tier === 1
    ? {
        ...def,
        drillMatchers: [...def.drillMatchers, 'vs 3b preflop', 'vs 4b preflop'],
      }
    : def
);

export const RING_TIERS: GtoTierDefinition[] = [
  {
    tier: 1,
    label: 'Tier 1 — Preflop All Positions',
    description: '8max preflop opens and facing opens — all seats',
    drillMatchers: [
      '8max preflop utg',
      '8max preflop lj',
      '8max preflop hj',
      '8max preflop co',
      '8max preflop bu',
      '8max preflop btn',
      '8max preflop sb',
      '8max preflop bb',
      '8max preflop ss',
      'preflop utg',
      'preflop lj',
      'preflop hj',
      'preflop co',
      'preflop bu',
      'preflop btn',
      'preflop sb',
      'preflop bb',
      'preflop ss',
    ],
  },
];

/** @deprecated Use HU_TIERS */
export const GTO_STUDY_TIERS = HU_TIERS;

export type { GtoTierDefinition };

export function getTiersForFormat(format: GtoFormat): GtoTierDefinition[] {
  return format === '8max' ? RING_TIERS : HU_TIERS;
}

export function resolveDrillTier(
  explicit: GtoStudyTier | null | undefined,
  drillName: string,
  format: GtoFormat = 'HU'
): GtoStudyTier | null {
  if (explicit != null && explicit >= 1 && explicit <= 3) return explicit;
  const lower = drillName.toLowerCase();
  for (const def of getTiersForFormat(format)) {
    if (def.drillMatchers.some((m) => lower.includes(m))) {
      return def.tier;
    }
  }
  return null;
}

export function groupRowsByTier(
  rows: GtoTierProgressRow[],
  format: GtoFormat = 'HU'
): {
  tiers: Array<{ def: GtoTierDefinition; drills: GtoTierProgressRow[] }>;
  uncategorized: GtoTierProgressRow[];
} {
  const tierDefs = getTiersForFormat(format);
  const buckets = new Map<number, GtoTierProgressRow[]>();
  for (const def of tierDefs) {
    buckets.set(def.tier, []);
  }
  const uncategorized: GtoTierProgressRow[] = [];

  for (const row of rows) {
    const tier = resolveDrillTier(row.tier, row.name, format);
    if (tier == null) {
      uncategorized.push(row);
    } else {
      buckets.get(tier)?.push(row);
    }
  }

  const tiers = tierDefs.map((def) => ({
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
  if (row.latestAccuracy != null && row.latestAccuracy >= 95) return 'solid';
  if (row.latestAccuracy != null && row.latestAccuracy >= 50 && row.latestAccuracy < 95) {
    return 'in_progress';
  }
  return 'in_progress';
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Days until next review from latest session date, by latest accuracy. */
export function computeNextReviewDate(row: GtoTierProgressRow): Date | null {
  if (row.timesLogged === 0 || !row.latestDate) return null;
  const acc = row.latestAccuracy;
  if (acc == null || !Number.isFinite(acc)) return null;

  const base = new Date(row.latestDate);
  if (Number.isNaN(base.getTime())) return null;

  let days = 1;
  if (acc >= 95) days = 14;
  else if (acc >= 75) days = 7;
  else if (acc >= 50) days = 3;

  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatNextReviewDisplay(next: Date | null): { text: string; overdue: boolean } {
  if (!next) return { text: '—', overdue: false };
  const today = startOfLocalDay(new Date());
  const reviewDay = startOfLocalDay(next);
  const overdue = reviewDay.getTime() <= today.getTime();
  const label = next.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { text: overdue ? `! ${label}` : label, overdue };
}

export type ScoreTrendDirection = 'up' | 'down' | 'flat' | null;

const TREND_FLAT_EPS = 0.05;

export function scoreTrendDirection(row: GtoTierProgressRow): ScoreTrendDirection {
  if (row.timesLogged < 2) return null;
  const scores = row.recentScores.filter((s) => Number.isFinite(s));
  if (scores.length < 2) return null;

  const diff = scores[0] - scores[1];
  const pct = Math.abs(diff) / (Math.abs(scores[1]) || 1);
  if (pct <= TREND_FLAT_EPS) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

function resolvedTierForRow(row: GtoTierProgressRow, format: GtoFormat): number {
  const t = resolveDrillTier(row.tier, row.name, format);
  return t ?? 99;
}

function stackSortKey(stack: string): number {
  return stack === '100bb' ? 0 : 1;
}

/** Up to 3 drills to run today by review priority. */
export function pickDrillToday(
  rows: GtoTierProgressRow[],
  max = 3,
  format: GtoFormat = 'HU'
): GtoTierProgressRow[] {
  const today = startOfLocalDay(new Date());
  const picked = new Set<string>();
  const out: GtoTierProgressRow[] = [];

  const take = (candidates: GtoTierProgressRow[]) => {
    for (const row of candidates) {
      if (out.length >= max) return;
      if (picked.has(row.drillId)) continue;
      picked.add(row.drillId);
      out.push(row);
    }
  };

  const overdue = rows
    .map((row) => ({ row, next: computeNextReviewDate(row) }))
    .filter(
      (x): x is { row: GtoTierProgressRow; next: Date } =>
        x.next != null && startOfLocalDay(x.next).getTime() <= today.getTime()
    )
    .sort((a, b) => a.next.getTime() - b.next.getTime())
    .map((x) => x.row);
  take(overdue);

  const neverLogged = rows
    .filter((r) => r.timesLogged === 0)
    .sort(
      (a, b) =>
        resolvedTierForRow(a, format) - resolvedTierForRow(b, format) ||
        stackSortKey(a.stack) - stackSortKey(b.stack) ||
        a.name.localeCompare(b.name)
    );
  take(neverLogged);

  const lowestAcc = rows
    .filter(
      (r) =>
        r.timesLogged > 0 &&
        r.latestAccuracy != null &&
        Number.isFinite(r.latestAccuracy) &&
        !picked.has(r.drillId)
    )
    .sort((a, b) => (a.latestAccuracy as number) - (b.latestAccuracy as number));
  take(lowestAcc);

  return out;
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
