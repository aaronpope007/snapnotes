import type { SessionPauseInterval } from '../types/results';

/** Sum of (end - start) for each interval in milliseconds (invalid pairs skipped). */
export function sumPauseIntervalsDurationMs(intervals: SessionPauseInterval[] | undefined | null): number {
  if (!intervals?.length) return 0;
  let sum = 0;
  for (const iv of intervals) {
    const a = new Date(iv.start).getTime();
    const b = new Date(iv.end).getTime();
    if (Number.isNaN(a) || Number.isNaN(b) || b <= a) continue;
    sum += b - a;
  }
  return sum;
}

/**
 * Milliseconds of overlap between [windowStart, windowEnd] and each pause interval.
 * Used when editing a session so wall clock minus breaks matches stored play time.
 */
export function pauseOverlapMsWithinWindow(
  windowStart: Date,
  windowEnd: Date,
  intervals: SessionPauseInterval[] | undefined | null
): number {
  if (!intervals?.length) return 0;
  const ws = windowStart.getTime();
  const we = windowEnd.getTime();
  if (Number.isNaN(ws) || Number.isNaN(we) || we <= ws) return 0;
  let sum = 0;
  for (const iv of intervals) {
    const is = new Date(iv.start).getTime();
    const ie = new Date(iv.end).getTime();
    if (Number.isNaN(is) || Number.isNaN(ie) || ie <= is) continue;
    const lo = Math.max(is, ws);
    const hi = Math.min(ie, we);
    if (hi > lo) sum += hi - lo;
  }
  return sum;
}

export function getPlayingMsFromWallAndPauses(
  startIso: string,
  endIso: string,
  pauseIntervals: SessionPauseInterval[]
): number {
  const wall = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (Number.isNaN(wall) || wall <= 0) return 0;
  const paused = sumPauseIntervalsDurationMs(pauseIntervals);
  return Math.max(0, wall - paused);
}

export function getPlayingHoursFromWallAndPauses(
  startIso: string,
  endIso: string,
  pauseIntervals: SessionPauseInterval[]
): number {
  return getPlayingMsFromWallAndPauses(startIso, endIso, pauseIntervals) / (1000 * 60 * 60);
}
