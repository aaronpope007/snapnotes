import type { HandToReview } from '../types';

/** Count open hands tagged for this user that they have not yet reviewed. */
export function countHandsForMe(hands: HandToReview[], userName: string | null | undefined): number {
  if (!userName?.trim()) return 0;
  const name = userName.trim();
  return hands.filter(
    (h) =>
      (h.taggedReviewerNames ?? []).includes(name) &&
      !(h.reviewedBy ?? []).includes(name) &&
      h.status !== 'archived'
  ).length;
}

export function handsForMeToastMessage(forMeCount: number): { message: string; severity: 'success' | 'error' } {
  const message =
    forMeCount === 0
      ? 'Hey, nice job, no hands to review'
      : forMeCount >= 5
        ? `Hey slacker, there are ${forMeCount} hands to review, get to it.`
        : `Hey pal, there are ${forMeCount} hand${forMeCount !== 1 ? 's' : ''} to review.`;
  return { message, severity: forMeCount === 0 ? 'success' : 'error' };
}
