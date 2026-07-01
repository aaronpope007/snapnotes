import axios from 'axios';
import { dedupeRequest } from '../utils/dedupeRequest';
import { DEFAULT_FETCH_LIMIT, type FetchOptions } from './fetchOptions';
import type {
  GtoDrill,
  GtoDrillCreate,
  GtoDrillResult,
  GtoDrillResultCreate,
  GtoDrillResultUpdate,
  GtoDrillUpdate,
  GtoFormat,
  GtoRecentDrillResult,
} from '../types/gtoStudy';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchGtoDrills(
  userId: string | null,
  format?: GtoFormat
): Promise<GtoDrill[]> {
  const trimmed = userId?.trim();
  if (!trimmed) return [];
  const formatKey = format ?? 'all';
  return dedupeRequest(`gto-drills:${trimmed}:${formatKey}`, async () => {
    const { data } = await api.get<GtoDrill[]>('/gto-drills', {
      params: {
        userId: trimmed,
        recentResults: true,
        ...(format ? { format } : {}),
      },
    });
    return data;
  });
}

export async function fetchArchivedGtoDrills(
  userId: string | null,
  format?: GtoFormat
): Promise<GtoDrill[]> {
  const trimmed = userId?.trim();
  if (!trimmed) return [];
  const formatKey = format ?? 'all';
  return dedupeRequest(`gto-drills-archived:${trimmed}:${formatKey}`, async () => {
    const { data } = await api.get<GtoDrill[]>('/gto-drills/archived', {
      params: {
        userId: trimmed,
        recentResults: true,
        ...(format ? { format } : {}),
      },
    });
    return data;
  });
}


export async function createGtoDrill(
  payload: GtoDrillCreate & { userId: string | null }
): Promise<GtoDrill> {
  const body = { ...payload, userId: payload.userId ?? undefined };
  const { data } = await api.post<GtoDrill>('/gto-drills', body);
  return data;
}

export async function updateGtoDrill(id: string, updates: GtoDrillUpdate): Promise<GtoDrill> {
  const { data } = await api.patch<GtoDrill>(`/gto-drills/${id}`, updates);
  return data;
}

export async function deleteGtoDrill(id: string): Promise<void> {
  await api.delete(`/gto-drills/${id}`);
}

export async function fetchRecentGtoDrillResults(
  userId: string | null,
  format?: GtoFormat,
  limit = 40
): Promise<GtoRecentDrillResult[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<GtoRecentDrillResult[]>('/gto-drills/results/recent', {
    params: {
      userId: userId.trim(),
      limit,
      ...(format ? { format } : {}),
    },
  });
  return data;
}

export async function fetchGtoDrillResults(
  drillId: string,
  userId: string | null,
  options?: FetchOptions
): Promise<GtoDrillResult[]> {
  if (!userId?.trim()) return [];
  const params: Record<string, string | number> = {
    userId: userId.trim(),
    limit: options?.limit ?? DEFAULT_FETCH_LIMIT,
  };
  if (options?.skip != null) params.skip = options.skip;
  const { data } = await api.get<GtoDrillResult[]>(`/gto-drills/${drillId}/results`, {
    params,
    signal: options?.signal,
  });
  return data;
}

export async function createGtoDrillResult(
  drillId: string,
  payload: GtoDrillResultCreate & { userId: string | null }
): Promise<GtoDrillResult> {
  const body = { ...payload, userId: payload.userId ?? undefined };
  const { data } = await api.post<GtoDrillResult>(`/gto-drills/${drillId}/results`, body);
  return data;
}

export async function updateGtoDrillResult(
  drillId: string,
  resultId: string,
  updates: GtoDrillResultUpdate,
  userId: string | null
): Promise<GtoDrillResult> {
  const { data } = await api.patch<GtoDrillResult>(
    `/gto-drills/${drillId}/results/${resultId}`,
    updates,
    { params: userId?.trim() ? { userId: userId.trim() } : undefined }
  );
  return data;
}

export async function deleteGtoDrillResult(
  drillId: string,
  resultId: string,
  userId: string | null
): Promise<void> {
  await api.delete(`/gto-drills/${drillId}/results/${resultId}`, {
    params: userId?.trim() ? { userId: userId.trim() } : undefined,
  });
}
