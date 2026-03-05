const STORAGE_KEY = 'snapnotes_active_session';

export interface ActiveSession {
  startTime: string; // ISO string
  userId: string;
  startHandNumber: number;
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
      return parsed as ActiveSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveSession(session: ActiveSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Format elapsed time from startTime (ISO) to now as "Xh Ym Zs" */
export function formatSessionDuration(startTimeIso: string, asOfMs: number = Date.now()): string {
  const start = new Date(startTimeIso).getTime();
  const elapsed = Math.max(0, Math.floor((asOfMs - start) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${h}h ${m}m ${s}s`;
}
