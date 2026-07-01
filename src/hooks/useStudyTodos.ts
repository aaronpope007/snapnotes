import { useState, useEffect, useCallback } from 'react';
import {
  fetchStudyTodos,
  createStudyTodo,
  updateStudyTodo,
  deleteStudyTodo,
} from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';
import { useAbortSignalRef, useMountedRef, isAbortError } from './useMountedRef';
import type { StudyTodo } from '../types/learning';

export interface UseStudyTodosOptions {
  userId: string | null;
  enabled?: boolean;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useStudyTodos({ userId, enabled = true, onSuccess, onError }: UseStudyTodosOptions) {
  const mounted = useMountedRef();
  const nextSignal = useAbortSignalRef();
  const [todos, setTodos] = useState<StudyTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTodos = useCallback(async () => {
    if (!enabled || !userId?.trim()) {
      setTodos([]);
      setLoading(false);
      return;
    }
    const signal = nextSignal();
    setLoading(true);
    try {
      const data = await fetchStudyTodos(userId, { signal });
      if (!mounted.current || signal.aborted) return;
      setTodos(data ?? []);
    } catch (err) {
      if (isAbortError(err) || !mounted.current) return;
      setTodos([]);
      onError?.(getApiErrorMessage(err, 'Failed to load study todos'));
    } finally {
      if (mounted.current && !signal.aborted) setLoading(false);
    }
  }, [enabled, userId, onError, mounted, nextSignal]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const handleAdd = useCallback(
    async (text: string) => {
      if (!userId?.trim() || !text.trim()) return;
      try {
        const created = await createStudyTodo(userId, text);
        setTodos((prev) => [created, ...prev]);
        onSuccess?.('Study task added');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to add study task'));
        throw err;
      }
    },
    [userId, onSuccess, onError]
  );

  const handleToggle = useCallback(
    async (id: string, done: boolean) => {
      try {
        const updated = await updateStudyTodo(id, { done });
        setTodos((prev) =>
          prev.map((t) => (t._id === id ? updated : t))
        );
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update task'));
      }
    },
    [onError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteStudyTodo(id);
        setTodos((prev) => prev.filter((t) => t._id !== id));
        onSuccess?.('Task removed');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to remove task'));
      }
    },
    [onSuccess, onError]
  );

  return {
    todos,
    loading,
    loadTodos,
    handleAdd,
    handleToggle,
    handleDelete,
  };
}
