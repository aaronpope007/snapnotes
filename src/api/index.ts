import axios from 'axios';
import type { Player, PlayerCreate, ImportPlayer } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchPlayers(): Promise<Player[]> {
  const { data } = await api.get<Player[]>('/players');
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

export async function updatePlayer(id: string, updates: Partial<PlayerCreate> & { notes?: string }): Promise<Player> {
  const { data } = await api.put<Player>(`/players/${id}`, updates);
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  await api.delete(`/players/${id}`);
}

export async function importPlayers(players: ImportPlayer[]): Promise<{ created: number; updated: number }> {
  const { data } = await api.post<{ created: number; updated: number }>('/players/import', { players });
  return data;
}
