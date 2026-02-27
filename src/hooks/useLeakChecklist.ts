import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_VISIBLE = 'leakChecklistVisible';
const STORAGE_KEY_COMPLETED = 'leakChecklistCompleted';

function getVisibleKey(userId: string): string {
  return `${STORAGE_KEY_VISIBLE}_${userId.trim()}`;
}

function getCompletedKey(userId: string): string {
  return `${STORAGE_KEY_COMPLETED}_${userId.trim()}`;
}

export function useLeakChecklist(userId: string | null) {
  const [visible, setVisibleState] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId?.trim()) {
      setVisibleState(false);
      setCompleted(new Set());
      return;
    }
    try {
      const storedVisible = localStorage.getItem(getVisibleKey(userId));
      setVisibleState(storedVisible === 'true');

      const storedCompleted = localStorage.getItem(getCompletedKey(userId));
      const parsed = storedCompleted ? (JSON.parse(storedCompleted) as string[]) : [];
      setCompleted(new Set(Array.isArray(parsed) ? parsed : []));
    } catch {
      setVisibleState(false);
      setCompleted(new Set());
    }
  }, [userId]);

  const setVisible = useCallback(
    (v: boolean) => {
      if (!userId?.trim()) return;
      setVisibleState(v);
      try {
        localStorage.setItem(getVisibleKey(userId), String(v));
      } catch {
        // ignore
      }
    },
    [userId]
  );

  const toggleCompleted = useCallback(
    (title: string) => {
      if (!userId?.trim()) return;
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(title)) {
          next.delete(title);
        } else {
          next.add(title);
        }
        try {
          localStorage.setItem(
            getCompletedKey(userId),
            JSON.stringify([...next])
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    [userId]
  );

  return { visible, setVisible, completed, toggleCompleted };
}
