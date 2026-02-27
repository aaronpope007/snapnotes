import axios from 'axios';
import type { Player, PlayerListItem, PlayerCreate, ImportPlayer, NoteEntry, HandHistoryEntry } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchPlayers(): Promise<PlayerListItem[]> {
  const { data } = await api.get<PlayerListItem[]>('/players');
  return data;
}

export async function fetchPlayer(id: string): Promise<Player> {
  const { data } = await api.get<Player>(`/players/${id}`);
  return data;
}

function authHeaders(authHeader: string | null | undefined): { Authorization?: string } {
  return authHeader ? { Authorization: authHeader } : {};
}

export async function createPlayer(
  player: PlayerCreate,
  authHeader?: string | null
): Promise<Player> {
  const { data } = await api.post<Player>('/players', player, {
    headers: authHeaders(authHeader),
  });
  return data;
}

export async function updatePlayer(
  id: string,
  updates: Partial<PlayerCreate> & {
    notes?: NoteEntry[];
    exploits?: string[];
    handHistories?: HandHistoryEntry[];
    gameTypes?: string[];
    stakesSeenAt?: number[];
    formats?: string[];
    origin?: string;
    exploitHandExamples?: string[];
  },
  authHeader?: string | null
): Promise<Player> {
  const { data } = await api.put<Player>(`/players/${id}`, updates, {
    headers: authHeaders(authHeader),
  });
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  await api.delete(`/players/${id}`);
}

export async function importPlayers(
  players: ImportPlayer[],
  authHeader?: string | null
): Promise<{ created: number; updated: number }> {
  const { data } = await api.post<{ created: number; updated: number }>(
    '/players/import',
    { players },
    { headers: authHeaders(authHeader) }
  );
  return data;
}

export async function mergePlayers(
  sourceId: string,
  targetId: string
): Promise<Player> {
  const { data } = await api.post<Player>('/players/merge', { sourceId, targetId });
  return data;
}
