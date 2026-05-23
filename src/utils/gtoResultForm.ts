import type { GtoDrillResult } from '../types/gtoStudy';

export interface GtoResultFormSnapshot {
  date: string;
  evLoss: string;
  handsPlayed: string;
  accuracy: string;
  evDiff: string;
  score: string;
  notes: string;
}

export function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emptyResultFormSnapshot(): GtoResultFormSnapshot {
  return {
    date: toLocalDatetimeValue(new Date().toISOString()),
    evLoss: '',
    handsPlayed: '',
    accuracy: '',
    evDiff: '',
    score: '',
    notes: '',
  };
}

export function resultFormSnapshotFromResult(result: GtoDrillResult): GtoResultFormSnapshot {
  return {
    date: toLocalDatetimeValue(result.date),
    evLoss: result.evLoss != null ? String(result.evLoss) : '',
    handsPlayed: result.handsPlayed != null ? String(result.handsPlayed) : '',
    accuracy: result.accuracy != null ? String(result.accuracy) : '',
    evDiff: result.evDiff != null ? String(result.evDiff) : '',
    score: result.score != null ? String(result.score) : '',
    notes: result.notes ?? '',
  };
}

export function isResultFormDirty(
  current: GtoResultFormSnapshot,
  baseline: GtoResultFormSnapshot | null
): boolean {
  if (!baseline) return false;
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
