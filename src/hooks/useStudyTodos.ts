import { useState, useEffect, useCallback } from 'react';
import {
  fetchStudyTodos,
  createStudyTodo,
  updateStudyTodo,
  deleteStudyTodo,
} from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';
import type { StudyTodo } from '../types/learning';

export interface UseStudyTodosOptions {
  userId: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useStudyTodos({ userId, onSuccess, onError }: UseStudyTodosOptions) {
  const [todos, setTodos] = useState<StudyTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTodos = useCallback(async () => {
    if (!userId?.trim()) {
      setTodos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchStudyTodos(userId);
      setTodos(data ?? []);
    } catch (err) {
      setTodos([]);
      onError?.(getApiErrorMessage(err, 'Failed to load study todos'));
    } finally {
      setLoading(false);
    }
  }, [userId, onError]);

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
