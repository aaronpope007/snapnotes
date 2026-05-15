import axios from 'axios';
import type {
  GtoStudySession,
  GtoStudySessionCreate,
  GtoStudySessionUpdate,
} from '../types/gtoStudy';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchGtoStudySessions(userId: string | null): Promise<GtoStudySession[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<GtoStudySession[]>('/gto-study', {
    params: { userId: userId.trim() },
  });
  return data;
}

export async function createGtoStudySession(
  payload: GtoStudySessionCreate & { userId: string | null }
): Promise<GtoStudySession> {
  const body = { ...payload, userId: payload.userId ?? undefined };
  const { data } = await api.post<GtoStudySession>('/gto-study', body);
  return data;
}

export async function updateGtoStudySession(
  id: string,
  updates: GtoStudySessionUpdate
): Promise<GtoStudySession> {
  const { data } = await api.patch<GtoStudySession>(`/gto-study/${id}`, updates);
  return data;
}

export async function deleteGtoStudySession(id: string): Promise<void> {
  await api.delete(`/gto-study/${id}`);
}
