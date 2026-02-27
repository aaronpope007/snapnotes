import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_dark_mode';

interface DarkModeContextValue {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

export function useDarkMode(): boolean {
  const ctx = useContext(DarkModeContext);
  return ctx?.darkMode ?? true;
}

export function useSetDarkMode(): (value: boolean) => void {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error('DarkModeProvider required');
  return ctx.setDarkMode;
}

interface DarkModeProviderProps {
  children: ReactNode;
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const [darkMode, setDarkModeState] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDarkModeState(stored !== 'false');
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setDarkModeState(value);
  }, []);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
