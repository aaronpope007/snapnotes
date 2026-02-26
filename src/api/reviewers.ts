import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchReviewers(): Promise<string[]> {
  const { data } = await api.get<string[]>('/reviewers');
  return data;
}

export async function registerReviewer(name: string): Promise<void> {
  await api.post('/reviewers', { name: name.trim() });
}
