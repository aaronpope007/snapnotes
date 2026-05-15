import { useState, useEffect, useCallback } from 'react';
import {
  fetchGtoStudySessions,
  createGtoStudySession,
  updateGtoStudySession,
  deleteGtoStudySession,
} from '../api/gtoStudy';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  GtoStudySession,
  GtoStudySessionCreate,
  GtoStudySessionUpdate,
} from '../types/gtoStudy';

export interface UseGtoStudyOptions {
  userId: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useGtoStudy({ userId, onSuccess, onError }: UseGtoStudyOptions) {
  const [sessions, setSessions] = useState<GtoStudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editSession, setEditSession] = useState<GtoStudySession | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!userId?.trim()) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchGtoStudySessions(userId);
      setSessions(data ?? []);
    } catch (err) {
      setSessions([]);
      onError?.(getApiErrorMessage(err, 'Failed to load GTO study sessions'));
    } finally {
      setLoading(false);
    }
  }, [userId, onError]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleCreate = useCallback(
    async (payload: GtoStudySessionCreate) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const created = await createGtoStudySession({ ...payload, userId });
        setSessions((prev) =>
          [created, ...prev].sort(
            (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
          )
        );
        setAddModalOpen(false);
        onSuccess?.('Drill session logged');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to log session'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, onSuccess, onError]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: GtoStudySessionUpdate) => {
      setSaving(true);
      try {
        const updated = await updateGtoStudySession(id, updates);
        setSessions((prev) =>
          prev
            .map((s) => (s._id === id ? updated : s))
            .sort(
              (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
            )
        );
        setEditSession(null);
        onSuccess?.('Session updated');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update session'));
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
        await deleteGtoStudySession(id);
        setSessions((prev) => prev.filter((s) => s._id !== id));
        onSuccess?.('Session deleted');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to delete session'));
      }
    },
    [onSuccess, onError]
  );

  return {
    sessions,
    loading,
    addModalOpen,
    setAddModalOpen,
    editSession,
    setEditSession,
    saving,
    loadSessions,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
