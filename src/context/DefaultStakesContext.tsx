import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { STAKE_VALUES } from '../types';
import { GAME_TYPE_OPTIONS, FORMAT_OPTIONS, ORIGIN_OPTIONS } from '../constants/stakes';

const STORAGE_KEY = 'snapnotes_default_stakes';

export interface DefaultStakes {
  stakesSeenAt: number[];
  gameTypes: string[];
  formats: string[];
  origin: string;
}

const EMPTY_DEFAULTS: DefaultStakes = {
  stakesSeenAt: [],
  gameTypes: [],
  formats: [],
  origin: 'WPT Gold',
};

function parseStored(raw: string | null): DefaultStakes {
  if (!raw?.trim()) return EMPTY_DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return EMPTY_DEFAULTS;
    const o = parsed as Record<string, unknown>;
    const stakesSeenAt = Array.isArray(o.stakesSeenAt)
      ? (o.stakesSeenAt as number[]).filter((s) => STAKE_VALUES.includes(s as (typeof STAKE_VALUES)[number]))
      : [];
    const gameTypes = Array.isArray(o.gameTypes)
      ? (o.gameTypes as string[]).filter((g) => GAME_TYPE_OPTIONS.includes(g as (typeof GAME_TYPE_OPTIONS)[number]))
      : [];
    const formats = Array.isArray(o.formats)
      ? (o.formats as string[]).filter((f) => FORMAT_OPTIONS.includes(f as (typeof FORMAT_OPTIONS)[number]))
      : [];
    const origin =
      typeof o.origin === 'string' && ORIGIN_OPTIONS.includes(o.origin as (typeof ORIGIN_OPTIONS)[number])
        ? o.origin
        : 'WPT Gold';
    return { stakesSeenAt, gameTypes, formats, origin };
  } catch {
    return EMPTY_DEFAULTS;
  }
}

interface DefaultStakesContextValue {
  defaultStakes: DefaultStakes;
  setDefaultStakes: (v: DefaultStakes) => void;
}

const DefaultStakesContext = createContext<DefaultStakesContextValue | null>(null);

export function useDefaultStakes(): DefaultStakes {
  const ctx = useContext(DefaultStakesContext);
  return ctx?.defaultStakes ?? EMPTY_DEFAULTS;
}

export function useSetDefaultStakes(): (v: DefaultStakes) => void {
  const ctx = useContext(DefaultStakesContext);
  if (!ctx) throw new Error('DefaultStakesProvider required');
  return ctx.setDefaultStakes;
}

interface DefaultStakesProviderProps {
  children: ReactNode;
}

export function DefaultStakesProvider({ children }: DefaultStakesProviderProps) {
  const [defaultStakes, setState] = useState<DefaultStakes>(EMPTY_DEFAULTS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setState(parseStored(raw));
  }, []);

  const setDefaultStakes = useCallback((v: DefaultStakes) => {
    const safe: DefaultStakes = {
      stakesSeenAt: v.stakesSeenAt.filter((s) =>
        (STAKE_VALUES as readonly number[]).includes(s)
      ),
      gameTypes: v.gameTypes.filter((g) =>
        (GAME_TYPE_OPTIONS as readonly string[]).includes(g)
      ),
      formats: v.formats.filter((f) =>
        (FORMAT_OPTIONS as readonly string[]).includes(f)
      ),
      origin: (ORIGIN_OPTIONS as readonly string[]).includes(v.origin) ? v.origin : 'WPT Gold',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    setState(safe);
  }, []);

  return (
    <DefaultStakesContext.Provider value={{ defaultStakes, setDefaultStakes }}>
      {children}
    </DefaultStakesContext.Provider>
  );
}
