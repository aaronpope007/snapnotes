import { useState, useEffect, useCallback } from 'react';
import {
  fetchMentalGameEntries,
  createMentalGameEntry,
  deleteMentalGameEntry,
} from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';
import { useAbortSignalRef, useMountedRef, isAbortError } from './useMountedRef';
import type { MentalGameEntry, MentalGameEntryCreate } from '../types/learning';

export interface UseMentalGameOptions {
  userId: string | null;
  enabled?: boolean;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useMentalGame({ userId, enabled = true, onSuccess, onError }: UseMentalGameOptions) {
  const mounted = useMountedRef();
  const nextSignal = useAbortSignalRef();
  const [entries, setEntries] = useState<MentalGameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!enabled || !userId?.trim()) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const signal = nextSignal();
    setLoading(true);
    try {
      const data = await fetchMentalGameEntries(userId, { signal });
      if (!mounted.current || signal.aborted) return;
      setEntries(data ?? []);
    } catch (err) {
      if (isAbortError(err) || !mounted.current) return;
      setEntries([]);
      onError?.(getApiErrorMessage(err, 'Failed to load mental game entries'));
    } finally {
      if (mounted.current && !signal.aborted) setLoading(false);
    }
  }, [enabled, userId, onError, mounted, nextSignal]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleCreate = useCallback(
    async (payload: MentalGameEntryCreate) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const created = await createMentalGameEntry({ ...payload, userId });
        setEntries((prev) => [created, ...prev]);
        setAddModalOpen(false);
        onSuccess?.('Entry added');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to add entry'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, onSuccess, onError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMentalGameEntry(id);
        setEntries((prev) => prev.filter((e) => e._id !== id));
        onSuccess?.('Entry deleted');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to delete entry'));
      }
    },
    [onSuccess, onError]
  );

  return {
    entries,
    loading,
    addModalOpen,
    setAddModalOpen,
    saving,
    loadEntries,
    handleCreate,
    handleDelete,
  };
}
