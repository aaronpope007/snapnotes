import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'snapnotes_calculator_visibility';

export interface CalculatorVisibility {
  showMDF: boolean;
  showFE: boolean;
  showGEO: boolean;
  showRNG: boolean;
}

const DEFAULT: CalculatorVisibility = {
  showMDF: false,
  showFE: false,
  showGEO: false,
  showRNG: false,
};

interface CalculatorVisibilityContextValue {
  visibility: CalculatorVisibility;
  setVisibility: (updates: Partial<CalculatorVisibility>) => void;
}

const CalculatorVisibilityContext = createContext<CalculatorVisibilityContextValue | null>(null);

export function useCalculatorVisibility(): CalculatorVisibility {
  const ctx = useContext(CalculatorVisibilityContext);
  return ctx?.visibility ?? DEFAULT;
}

export function useSetCalculatorVisibility(): (updates: Partial<CalculatorVisibility>) => void {
  const ctx = useContext(CalculatorVisibilityContext);
  if (!ctx) throw new Error('CalculatorVisibilityProvider required');
  return ctx.setVisibility;
}

function loadStored(): CalculatorVisibility {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<CalculatorVisibility>;
    return {
      showMDF: parsed.showMDF ?? DEFAULT.showMDF,
      showFE: parsed.showFE ?? DEFAULT.showFE,
      showGEO: parsed.showGEO ?? DEFAULT.showGEO,
      showRNG: parsed.showRNG ?? DEFAULT.showRNG,
    };
  } catch {
    return DEFAULT;
  }
}

interface CalculatorVisibilityProviderProps {
  children: ReactNode;
}

export function CalculatorVisibilityProvider({ children }: CalculatorVisibilityProviderProps) {
  const [visibility, setVisibilityState] = useState<CalculatorVisibility>(DEFAULT);

  useEffect(() => {
    setVisibilityState(loadStored());
  }, []);

  const setVisibility = useCallback((updates: Partial<CalculatorVisibility>) => {
    setVisibilityState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <CalculatorVisibilityContext.Provider value={{ visibility, setVisibility }}>
      {children}
    </CalculatorVisibilityContext.Provider>
  );
}
