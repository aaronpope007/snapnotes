import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface BackupPayload {
  exportedAt: string;
  players: Record<string, unknown>[];
  handsToReview: Record<string, unknown>[];
}

export async function exportBackup(): Promise<BackupPayload> {
  const { data } = await api.get<BackupPayload>('/backup/export');
  return data;
}

export async function restoreBackup(payload: BackupPayload): Promise<{
  playersRestored: number;
  handsToReviewRestored: number;
}> {
  const { data } = await api.post<{
    playersRestored: number;
    handsToReviewRestored: number;
  }>('/backup/restore', {
    players: payload.players ?? [],
    handsToReview: payload.handsToReview ?? [],
  });
  return data;
}
