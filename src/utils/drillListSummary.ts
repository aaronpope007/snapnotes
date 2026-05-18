import { formatAccuracyAcc, formatScorePerHand } from './gtoStudyUtils';

/** Slim result shapes from GET drills?recentResults=1 (sorted newest-first). */
export interface GtoDrillResultSummaryRow {
  _id?: string;
  date: string;
  evLoss?: number;
  handsPlayed?: number;
  accuracy?: number;
  score?: number;
}

function sortedRows(recent: GtoDrillResultSummaryRow[] | undefined): GtoDrillResultSummaryRow[] {
  return [...(recent ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Most recent result with accuracy. */
export function drillListPerformancePrimary(
  recent: GtoDrillResultSummaryRow[] | undefined
): string {
  for (const row of sortedRows(recent)) {
    if (row.accuracy != null && Number.isFinite(row.accuracy)) {
      return formatAccuracyAcc(row.accuracy);
    }
  }
  return '—';
}

/** Most recent result with score and handsPlayed. */
export function drillListPerformanceSecondary(
  recent: GtoDrillResultSummaryRow[] | undefined
): string {
  for (const row of sortedRows(recent)) {
    const formatted = formatScorePerHand(row.score, row.handsPlayed);
    if (formatted !== '—') return formatted;
  }
  return '—';
}

/** Combined label for tooltips: "91% acc · 0.47 pts/hand" */
export function drillListPerformanceLabel(recent: GtoDrillResultSummaryRow[] | undefined): string {
  const primary = drillListPerformancePrimary(recent);
  const secondary = drillListPerformanceSecondary(recent);
  return `${primary} · ${secondary}`;
}

/** @deprecated Use drillListPerformanceLabel */
export function drillListScoreText(recent: GtoDrillResultSummaryRow[] | undefined): string {
  return drillListPerformanceLabel(recent);
}

export type DrillListTrendArrow = null | 'improving' | 'declining' | 'flat';

const MIN_FOR_ARROW = 2;
const MIN_FOR_DIRECTIONAL_COMPARE = 6;
const MIN_FOR_FLAT_BY_COUNT = 4;
const RELATIVE_EPS = 0.05;

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

function accuracyValues(recent: GtoDrillResultSummaryRow[] | undefined): number[] {
  const rows = sortedRows(recent);
  const vals: number[] = [];
  for (const r of rows) {
    if (r.accuracy != null && Number.isFinite(r.accuracy)) {
      vals.push(r.accuracy);
      if (vals.length >= 6) break;
    }
  }
  return vals;
}

/**
 * Trend from accuracy (higher = better).
 * ▲ improving — recent 3 avg > prior 3 avg by more than 5%
 * ▼ declining — recent 3 avg < prior 3 avg by more than 5%
 * → flat — fewer than 4 chartable, or change within 5%, or fewer than 6 for 3-vs-3
 * null — fewer than 2 chartable
 */
export function drillListTrend(recent: GtoDrillResultSummaryRow[] | undefined): DrillListTrendArrow {
  const vals = accuracyValues(recent);

  if (vals.length < MIN_FOR_ARROW) return null;
  if (vals.length < MIN_FOR_FLAT_BY_COUNT || vals.length < MIN_FOR_DIRECTIONAL_COMPARE) return 'flat';

  const recentAvg = avg(vals.slice(0, 3));
  const priorAvg = avg(vals.slice(3, 6));

  const absDiff = Math.abs(recentAvg - priorAvg);
  const denom = Math.abs(priorAvg) > 1e-9 ? Math.abs(priorAvg) : Math.max(Math.abs(recentAvg), 1e-9);
  if (absDiff / denom < RELATIVE_EPS) return 'flat';

  return recentAvg > priorAvg ? 'improving' : 'declining';
}
