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
import { dedupeRequest } from '../utils/dedupeRequest';
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
  const [openHands, setOpenHands] = useState<HandToReview[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const name = userName?.trim();
    if (!name) {
      setOpenHands([]);
      return;
    }
    setLoading(true);
    try {
      const data = await dedupeRequest(`hands:open:${name}`, () =>
        fetchHandsToReview('open', name)
      );
      setOpenHands(data);
    } catch {
      setOpenHands([]);
    } finally {
      setLoading(false);
    }
  }, [userName]);

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
