import { useState, useEffect, useCallback } from 'react';
import {
  fetchEdges,
  createEdge,
  updateEdge,
  deleteEdge,
} from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';
import type { Edge, EdgeCreate, EdgeStatus } from '../types/learning';

export interface UseEdgesOptions {
  userId: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useEdges({ userId, onSuccess, onError }: UseEdgesOptions) {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<EdgeStatus | 'all'>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editEdge, setEditEdge] = useState<Edge | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEdges = useCallback(async () => {
    if (!userId?.trim()) {
      setEdges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await fetchEdges(userId, status);
      setEdges(data ?? []);
    } catch (err) {
      setEdges([]);
      onError?.(getApiErrorMessage(err, 'Failed to load edges'));
    } finally {
      setLoading(false);
    }
  }, [userId, filterStatus, onError]);

  useEffect(() => {
    void loadEdges();
  }, [loadEdges]);

  const handleCreate = useCallback(
    async (payload: EdgeCreate & { linkedHandIds?: string[] }) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const created = await createEdge({
          ...payload,
          userId,
          linkedHandIds: payload.linkedHandIds ?? [],
        });
        setEdges((prev) => [created, ...prev]);
        setAddModalOpen(false);
        onSuccess?.('Edge added');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to add edge'));
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
      updates: Partial<Pick<Edge, 'title' | 'description' | 'category' | 'status' | 'linkedHandIds' | 'notes'>>
    ) => {
      setSaving(true);
      try {
        const updated = await updateEdge(id, updates);
        setEdges((prev) =>
          prev.map((e) => (e._id === id ? updated : e))
        );
        setEditEdge(null);
        onSuccess?.('Edge updated');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update edge'));
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
        await deleteEdge(id);
        setEdges((prev) => prev.filter((e) => e._id !== id));
        setEditEdge(null);
        onSuccess?.('Edge deleted');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to delete edge'));
      }
    },
    [onSuccess, onError]
  );

  return {
    edges,
    loading,
    filterStatus,
    setFilterStatus,
    addModalOpen,
    setAddModalOpen,
    editEdge,
    setEditEdge,
    saving,
    loadEdges,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
