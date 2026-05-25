import axios from 'axios';
import type {
  GtoDrill,
  GtoDrillCreate,
  GtoDrillResult,
  GtoDrillResultCreate,
  GtoDrillResultUpdate,
  GtoDrillUpdate,
} from '../types/gtoStudy';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchGtoDrills(userId: string | null): Promise<GtoDrill[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<GtoDrill[]>('/gto-drills', {
    params: { userId: userId.trim(), recentResults: true },
  });
  return data;
}

export async function fetchArchivedGtoDrills(userId: string | null): Promise<GtoDrill[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<GtoDrill[]>('/gto-drills/archived', {
    params: { userId: userId.trim(), recentResults: true },
  });
  return data;
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

export async function fetchGtoDrillResults(
  drillId: string,
  userId: string | null
): Promise<GtoDrillResult[]> {
  if (!userId?.trim()) return [];
  const { data } = await api.get<GtoDrillResult[]>(`/gto-drills/${drillId}/results`, {
    params: { userId: userId.trim() },
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
