import axios from 'axios';
import type { BetClipboardCloudPayloadV1, BetClipboardSyncResponse } from '../types/betClipboardCloud';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function createBetClipboardSync(): Promise<BetClipboardSyncResponse> {
  const { data } = await api.post<BetClipboardSyncResponse>('/bet-clipboard-sync');
  return data;
}

export async function fetchBetClipboardSync(syncId: string): Promise<BetClipboardSyncResponse> {
  const { data } = await api.get<BetClipboardSyncResponse>(`/bet-clipboard-sync/${encodeURIComponent(syncId)}`);
  return data;
}

export async function saveBetClipboardSync(
  syncId: string,
  payload: BetClipboardCloudPayloadV1
): Promise<BetClipboardSyncResponse> {
  const { data } = await api.put<BetClipboardSyncResponse>(`/bet-clipboard-sync/${encodeURIComponent(syncId)}`, {
    payload,
  });
  return data;
}
