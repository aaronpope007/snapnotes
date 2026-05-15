import type { GtoStudySession } from '../types/gtoStudy';

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

export function formatSessionTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface GtoStudyDateGroup {
  dateKey: string;
  header: string;
  sessions: GtoStudySession[];
}

export function groupSessionsByDate(sessions: GtoStudySession[]): GtoStudyDateGroup[] {
  const map = new Map<string, GtoStudySession[]>();
  for (const session of sessions) {
    const key = getDateKey(session.sessionDate);
    const list = map.get(key) ?? [];
    list.push(session);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, groupSessions]) => ({
      dateKey,
      header: formatDateHeader(groupSessions[0].sessionDate),
      sessions: groupSessions.sort(
        (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      ),
    }));
}
