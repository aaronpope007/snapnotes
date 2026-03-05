import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_leaks_visible';

const DEFAULT = false;

interface LeaksVisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const LeaksVisibilityContext = createContext<LeaksVisibilityContextValue | null>(null);

export function useLeaksVisibility(): boolean {
  const ctx = useContext(LeaksVisibilityContext);
  return ctx?.visible ?? DEFAULT;
}

export function useSetLeaksVisibility(): (v: boolean) => void {
  const ctx = useContext(LeaksVisibilityContext);
  if (!ctx) throw new Error('LeaksVisibilityProvider required');
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

interface LeaksVisibilityProviderProps {
  children: ReactNode;
}

export function LeaksVisibilityProvider({ children }: LeaksVisibilityProviderProps) {
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
    <LeaksVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </LeaksVisibilityContext.Provider>
  );
}
