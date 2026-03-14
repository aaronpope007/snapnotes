import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { fetchSessionResults, createSessionResult, uploadSessionResults, updateSessionResult, deleteSessionResult, fetchWithdrawals, createWithdrawal, updateWithdrawal, deleteWithdrawal } from '../api/results';
import type { SessionResult, SessionResultCreate, SessionUploadRow, Withdrawal, WithdrawalCreate } from '../types/results';
import { getMostRecentSession } from '../utils/sessionUtils';
import { ResultsTabs, type ResultsTabValue, type ResultsViewValue } from '../components/results/ResultsTabs';
import { SessionsGridTab } from '../components/results/SessionsGridTab';
import { AddOrUploadTab } from '../components/results/AddOrUploadTab';
import { SummaryTab } from '../components/results/SummaryTab';
import { WithdrawalsTab } from '../components/results/WithdrawalsTab';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface ResultsPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
  onActiveSessionChange?: () => void;
  hasActiveSession?: boolean;
  activeSessionStartTime?: string | null;
  resetSessionTrigger?: number;
  requestOpenEndSessionModal?: boolean;
  onClearRequestOpenEndSessionModal?: () => void;
  requestOpenEditSessionModal?: boolean;
  onClearRequestOpenEditSessionModal?: () => void;
}

export function ResultsPage({ onSuccess, onError, onActiveSessionChange, hasActiveSession, activeSessionStartTime, resetSessionTrigger, requestOpenEndSessionModal, onClearRequestOpenEndSessionModal, requestOpenEditSessionModal, onClearRequestOpenEditSessionModal }: ResultsPageProps) {
  const userName = useUserName();
  const [view, setView] = useState<ResultsViewValue>('summary');
  const [activeTab, setActiveTab] = useState<ResultsTabValue>('sessions');
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  const loadSessions = useCallback(async (): Promise<SessionResult[]> => {
    if (!userName?.trim()) {
      setSessions([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const data = await fetchSessionResults(userName);
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
      return list;
    } catch {
      setSessions([]);
      onError?.('Failed to load results');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userName, onError]);

  const loadWithdrawals = useCallback(async () => {
    if (!userName?.trim()) {
      setWithdrawals([]);
      setWithdrawalsLoading(false);
      return;
    }
    setWithdrawalsLoading(true);
    try {
      const data = await fetchWithdrawals(userName);
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch {
      setWithdrawals([]);
      onError?.('Failed to load withdrawals');
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [userName, onError]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  const handleAddSession = useCallback(
    async (payload: SessionResultCreate) => {
      await createSessionResult(userName, payload);
      await loadSessions();
    },
    [userName, loadSessions]
  );

  const handleUpload = useCallback(
    async (rows: SessionUploadRow[]) => {
      const result = await uploadSessionResults(userName, rows);
      await loadSessions();
      return { count: result.count };
    },
    [userName, loadSessions]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<SessionResultCreate>) => {
      try {
        await updateSessionResult(id, updates);
        await loadSessions();
        onSuccess?.('Session updated.');
      } catch {
        onError?.('Failed to update session.');
        throw new Error('Failed to update session');
      }
    },
    [loadSessions, onSuccess, onError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSessionResult(id);
        await loadSessions();
        onSuccess?.('Session deleted.');
      } catch {
        onError?.('Failed to delete session.');
        throw new Error('Failed to delete session');
      }
    },
    [loadSessions, onSuccess, onError]
  );

  const handleAddWithdrawal = useCallback(
    async (payload: WithdrawalCreate) => {
      await createWithdrawal(userName, payload);
      await loadWithdrawals();
      onSuccess?.('Withdrawal added.');
    },
    [userName, loadWithdrawals, onSuccess]
  );

  const handleUpdateWithdrawal = useCallback(
    async (id: string, updates: Partial<WithdrawalCreate>) => {
      try {
        await updateWithdrawal(id, updates);
        await loadWithdrawals();
        onSuccess?.('Withdrawal updated.');
      } catch {
        onError?.('Failed to update withdrawal.');
        throw new Error('Failed to update withdrawal');
      }
    },
    [loadWithdrawals, onSuccess, onError]
  );

  const handleDeleteWithdrawal = useCallback(
    async (id: string) => {
      try {
        await deleteWithdrawal(id);
        await loadWithdrawals();
        onSuccess?.('Withdrawal deleted.');
      } catch {
        onError?.('Failed to delete withdrawal.');
        throw new Error('Failed to delete withdrawal');
      }
    },
    [loadWithdrawals, onSuccess, onError]
  );

  const totalHands = sessions.reduce((sum, s) => sum + (s.hands ?? 0), 0);
  const mostRecentSession = useMemo(() => getMostRecentSession(sessions), [sessions]);
  const lastHandsEndedAt =
    mostRecentSession?.handsEndedAt ??
    (sessions.length > 0 ? totalHands : 0);

  const getFreshSessionStartData = useCallback(async () => {
    const list = await loadSessions();
    const mostRecent = getMostRecentSession(list);
    const total = list.reduce((sum, s) => sum + (s.hands ?? 0), 0);
    const lastHandsEndedAt = mostRecent?.handsEndedAt ?? (list.length > 0 ? total : 0);
    return { lastHandsEndedAt };
  }, [loadSessions]);

  return (
    <Box sx={{ width: '100%', minWidth: 0, flex: 1, overflow: 'auto' }}>
      <ResultsTabs
            view={view}
            onViewChange={setView}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            lastHandsEndedAt={lastHandsEndedAt}
            getFreshSessionStartData={getFreshSessionStartData}
            hasUser={!!userName?.trim()}
            userName={userName}
            lastEndBankroll={mostRecentSession?.endBankroll ?? null}
            onAddSession={handleAddSession}
            onSuccess={(msg) => onSuccess?.(msg)}
            onError={(msg) => onError?.(msg)}
            onActiveSessionChange={onActiveSessionChange}
            resetSessionTrigger={resetSessionTrigger}
            requestOpenEndSessionModal={requestOpenEndSessionModal}
            onClearRequestOpenEndSessionModal={onClearRequestOpenEndSessionModal}
            requestOpenEditSessionModal={requestOpenEditSessionModal}
            onClearRequestOpenEditSessionModal={onClearRequestOpenEditSessionModal}
          />
      {!userName?.trim() ? (
            <Typography variant="body2" color="text.secondary">
              Enter your name to use Results.
            </Typography>
          ) : view === 'summary' ? (
            <ErrorBoundary>
              <SummaryTab
                sessions={sessions}
                withdrawals={withdrawals}
                loading={loading}
                hasActiveSession={hasActiveSession}
                activeSessionStartTime={activeSessionStartTime}
              />
            </ErrorBoundary>
          ) : activeTab === 'withdrawals' ? (
        <ErrorBoundary>
          <WithdrawalsTab
            withdrawals={withdrawals}
            loading={withdrawalsLoading}
            onAdd={handleAddWithdrawal}
            onUpdate={handleUpdateWithdrawal}
            onDelete={handleDeleteWithdrawal}
            onError={(msg) => onError?.(msg)}
          />
        </ErrorBoundary>
      ) : activeTab === 'sessions' ? (
        <ErrorBoundary>
          <SessionsGridTab
                sessions={sessions}
                loading={loading}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <AddOrUploadTab
                userId={userName}
                onAddSession={handleAddSession}
                onUpload={handleUpload}
                onSuccess={(msg) => onSuccess?.(msg)}
            onError={(msg) => onError?.(msg)}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
}
