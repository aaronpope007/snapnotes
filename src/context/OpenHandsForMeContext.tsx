import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchHandsToReview } from '../api/handsToReview';
import { useUserName } from './UserNameContext';
import { useAbortSignalRef, useMountedRef, isAbortError } from '../hooks/useMountedRef';
import { countHandsForMe } from '../utils/handsForMe';
import type { HandToReview } from '../types';

interface OpenHandsForMeContextValue {
  openHands: HandToReview[];
  forMeCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OpenHandsForMeContext = createContext<OpenHandsForMeContextValue | null>(null);

export function OpenHandsForMeProvider({ children }: { children: ReactNode }) {
  const userName = useUserName();
  const mounted = useMountedRef();
  const nextSignal = useAbortSignalRef();
  const [openHands, setOpenHands] = useState<HandToReview[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const name = userName?.trim();
    if (!name) {
      setOpenHands([]);
      return;
    }
    const signal = nextSignal();
    setLoading(true);
    try {
      const data = await fetchHandsToReview('open', name, { signal });
      if (!mounted.current || signal.aborted) return;
      setOpenHands(data);
    } catch (err) {
      if (isAbortError(err) || !mounted.current) return;
      setOpenHands([]);
    } finally {
      if (mounted.current && !signal.aborted) setLoading(false);
    }
  }, [userName, mounted, nextSignal]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const forMeCount = useMemo(() => countHandsForMe(openHands, userName), [openHands, userName]);

  const value = useMemo(
    () => ({ openHands, forMeCount, loading, refresh }),
    [openHands, forMeCount, loading, refresh]
  );

  return (
    <OpenHandsForMeContext.Provider value={value}>{children}</OpenHandsForMeContext.Provider>
  );
}

export function useOpenHandsForMe(): OpenHandsForMeContextValue {
  const ctx = useContext(OpenHandsForMeContext);
  if (!ctx) {
    throw new Error('useOpenHandsForMe must be used within OpenHandsForMeProvider');
  }
  return ctx;
}
