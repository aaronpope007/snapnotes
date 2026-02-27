import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_learning_visible';

const DEFAULT = false;

interface LearningVisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const LearningVisibilityContext = createContext<LearningVisibilityContextValue | null>(null);

export function useLearningVisibility(): boolean {
  const ctx = useContext(LearningVisibilityContext);
  return ctx?.visible ?? DEFAULT;
}

export function useSetLearningVisibility(): (v: boolean) => void {
  const ctx = useContext(LearningVisibilityContext);
  if (!ctx) throw new Error('LearningVisibilityProvider required');
  return ctx.setVisible;
}

function loadStored(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT;
    return raw === 'true';
  } catch {
    return DEFAULT;
  }
}

interface LearningVisibilityProviderProps {
  children: ReactNode;
}

export function LearningVisibilityProvider({ children }: LearningVisibilityProviderProps) {
  const [visible, setVisibleState] = useState<boolean>(DEFAULT);

  useEffect(() => {
    setVisibleState(loadStored());
  }, []);

  const setVisible = useCallback((v: boolean) => {
    setVisibleState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // ignore
    }
  }, []);

  return (
    <LearningVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </LearningVisibilityContext.Provider>
  );
}
