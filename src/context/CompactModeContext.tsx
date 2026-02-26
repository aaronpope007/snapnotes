import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_compact_mode';

interface CompactModeContextValue {
  compact: boolean;
  setCompact: (value: boolean) => void;
}

const CompactModeContext = createContext<CompactModeContextValue | null>(null);

export function useCompactMode(): boolean {
  const ctx = useContext(CompactModeContext);
  return ctx?.compact ?? false;
}

export function useSetCompactMode(): (value: boolean) => void {
  const ctx = useContext(CompactModeContext);
  if (!ctx) throw new Error('CompactModeProvider required');
  return ctx.setCompact;
}

interface CompactModeProviderProps {
  children: ReactNode;
}

export function CompactModeProvider({ children }: CompactModeProviderProps) {
  const [compact, setCompactState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setCompactState(stored === 'true');
  }, []);

  const setCompact = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setCompactState(value);
  }, []);

  return (
    <CompactModeContext.Provider value={{ compact, setCompact }}>
      {children}
    </CompactModeContext.Provider>
  );
}
