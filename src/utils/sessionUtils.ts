import type { SessionResult } from '../types/results';
import { RESULTS_STAKE_OPTIONS } from '../types/results';

const ALLOWED_SESSION_STAKES = new Set<number>(RESULTS_STAKE_OPTIONS);

/** Stakes for a session (supports legacy single `stake` field). */
export function getSessionStakes(session: Pick<SessionResult, 'stake' | 'stakes'>): number[] {
  if (session.stakes && session.stakes.length > 0) {
    return [...session.stakes].sort((a, b) => a - b);
  }
  if (session.stake != null) return [session.stake];
  return [];
}

export function formatSessionStakes(session: Pick<SessionResult, 'stake' | 'stakes'>): string {
  const stakes = getSessionStakes(session);
  return stakes.length > 0 ? stakes.join(', ') : '—';
}

export function toggleSessionStake(current: number[], stake: number): number[] {
  if (!ALLOWED_SESSION_STAKES.has(stake)) return current;
  return current.includes(stake)
    ? current.filter((s) => s !== stake)
    : [...current, stake].sort((a, b) => a - b);
}

export function normalizeSessionStakes(stakes: number[]): number[] {
  return [...new Set(stakes.filter((s) => ALLOWED_SESSION_STAKES.has(s)))].sort((a, b) => a - b);
}

/**
 * Get session net from explicit account start/end when both present, else dailyNet.
 *
 * Important: do not infer start bankroll from a "previous session" because many
 * callers pass filtered subsets (HU-only, ring-only, date ranges). Inferring
 * across a filtered list can accidentally pull an older start value and make
 * filtered totals incorrect.
 */
export function getSessionNet(
  session: SessionResult
): number {
  const accountStart = session.startBankroll ?? null;
  const accountEnd = session.endBankroll ?? null;
  if (accountStart != null && accountEnd != null) return accountEnd - accountStart;
  return session.dailyNet ?? 0;
}

/** Get session net for each session (chronological order). Returns map of id -> net. */
export function getSessionNetsMap(sessions: SessionResult[]): Map<string, number> {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const byId = new Map<string, number>();
  for (const s of sorted) {
    byId.set(s._id, getSessionNet(s));
  }
  return byId;
}

/** Most recent session by date then endTime (desc). */
export function getMostRecentSession(sessions: SessionResult[]): SessionResult | null {
  if (sessions.length === 0) return null;
  return [...sessions].sort((a, b) => {
    const dA = new Date(a.date).getTime();
    const dB = new Date(b.date).getTime();
    if (dA !== dB) return dB - dA;
    const eA = a.endTime ? new Date(a.endTime).getTime() : 0;
    const eB = b.endTime ? new Date(b.endTime).getTime() : 0;
    return eB - eA;
  })[0];
}

/** First session chronologically (for initial bankroll). */
export function getFirstSessionChronological(sessions: SessionResult[]): SessionResult | null {
  if (sessions.length === 0) return null;
  return [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )[0];
}

/** Net won from poker = Current account + Total withdrawn - Initial bankroll. */
export function computeNetWon(
  currentAccount: number | null,
  totalWithdrawn: number,
  initialBankroll: number | null
): number {
  if (currentAccount == null) return 0;
  const initial = initialBankroll ?? 0;
  return currentAccount - initial + totalWithdrawn;
}
