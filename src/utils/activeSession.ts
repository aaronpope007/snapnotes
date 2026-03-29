import type { SessionPauseInterval } from '../types/results';
import { sumPauseIntervalsDurationMs } from './sessionPause';

const STORAGE_KEY = 'snapnotes_active_session';

export interface ActiveSession {
  startTime: string; // ISO string
  userId: string;
  startHandNumber: number;
  /** Completed pauses (each interval is wall time not counted as play). */
  pauseIntervals: SessionPauseInterval[];
  /** If set, session is currently paused since this ISO time. */
  pauseStartedAt: string | null;
}

function normalizeActiveSession(raw: {
  startTime: string;
  userId: string;
  startHandNumber: number;
  pauseIntervals?: SessionPauseInterval[];
  pauseStartedAt?: string | null;
}): ActiveSession {
  const pauseIntervals = Array.isArray(raw.pauseIntervals)
    ? raw.pauseIntervals.filter(
        (iv) =>
          iv &&
          typeof iv.start === 'string' &&
          typeof iv.end === 'string' &&
          new Date(iv.end).getTime() > new Date(iv.start).getTime()
      )
    : [];
  return {
    startTime: raw.startTime,
    userId: raw.userId,
    startHandNumber: raw.startHandNumber,
    pauseIntervals,
    pauseStartedAt: typeof raw.pauseStartedAt === 'string' ? raw.pauseStartedAt : null,
  };
}

export function getActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as ActiveSession).startTime === 'string' &&
      typeof (parsed as ActiveSession).userId === 'string' &&
      typeof (parsed as ActiveSession).startHandNumber === 'number'
    ) {
      return normalizeActiveSession(parsed as ActiveSession);
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveSession(session: ActiveSession): void {
  const normalized = normalizeActiveSession(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function clearActiveSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Append closed interval for any open pause through `endIso`. */
export function finalizePauseIntervalsForEnd(active: ActiveSession, endIso: string): SessionPauseInterval[] {
  const intervals = [...active.pauseIntervals];
  if (active.pauseStartedAt) {
    const ps = new Date(active.pauseStartedAt).getTime();
    const pe = new Date(endIso).getTime();
    if (!Number.isNaN(ps) && !Number.isNaN(pe) && pe > ps) {
      intervals.push({ start: active.pauseStartedAt, end: endIso });
    }
  }
  return intervals;
}

/** Playing time in ms from start to asOf, excluding completed pauses and current pause (if any). */
export function getPlayingElapsedMs(active: ActiveSession, asOfMs: number = Date.now()): number {
  const start = new Date(active.startTime).getTime();
  if (Number.isNaN(start)) return 0;
  const wall = Math.max(0, asOfMs - start);
  const completed = sumPauseIntervalsDurationMs(active.pauseIntervals);
  let currentPause = 0;
  if (active.pauseStartedAt) {
    const p = new Date(active.pauseStartedAt).getTime();
    if (!Number.isNaN(p) && asOfMs > p) currentPause = asOfMs - p;
  }
  return Math.max(0, wall - completed - currentPause);
}

/** @deprecated Prefer `formatPlayingDuration(active, asOfMs)` — kept for narrow call sites that only have start time. */
export function formatSessionDuration(startTimeIso: string, asOfMs: number = Date.now()): string {
  const start = new Date(startTimeIso).getTime();
  const elapsed = Math.max(0, Math.floor((asOfMs - start) / 1000));
  return formatSecondsAsHms(elapsed);
}

export function formatPlayingDuration(active: ActiveSession, asOfMs: number = Date.now()): string {
  const ms = getPlayingElapsedMs(active, asOfMs);
  const elapsed = Math.floor(ms / 1000);
  return formatSecondsAsHms(elapsed);
}

function formatSecondsAsHms(elapsed: number): string {
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${h}h ${m}m ${s}s`;
}

/** Start a break. Returns null if already paused. */
export function pauseActiveSession(active: ActiveSession): ActiveSession | null {
  if (active.pauseStartedAt) return null;
  return normalizeActiveSession({
    ...active,
    pauseStartedAt: new Date().toISOString(),
  });
}

/** End a break. Returns null if not paused. */
export function resumeActiveSession(active: ActiveSession): ActiveSession | null {
  if (!active.pauseStartedAt) return null;
  const end = new Date().toISOString();
  const ps = new Date(active.pauseStartedAt).getTime();
  const pe = new Date(end).getTime();
  const nextIntervals = [...active.pauseIntervals];
  if (!Number.isNaN(ps) && !Number.isNaN(pe) && pe > ps) {
    nextIntervals.push({ start: active.pauseStartedAt, end: end });
  }
  return normalizeActiveSession({
    ...active,
    pauseIntervals: nextIntervals,
    pauseStartedAt: null,
  });
}
