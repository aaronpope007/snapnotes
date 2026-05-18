import type { GtoDrillResult } from '../types/gtoStudy';

/** Derived client-side only — not stored in DB. Never returns NaN. */
export function computeEvLossPerHand(
  evLoss: number | undefined | null,
  handsPlayed: number | undefined | null
): number | undefined {
  if (evLoss == null || handsPlayed == null) return undefined;
  if (!Number.isFinite(evLoss) || !Number.isFinite(handsPlayed)) return undefined;
  if (handsPlayed < 1) return undefined;
  const value = evLoss / handsPlayed;
  if (!Number.isFinite(value)) return undefined;
  return Math.round(value * 1000) / 1000;
}

/** Derived client-side only — not stored in DB. Never returns NaN. */
export function computeScorePerHand(
  score: number | undefined | null,
  handsPlayed: number | undefined | null
): number | undefined {
  if (score == null || handsPlayed == null) return undefined;
  if (!Number.isFinite(score) || !Number.isFinite(handsPlayed)) return undefined;
  if (handsPlayed < 1) return undefined;
  const value = score / handsPlayed;
  if (!Number.isFinite(value)) return undefined;
  return Math.round(value * 1000) / 1000;
}

export type GtoChartMetric = 'accuracy' | 'scorePerHand' | 'evLoss' | 'evLossPerHand';

export function countAccuracyChartPoints(results: GtoDrillResult[]): number {
  return results.filter((r) => r.accuracy != null && Number.isFinite(r.accuracy)).length;
}

export function countScorePerHandChartPoints(results: GtoDrillResult[]): number {
  return results.filter((r) => computeScorePerHand(r.score, r.handsPlayed) != null).length;
}

export function countEvLossChartPoints(results: GtoDrillResult[]): number {
  return results.filter((r) => r.evLoss != null && Number.isFinite(r.evLoss)).length;
}

export function countPerHandChartPoints(results: GtoDrillResult[]): number {
  return results.filter((r) => computeEvLossPerHand(r.evLoss, r.handsPlayed) != null).length;
}

/** Prefer Accuracy → Score/Hand → EV Loss when enough results support each metric. */
export function getDefaultChartMetric(results: GtoDrillResult[]): GtoChartMetric {
  const accuracyCount = countAccuracyChartPoints(results);
  const scorePerHand = countScorePerHandChartPoints(results);
  const perHand = countPerHandChartPoints(results);
  const evLoss = countEvLossChartPoints(results);
  const total = results.length;

  if (accuracyCount > 0) {
    if (total === 0 || accuracyCount / total >= 0.5 || evLoss === 0) {
      return 'accuracy';
    }
  }

  if (scorePerHand > 0) {
    if (evLoss === 0 || scorePerHand / evLoss >= 0.5) {
      return 'scorePerHand';
    }
  }

  if (perHand === 0) return 'evLoss';
  if (evLoss > 0 && perHand / evLoss < 0.5) return 'evLoss';
  return 'evLossPerHand';
}

export function validateHandsPlayedInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (!/^\d+$/.test(trimmed)) return 'Whole number only';
  const n = Number.parseInt(trimmed, 10);
  if (n < 1) return 'Must be at least 1';
  return undefined;
}

export function validateAccuracyPercentInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) return 'Must be a number';
  if (n < 0 || n > 100) return '0–100';
  return undefined;
}

export function validateEvDiffInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) return 'Must be a number';
  return undefined;
}

export function validateScorePositiveInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) return 'Must be a number';
  if (n <= 0) return 'Must be positive';
  return undefined;
}

export function formatEvLossPerHand(
  evLoss: number | undefined,
  handsPlayed: number | undefined
): string {
  const perHand = computeEvLossPerHand(evLoss, handsPlayed);
  if (perHand == null) return '—';
  return `−${perHand} bb/hand`;
}

export function formatEvLoss(evLoss: number | undefined): string {
  if (evLoss == null) return '—';
  return `−${evLoss} bb`;
}

export function formatHandsPlayed(handsPlayed: number | undefined): string {
  if (handsPlayed == null) return '—';
  return String(handsPlayed);
}

export function formatAccuracyPercent(accuracy: number | undefined): string {
  if (accuracy == null) return '—';
  if (!Number.isFinite(accuracy)) return '—';
  const r = Math.round(accuracy * 100) / 100;
  return `${r}%`;
}

export function formatEvDiff(evDiff: number | undefined): string {
  if (evDiff == null) return '—';
  if (!Number.isFinite(evDiff)) return '—';
  const r = Math.round(evDiff * 100) / 100;
  if (r === 0) return '0';
  return r > 0 ? `+${r}` : String(r);
}

export function formatSessionScore(score: number | undefined): string {
  if (score == null) return '—';
  if (!Number.isFinite(score)) return '—';
  const r = Math.round(score * 100) / 100;
  return String(r);
}

export function formatScorePerHand(
  score: number | undefined,
  handsPlayed: number | undefined
): string {
  const perHand = computeScorePerHand(score, handsPlayed);
  if (perHand == null) return '—';
  const r = Math.round(perHand * 100) / 100;
  return `${r} pts/hand`;
}

/** Summary row: e.g. 91% acc */
export function formatAccuracyAcc(accuracy: number | undefined): string {
  if (accuracy == null || !Number.isFinite(accuracy)) return '—';
  const r = Math.round(accuracy * 100) / 100;
  return `${r}% acc`;
}

export function formatBestActionRate(bestActionRate: number | undefined): string {
  if (bestActionRate == null || !Number.isFinite(bestActionRate)) return '—';
  const r = Math.round(bestActionRate * 100) / 100;
  return `${r}%`;
}

export function getDateKey(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateHeader(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = getDateKey(isoDate);
  if (key === getDateKey(today.toISOString())) return 'Today';
  if (key === getDateKey(yesterday.toISOString())) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatResultTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface GtoResultDateGroup {
  dateKey: string;
  header: string;
  results: GtoDrillResult[];
}

export function groupResultsByDate(results: GtoDrillResult[]): GtoResultDateGroup[] {
  const map = new Map<string, GtoDrillResult[]>();
  for (const result of results) {
    const key = getDateKey(result.date);
    const list = map.get(key) ?? [];
    list.push(result);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, groupResults]) => ({
      dateKey,
      header: formatDateHeader(groupResults[0].date),
      results: groupResults.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
}
