import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_gto_study_visible';

const DEFAULT = true;

interface GtoStudyVisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const GtoStudyVisibilityContext = createContext<GtoStudyVisibilityContextValue | null>(null);

export function useGtoStudyVisibility(): boolean {
  const ctx = useContext(GtoStudyVisibilityContext);
  return ctx?.visible ?? DEFAULT;
}

export function useSetGtoStudyVisibility(): (v: boolean) => void {
  const ctx = useContext(GtoStudyVisibilityContext);
  if (!ctx) throw new Error('GtoStudyVisibilityProvider required');
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

interface GtoStudyVisibilityProviderProps {
  children: ReactNode;
}

export function GtoStudyVisibilityProvider({ children }: GtoStudyVisibilityProviderProps) {
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
    <GtoStudyVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </GtoStudyVisibilityContext.Provider>
  );
}
