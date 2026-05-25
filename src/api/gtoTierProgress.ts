import axios from 'axios';
import type { GtoFormat } from '../types/gtoStudy';
import type { GtoTierProgressRow } from '../types/gtoTierProgress';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchGtoTierProgress(
  userId: string | null,
  format: GtoFormat = 'HU'
): Promise<GtoTierProgressRow[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<GtoTierProgressRow[]>('/gto/tier-progress', {
    params: { userId: userId.trim(), format },
  });
  return data;
}
