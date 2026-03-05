import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { fetchSessionResults, createSessionResult, uploadSessionResults, updateSessionResult, deleteSessionResult } from '../api/results';
import type { SessionResult, SessionResultCreate, SessionUploadRow } from '../types/results';
import { ResultsTabs, type ResultsTabValue, type ResultsViewValue } from '../components/results/ResultsTabs';
import { SessionsGridTab } from '../components/results/SessionsGridTab';
import { AddOrUploadTab } from '../components/results/AddOrUploadTab';
import { SummaryTab } from '../components/results/SummaryTab';
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
}

export function ResultsPage({ onSuccess, onError, onActiveSessionChange, hasActiveSession, activeSessionStartTime, resetSessionTrigger, requestOpenEndSessionModal, onClearRequestOpenEndSessionModal }: ResultsPageProps) {
  const userName = useUserName();
  const [view, setView] = useState<ResultsViewValue>('summary');
  const [activeTab, setActiveTab] = useState<ResultsTabValue>('sessions');
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!userName?.trim()) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSessionResults(userName);
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
      onError?.('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [userName, onError]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

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

  const totalHands = sessions.reduce((sum, s) => sum + (s.hands ?? 0), 0);
  const mostRecentSession = sessions[0] ?? null;
  const lastHandsEndedAt =
    mostRecentSession?.handsEndedAt ??
    (sessions.length > 0 ? totalHands : 0);

  return (
    <Box sx={{ width: '100%', minWidth: 0, flex: 1, overflow: 'auto' }}>
      <ResultsTabs
        view={view}
        onViewChange={setView}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastHandsEndedAt={lastHandsEndedAt}
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
      />
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to use Results.
        </Typography>
      ) : view === 'summary' ? (
        <ErrorBoundary>
          <SummaryTab sessions={sessions} loading={loading} hasActiveSession={hasActiveSession} activeSessionStartTime={activeSessionStartTime} />
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
