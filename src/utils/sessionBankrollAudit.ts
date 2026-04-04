import type { SessionResult } from '../types/results';
import { getSessionFormatBucket, type SessionFormatBucket } from './sessionFormat';

export type BankrollAuditHow =
  | 'explicit_start_end'
  | 'carry_plus_end'
  | 'daily_net_fallback'
  | 'none';

export interface BankrollCarryAuditRow {
  sessionId: string;
  dateKey: string;
  formatShort: string;
  startStored: number | null;
  startEffective: number | null;
  endStored: number | null;
  /** end − startEffective when both are numbers; otherwise null. */
  netFromBankrolls: number | null;
  dailyNetStored: number | null;
  /** Same value the grid and Summary use for totals (full-session carry-forward). */
  netUsed: number;
  howComputed: BankrollAuditHow;
  warnings: string[];
}

function formatBucketLabel(b: SessionFormatBucket): string {
  if (b === 'huOnly') return 'HU';
  if (b === 'ringOnly') return 'Ring';
  if (b === 'both') return 'Both';
  return '—';
}

/**
 * Walk all sessions in chronological order with the same bankroll carry-forward
 * rules as `SessionsGridTab` / Summary (full history).
 */
export function buildBankrollCarryAuditRows(allSessions: SessionResult[]): BankrollCarryAuditRow[] {
  const sorted = [...allSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const rows: BankrollCarryAuditRow[] = [];
  let prevEndBankroll: number | null = null;

  for (const s of sorted) {
    const startStored = s.startBankroll ?? null;
    const endStored = s.endBankroll ?? null;
    const startEffective = startStored ?? prevEndBankroll;

    let netFromBankrolls: number | null = null;
    let netUsed = 0;
    let howComputed: BankrollAuditHow;

    if (startEffective != null && endStored != null) {
      netFromBankrolls = endStored - startEffective;
      netUsed = netFromBankrolls;
      howComputed = startStored != null ? 'explicit_start_end' : 'carry_plus_end';
    } else {
      netUsed = s.dailyNet ?? 0;
      howComputed = s.dailyNet != null ? 'daily_net_fallback' : 'none';
    }

    const warnings: string[] = [];
    if (
      netFromBankrolls != null &&
      s.dailyNet != null &&
      Math.abs(s.dailyNet - netFromBankrolls) > 0.02
    ) {
      warnings.push(
        `dailyNet ($${s.dailyNet.toFixed(2)}) ≠ bankroll delta ($${netFromBankrolls.toFixed(2)})`
      );
    }
    if (startStored != null && endStored == null) {
      warnings.push('Account start is set but account end is missing');
    }

    rows.push({
      sessionId: s._id,
      dateKey: s.date.slice(0, 10),
      formatShort: formatBucketLabel(getSessionFormatBucket(s)),
      startStored,
      startEffective,
      endStored,
      netFromBankrolls,
      dailyNetStored: s.dailyNet ?? null,
      netUsed,
      howComputed,
      warnings,
    });

    prevEndBankroll = endStored;
  }

  return rows;
}

export function sumAuditNetForIds(rows: BankrollCarryAuditRow[], sessionIds: Set<string>): number {
  let sum = 0;
  for (const r of rows) {
    if (sessionIds.has(r.sessionId)) sum += r.netUsed;
  }
  return sum;
}

/** Same per-session net as the grid, Summary, and Audit (full-history bankroll carry-forward). */
export function getSessionNetMapWithCarryForward(allSessions: SessionResult[]): Map<string, number> {
  const rows = buildBankrollCarryAuditRows(allSessions);
  return new Map(rows.map((r) => [r.sessionId, r.netUsed]));
}

export function auditRowsToCsv(rows: BankrollCarryAuditRow[]): string {
  const header = [
    'sessionId',
    'date',
    'format',
    'startStored',
    'startEffective',
    'endStored',
    'netFromBankrolls',
    'dailyNet',
    'netUsed',
    'howComputed',
    'warnings',
  ].join(',');
  const lines = rows.map((r) =>
    [
      r.sessionId,
      r.dateKey,
      r.formatShort,
      r.startStored ?? '',
      r.startEffective ?? '',
      r.endStored ?? '',
      r.netFromBankrolls ?? '',
      r.dailyNetStored ?? '',
      r.netUsed,
      r.howComputed,
      `"${r.warnings.join('; ').replace(/"/g, '""')}"`,
    ].join(',')
  );
  return [header, ...lines].join('\n');
}
