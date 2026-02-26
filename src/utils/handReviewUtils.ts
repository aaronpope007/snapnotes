import type { HandRatingEntry } from '../types';

export function avgRating(ratings: HandRatingEntry[] | undefined): number | null {
  if (!ratings?.length) return null;
  const sum = ratings.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function userRating(
  ratings: HandRatingEntry[] | undefined,
  userName: string
): number | null {
  const entry = ratings?.find((r) => r.user === userName);
  return entry != null ? entry.rating : null;
}

/** Normalize stored rating to 1–5 (handles legacy 0–10 scale). */
export function normalizeStarRating(rating: number | null): number | null {
  if (rating == null) return null;
  if (rating >= 1 && rating <= 5) return Math.round(rating);
  return Math.min(5, Math.max(1, Math.round(rating / 2)));
}

export function getStarRatingLabel(rating: number | null): string {
  const n = rating == null ? null : normalizeStarRating(rating);
  if (n == null) return 'Well Played';
  if (n === 1) return 'Poor';
  if (n === 2) return 'Meh';
  if (n === 3) return 'Average';
  if (n === 4) return 'Good';
  return 'Great';
}

export function getSpicyRatingLabel(level: number | null): string {
  if (level == null || level < 1) return 'Spicy';
  if (level === 1) return 'Mild';
  if (level === 2) return 'Simmer';
  if (level === 3) return 'Spicy';
  if (level === 4) return 'Hot';
  return 'Blazing';
}

export function commentKey(handId: string, commentIndex: number): string {
  return `${handId}-${commentIndex}`;
}
