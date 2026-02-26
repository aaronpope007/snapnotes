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

export async function createPlayer(player: PlayerCreate): Promise<Player> {
  const { data } = await api.post<Player>('/players', player);
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
  }
): Promise<Player> {
  const { data } = await api.put<Player>(`/players/${id}`, updates);
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  await api.delete(`/players/${id}`);
}

export async function importPlayers(
  players: ImportPlayer[]
): Promise<{ created: number; updated: number }> {
  const { data } = await api.post<{ created: number; updated: number }>('/players/import', {
    players,
  });
  return data;
}

export async function mergePlayers(
  sourceId: string,
  targetId: string
): Promise<Player> {
  const { data } = await api.post<Player>('/players/merge', { sourceId, targetId });
  return data;
}
