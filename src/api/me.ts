import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/** Build Basic auth header from name and password */
export function basicAuthHeader(name: string, password: string): string {
  const encoded = btoa(`${name.trim()}:${password}`);
  return `Basic ${encoded}`;
}

export async function claimName(name: string, password: string): Promise<{ name: string }> {
  const { data } = await api.post<{ name: string }>('/me/claim', { name: name.trim(), password });
  return data;
}

export async function login(name: string, password: string): Promise<{ name: string }> {
  const { data } = await api.post<{ name: string }>('/me/login', { name: name.trim(), password });
  return data;
}

export async function isNameClaimed(name: string): Promise<boolean> {
  const { data } = await api.get<{ claimed: boolean }>('/me/claimed', {
    params: { name: name.trim() },
  });
  return data.claimed;
}

export async function getImprovementNotes(name: string, password: string): Promise<string> {
  const { data } = await api.get<{ content: string }>('/me/improvement-notes', {
    headers: { Authorization: basicAuthHeader(name, password) },
  });
  return data.content ?? '';
}

export async function saveImprovementNotes(
  name: string,
  password: string,
  content: string
): Promise<string> {
  const { data } = await api.put<{ content: string }>(
    '/me/improvement-notes',
    { content },
    { headers: { Authorization: basicAuthHeader(name, password) } }
  );
  return data.content ?? '';
}
