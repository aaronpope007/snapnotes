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

export function countEvLossChartPoints(results: GtoDrillResult[]): number {
  return results.filter((r) => r.evLoss != null && Number.isFinite(r.evLoss)).length;
}

export function countPerHandChartPoints(results: GtoDrillResult[]): number {
  return results.filter((r) => computeEvLossPerHand(r.evLoss, r.handsPlayed) != null).length;
}

/** Prefer EV / Hand only when enough results support it; otherwise EV Loss. */
export function getDefaultChartMetric(results: GtoDrillResult[]): 'evLoss' | 'evLossPerHand' {
  const perHand = countPerHandChartPoints(results);
  const evLoss = countEvLossChartPoints(results);
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
