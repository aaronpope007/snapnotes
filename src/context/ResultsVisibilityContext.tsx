import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_results_visible';
const DEFAULT = false;

interface ResultsVisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const ResultsVisibilityContext = createContext<ResultsVisibilityContextValue | null>(null);

export function useResultsVisibility(): boolean {
  const ctx = useContext(ResultsVisibilityContext);
  return ctx?.visible ?? DEFAULT;
}

export function useSetResultsVisibility(): (v: boolean) => void {
  const ctx = useContext(ResultsVisibilityContext);
  if (!ctx) throw new Error('ResultsVisibilityProvider required');
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

interface ResultsVisibilityProviderProps {
  children: ReactNode;
}

export function ResultsVisibilityProvider({ children }: ResultsVisibilityProviderProps) {
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
    <ResultsVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </ResultsVisibilityContext.Provider>
  );
}
