import axios from 'axios';
import type {
  Leak,
  LeakCreate,
  LeakStatus,
  MentalGameEntry,
  MentalGameEntryCreate,
  StudyTodo,
} from '../types/learning';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Leaks
export async function fetchLeaks(
  userId: string | null,
  status?: LeakStatus,
  playerId?: string | null
): Promise<Leak[]> {
  const params: Record<string, string> = {};
  if (userId?.trim()) params.userId = userId.trim();
  if (status) params.status = status;
  if (playerId?.trim()) params.playerId = playerId.trim();
  const { data } = await api.get<Leak[]>('/learning/leaks', { params });
  return data;
}

export async function createLeak(
  payload: LeakCreate & { userId: string | null; playerId?: string; playerUsername?: string }
): Promise<Leak> {
  const body = {
    ...payload,
    userId: payload.userId ?? undefined,
    playerId: payload.playerId ?? undefined,
    playerUsername: payload.playerUsername ?? undefined,
  };
  const { data } = await api.post<Leak>('/learning/leaks', body);
  return data;
}

export async function updateLeak(
  id: string,
  updates: Partial<Pick<Leak, 'title' | 'description' | 'category' | 'status' | 'linkedHandIds' | 'notes'>>
): Promise<Leak> {
  const { data } = await api.patch<Leak>(`/learning/leaks/${id}`, updates);
  return data;
}

export async function deleteLeak(id: string): Promise<void> {
  await api.delete(`/learning/leaks/${id}`);
}

export async function advanceLeakReview(id: string, stillFixed: boolean): Promise<Leak> {
  const { data } = await api.patch<Leak>(`/learning/leaks/${id}/review`, { stillFixed });
  return data;
}

// Mental Game
export async function fetchMentalGameEntries(userId: string | null): Promise<MentalGameEntry[]> {
  const params: Record<string, string> = {};
  if (userId?.trim()) params.userId = userId.trim();
  const { data } = await api.get<MentalGameEntry[]>('/learning/mental', { params });
  return data;
}

export async function createMentalGameEntry(
  payload: MentalGameEntryCreate & { userId: string | null }
): Promise<MentalGameEntry> {
  const body = { ...payload, userId: payload.userId ?? undefined };
  const { data } = await api.post<MentalGameEntry>('/learning/mental', body);
  return data;
}

export async function deleteMentalGameEntry(id: string): Promise<void> {
  await api.delete(`/learning/mental/${id}`);
}

// Due for review
export async function fetchDueLeaks(userId: string | null): Promise<Leak[]> {
  const params: Record<string, string> = {};
  if (userId?.trim()) params.userId = userId.trim();
  const { data } = await api.get<Leak[]>('/learning/due', { params });
  return data;
}

// Study to-do list
export async function fetchStudyTodos(userId: string | null): Promise<StudyTodo[]> {
  const params: Record<string, string> = {};
  if (userId?.trim()) params.userId = userId.trim();
  const { data } = await api.get<StudyTodo[]>('/learning/study-todos', { params });
  return data;
}

export async function createStudyTodo(
  userId: string | null,
  text: string
): Promise<StudyTodo> {
  const { data } = await api.post<StudyTodo>('/learning/study-todos', {
    userId: userId ?? undefined,
    text: text.trim(),
  });
  return data;
}

export async function updateStudyTodo(
  id: string,
  updates: Partial<Pick<StudyTodo, 'text' | 'done'>>
): Promise<StudyTodo> {
  const { data } = await api.patch<StudyTodo>(`/learning/study-todos/${id}`, updates);
  return data;
}

export async function deleteStudyTodo(id: string): Promise<void> {
  await api.delete(`/learning/study-todos/${id}`);
}
