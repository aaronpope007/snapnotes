import axios from 'axios';
import type { HandToReview, HandToReviewCreate, HandToReviewStatus } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchHandsToReview(
  status?: HandToReviewStatus,
  createdBy?: string | null
): Promise<HandToReview[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (createdBy?.trim()) params.createdBy = createdBy.trim();
  const { data } = await api.get<HandToReview[]>('/hands-to-review', { params });
  return data;
}

export async function fetchHandToReview(id: string): Promise<HandToReview> {
  const { data } = await api.get<HandToReview>(`/hands-to-review/${id}`);
  return data;
}

export async function createHandToReview(
  hand: HandToReviewCreate
): Promise<HandToReview> {
  const { data } = await api.post<HandToReview>('/hands-to-review', hand);
  return data;
}

export async function updateHandToReview(
  id: string,
  updates: {
    title?: string;
    handText?: string;
    spoilerText?: string;
    status?: HandToReviewStatus;
    isPrivate?: boolean;
    taggedReviewerNames?: string[];
  }
): Promise<HandToReview> {
  const { data } = await api.put<HandToReview>(`/hands-to-review/${id}`, updates);
  return data;
}

export async function markHandReviewed(id: string, userName: string): Promise<HandToReview> {
  const { data } = await api.put<HandToReview>(`/hands-to-review/${id}`, {
    markReviewed: { userName },
  });
  return data;
}

export async function rateHand(
  id: string,
  ratings: {
    starRating?: number;
    spicyRating?: number;
    userName: string;
  }
): Promise<HandToReview> {
  const { data } = await api.put<HandToReview>(`/hands-to-review/${id}`, {
    rateHand: ratings,
  });
  return data;
}

export async function addHandComment(
  id: string,
  comment: { text: string; addedBy: string }
): Promise<HandToReview> {
  const { data } = await api.put<HandToReview>(`/hands-to-review/${id}`, {
    addComment: comment,
  });
  return data;
}

export async function updateHandComment(
  id: string,
  commentIndex: number,
  updates: { text?: string; editedBy?: string; authorOnly?: boolean }
): Promise<HandToReview> {
  const { data } = await api.put<HandToReview>(`/hands-to-review/${id}`, {
    updateComment: { commentIndex, ...updates },
  });
  return data;
}

export async function deleteHandComment(
  id: string,
  commentIndex: number
): Promise<HandToReview> {
  const { data } = await api.put<HandToReview>(`/hands-to-review/${id}`, {
    deleteCommentIndex: commentIndex,
  });
  return data;
}

export async function deleteHandToReview(id: string): Promise<void> {
  await api.delete(`/hands-to-review/${id}`);
}
