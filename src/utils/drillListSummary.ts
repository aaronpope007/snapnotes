import { computeEvLossPerHand } from './gtoStudyUtils';

/** Slim result shapes from GET drills?recentResults=1 (sorted newest-first). */
export interface GtoDrillResultSummaryRow {
  _id?: string;
  date: string;
  evLoss?: number;
  handsPlayed?: number;
}

function comparisonMetric(r: GtoDrillResultSummaryRow): number | undefined {
  return (
    computeEvLossPerHand(r.evLoss, r.handsPlayed) ??
    (r.evLoss != null && Number.isFinite(r.evLoss) ? r.evLoss : undefined)
  );
}

/** Most recent EV/hand if chartable; else total EV loss. */
export function drillListScoreText(recent: GtoDrillResultSummaryRow[] | undefined): string {
  const rows = [...(recent ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const newest = rows[0];
  if (!newest) return '—';

  const perHand = computeEvLossPerHand(newest.evLoss, newest.handsPlayed);
  const roundedLoss = Math.round(Number(newest.evLoss ?? 0) * 100) / 100;

  if (perHand != null) {
    const r = Math.round(perHand * 10) / 10;
    return `−${r} EV/hand`;
  }
  if (newest.evLoss != null && Number.isFinite(newest.evLoss)) {
    return `−${roundedLoss} EV loss`;
  }
  return '—';
}

export type DrillListTrendArrow = null | 'improving' | 'declining' | 'flat';

const MIN_FOR_ARROW = 2;
/** Need two non-overlapping triplets without wrap. */
const MIN_FOR_DIRECTIONAL_COMPARE = 6;
const MIN_FOR_FLAT_BY_COUNT = 4;
const RELATIVE_EPS = 0.05;

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

/**
 * Comparison values newest-first → compare avg(first 3) vs avg(next 3).
 * Improving: recent loss metric moved toward zero (recentAvg < priorAvg for positive-loss convention).
 */
export function drillListTrend(recent: GtoDrillResultSummaryRow[] | undefined): DrillListTrendArrow {
  const rows = [...(recent ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const vals = rows.map(comparisonMetric).filter((v): v is number => v != null && Number.isFinite(v));

  if (vals.length < MIN_FOR_ARROW) return null;
  if (vals.length < MIN_FOR_FLAT_BY_COUNT || vals.length < MIN_FOR_DIRECTIONAL_COMPARE) return 'flat';

  const recentAvg = avg(vals.slice(0, 3));
  const priorAvg = avg(vals.slice(3, 6));

  const absDiff = Math.abs(recentAvg - priorAvg);
  const denom = Math.abs(priorAvg) > 1e-9 ? Math.abs(priorAvg) : Math.max(Math.abs(recentAvg), 1e-9);
  if (absDiff / denom < RELATIVE_EPS) return 'flat';

  return recentAvg < priorAvg ? 'improving' : 'declining';
}
