import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_horizontal_mode';

interface HorizontalModeContextValue {
  horizontal: boolean;
  setHorizontal: (value: boolean) => void;
}

const HorizontalModeContext = createContext<HorizontalModeContextValue | null>(null);

export function useHorizontalMode(): boolean {
  const ctx = useContext(HorizontalModeContext);
  return ctx?.horizontal ?? false;
}

export function useSetHorizontalMode(): (value: boolean) => void {
  const ctx = useContext(HorizontalModeContext);
  if (!ctx) throw new Error('HorizontalModeProvider required');
  return ctx.setHorizontal;
}

interface HorizontalModeProviderProps {
  children: ReactNode;
}

export function HorizontalModeProvider({ children }: HorizontalModeProviderProps) {
  const [horizontal, setHorizontalState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setHorizontalState(stored === 'true');
  }, []);

  const setHorizontal = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setHorizontalState(value);
  }, []);

  return (
    <HorizontalModeContext.Provider value={{ horizontal, setHorizontal }}>
      {children}
    </HorizontalModeContext.Provider>
  );
}
