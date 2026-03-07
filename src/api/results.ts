import axios from 'axios';
import type { SessionResult, SessionResultCreate, SessionUploadRow, Withdrawal, WithdrawalCreate } from '../types/results';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchSessionResults(userId: string | null): Promise<SessionResult[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<SessionResult[]>('/results', {
    params: { userId: userId.trim() },
  });
  return data;
}

export async function createSessionResult(
  userId: string | null,
  payload: SessionResultCreate
): Promise<SessionResult> {
  const body = { ...payload, userId: userId ?? undefined };
  const { data } = await api.post<SessionResult>('/results', body);
  return data;
}

export async function uploadSessionResults(
  userId: string | null,
  sessions: SessionUploadRow[]
): Promise<{ count: number; sessions: SessionResult[] }> {
  const body = { userId: userId ?? undefined, sessions };
  const { data } = await api.post<{ count: number; sessions: SessionResult[] }>(
    '/results/upload',
    body
  );
  return data;
}

export async function updateSessionResult(
  id: string,
  updates: Partial<SessionResultCreate>
): Promise<SessionResult> {
  const { data } = await api.patch<SessionResult>(`/results/${id}`, updates);
  return data;
}

export async function deleteSessionResult(id: string): Promise<void> {
  await api.delete(`/results/${id}`);
}

export async function deleteAllSessionResults(userId: string | null): Promise<{ deletedCount: number }> {
  if (!userId?.trim()) return { deletedCount: 0 };
  const { data } = await api.delete<{ deletedCount: number }>('/results/all', {
    params: { userId: userId.trim() },
  });
  return data;
}

export async function fetchWithdrawals(userId: string | null): Promise<Withdrawal[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<Withdrawal[]>('/withdrawals', {
    params: { userId: userId.trim() },
  });
  return data;
}

export async function createWithdrawal(
  userId: string | null,
  payload: WithdrawalCreate
): Promise<Withdrawal> {
  const body = { ...payload, userId: userId ?? undefined };
  const { data } = await api.post<Withdrawal>('/withdrawals', body);
  return data;
}

export async function updateWithdrawal(
  id: string,
  updates: Partial<WithdrawalCreate>
): Promise<Withdrawal> {
  const { data } = await api.patch<Withdrawal>(`/withdrawals/${id}`, updates);
  return data;
}

export async function deleteWithdrawal(id: string): Promise<void> {
  await api.delete(`/withdrawals/${id}`);
}
