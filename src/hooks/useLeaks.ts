import { useState, useEffect, useCallback } from 'react';
import {
  fetchLeaks,
  createLeak,
  updateLeak,
  deleteLeak,
} from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';
import type { Leak, LeakCreate, LeakStatus } from '../types/learning';

export interface UseLeaksOptions {
  userId: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useLeaks({ userId, onSuccess, onError }: UseLeaksOptions) {
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LeakStatus | 'all'>('all');
  const [filterPlayerId, setFilterPlayerId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addToPlayerModalOpen, setAddToPlayerModalOpen] = useState(false);
  const [editLeak, setEditLeak] = useState<Leak | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLeaks = useCallback(async () => {
    if (!userId?.trim()) {
      setLeaks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await fetchLeaks(userId, status, filterPlayerId);
      setLeaks(data ?? []);
    } catch (err) {
      setLeaks([]);
      onError?.(getApiErrorMessage(err, 'Failed to load leaks'));
    } finally {
      setLoading(false);
    }
  }, [userId, filterStatus, filterPlayerId, onError]);

  useEffect(() => {
    void loadLeaks();
  }, [loadLeaks]);

  const handleCreate = useCallback(
    async (payload: LeakCreate & { linkedHandIds?: string[] }) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const created = await createLeak({
          ...payload,
          userId,
          linkedHandIds: payload.linkedHandIds ?? [],
        });
        setLeaks((prev) => [created, ...prev]);
        setAddModalOpen(false);
        onSuccess?.('Leak added');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to add leak'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, onSuccess, onError]
  );

  const handleUpdate = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Leak, 'title' | 'description' | 'category' | 'status' | 'linkedHandIds' | 'notes'>>
    ) => {
      setSaving(true);
      try {
        const updated = await updateLeak(id, updates);
        setLeaks((prev) =>
          prev.map((l) => (l._id === id ? updated : l))
        );
        setEditLeak(null);
        onSuccess?.('Leak updated');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update leak'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [onSuccess, onError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteLeak(id);
        setLeaks((prev) => prev.filter((l) => l._id !== id));
        setEditLeak(null);
        onSuccess?.('Leak deleted');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to delete leak'));
      }
    },
    [onSuccess, onError]
  );

  const handleStatusCycle = useCallback(
    async (leak: Leak) => {
      const next: LeakStatus =
        leak.status === 'identified'
          ? 'working'
          : leak.status === 'working'
            ? 'resolved'
            : 'identified';
      await handleUpdate(leak._id, { status: next });
    },
    [handleUpdate]
  );

  const handleResolve = useCallback(
    async (leak: Leak) => {
      if (leak.status === 'resolved') return;
      await handleUpdate(leak._id, { status: 'resolved' });
      onSuccess?.('Leak resolved');
    },
    [handleUpdate, onSuccess]
  );

  return {
    leaks,
    loading,
    filterStatus,
    setFilterStatus,
    filterPlayerId,
    setFilterPlayerId,
    expandedId,
    setExpandedId,
    addModalOpen,
    setAddModalOpen,
    addToPlayerModalOpen,
    setAddToPlayerModalOpen,
    editLeak,
    setEditLeak,
    saving,
    loadLeaks,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleStatusCycle,
    handleResolve,
  };
}
