import type { SessionResult } from '../types/results';
import { getSessionNet } from './sessionUtils';

export interface HandRangeStatsResult {
  /** Sum of net attributed to the range (prorated per session by overlapping hands). */
  totalNet: number;
  /** Total hands whose counters fall in the range (inclusive bounds). */
  handsInRange: number;
  /** totalNet / handsInRange when handsInRange > 0. */
  profitPerHand: number | null;
  /** Sessions with any overlap. */
  sessionsTouching: number;
}

/**
 * Largest "Hands end" style counter seen after walking sessions like the grid (exclusive end of half-open interval).
 * Useful as a hint for valid inputs.
 */
export function getLatestHandCounterEnd(sessions: SessionResult[]): number | null {
  if (sessions.length === 0) return null;
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let cumulativeHands = 0;
  let maxEnd = 0;
  for (const s of sorted) {
    const h = s.hands ?? 0;
    const handsEnd = s.handsEndedAt ?? null;
    const displayHandsEnd = handsEnd ?? cumulativeHands + h;
    cumulativeHands = handsEnd ?? cumulativeHands + h;
    if (displayHandsEnd > maxEnd) maxEnd = displayHandsEnd;
  }
  return maxEnd;
}

/**
 * Prorate each session's net by the fraction of its hands overlapping [fromInclusive, toInclusive].
 * Session spans use the same rules as `SessionsGridTab` (half-open [start, end)).
 */
export function computeHandRangeStats(
  sessions: SessionResult[],
  fromInclusive: number,
  toInclusive: number
): HandRangeStatsResult {
  if (!Number.isFinite(fromInclusive) || !Number.isFinite(toInclusive) || fromInclusive > toInclusive) {
    return { totalNet: 0, handsInRange: 0, profitPerHand: null, sessionsTouching: 0 };
  }

  const rangeLo = fromInclusive;
  const rangeHiEx = toInclusive + 1;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeHands = 0;
  let totalNet = 0;
  let handsInRange = 0;
  let sessionsTouching = 0;

  for (const s of sorted) {
    const h = s.hands ?? 0;
    const handsStart = s.handsStartedAt ?? null;
    const handsEnd = s.handsEndedAt ?? null;
    const displayStart = handsStart ?? cumulativeHands;
    const displayEnd = handsEnd ?? cumulativeHands + h;
    cumulativeHands = handsEnd ?? cumulativeHands + h;

    const sessionLo = displayStart;
    const sessionHiEx = displayEnd;

    const overlapLo = Math.max(sessionLo, rangeLo);
    const overlapHiEx = Math.min(sessionHiEx, rangeHiEx);
    const overlap = Math.max(0, overlapHiEx - overlapLo);

    const sessionHands = Math.max(0, sessionHiEx - sessionLo);
    const net = getSessionNet(s);

    if (overlap > 0) {
      sessionsTouching += 1;
      if (sessionHands > 0) {
        totalNet += (overlap / sessionHands) * net;
      }
      handsInRange += overlap;
    }
  }

  const profitPerHand = handsInRange > 0 ? totalNet / handsInRange : null;
  return {
    totalNet,
    handsInRange,
    profitPerHand,
    sessionsTouching,
  };
}
