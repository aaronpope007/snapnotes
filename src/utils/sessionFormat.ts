import type { SessionFormatFilter, SessionResult } from '../types/results';

export type SessionFormatBucket = 'huOnly' | 'ringOnly' | 'both' | 'unspecified';

export function getSessionFormatBucket(s: SessionResult): SessionFormatBucket {
  const hu = s.isHU === true;
  const ring = s.isRing === true;
  if (hu && ring) return 'both';
  if (hu && !ring) return 'huOnly';
  if (ring && !hu) return 'ringOnly';
  return 'unspecified';
}

export function filterSessionsByFormat(sessions: SessionResult[], filter: SessionFormatFilter): SessionResult[] {
  if (filter === 'all') return sessions;
  return sessions.filter((s) => getSessionFormatBucket(s) === filter);
}

