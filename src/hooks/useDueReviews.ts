import { useState, useEffect, useCallback } from 'react';
import { fetchDueLeaks, advanceLeakReview } from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';
import type { Leak } from '../types/learning';

export interface UseDueReviewsOptions {
  userId: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useDueReviews({ userId, onSuccess, onError }: UseDueReviewsOptions) {
  const [dueLeaks, setDueLeaks] = useState<Leak[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadDue = useCallback(async () => {
    if (!userId?.trim()) {
      setDueLeaks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchDueLeaks(userId);
      setDueLeaks(data ?? []);
    } catch (err) {
      setDueLeaks([]);
      onError?.(getApiErrorMessage(err, 'Failed to load due reviews'));
    } finally {
      setLoading(false);
    }
  }, [userId, onError]);

  useEffect(() => {
    void loadDue();
  }, [loadDue]);

  const handleStillFixed = useCallback(
    async (leakId: string) => {
      setReviewingId(leakId);
      try {
        await advanceLeakReview(leakId, true);
        setDueLeaks((prev) => prev.filter((l) => l._id !== leakId));
        onSuccess?.('Review recorded');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to record review'));
      } finally {
        setReviewingId(null);
      }
    },
    [onSuccess, onError]
  );

  const handleRegressed = useCallback(
    async (leakId: string) => {
      setReviewingId(leakId);
      try {
        await advanceLeakReview(leakId, false);
        setDueLeaks((prev) => prev.filter((l) => l._id !== leakId));
        onSuccess?.('Leak moved back to Working On');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update leak'));
      } finally {
        setReviewingId(null);
      }
    },
    [onSuccess, onError]
  );

  return {
    dueLeaks,
    loading,
    reviewingId,
    loadDue,
    handleStillFixed,
    handleRegressed,
  };
}
