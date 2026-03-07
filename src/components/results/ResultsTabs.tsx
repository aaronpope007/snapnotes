import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useCompactMode } from '../../context/CompactModeContext';
import { getActiveSession, setActiveSession, clearActiveSession } from '../../utils/activeSession';
import { LogNewSessionModal } from './LogNewSessionModal';
import { EndSessionModal } from './EndSessionModal';
import type { SessionResultCreate } from '../../types/results';

export type ResultsViewValue = 'summary' | 'all';
export type ResultsTabValue = 'sessions' | 'add';

interface ResultsTabsProps {
  view: ResultsViewValue;
  onViewChange: (view: ResultsViewValue) => void;
  activeTab: ResultsTabValue;
  onTabChange: (tab: ResultsTabValue) => void;
  lastHandsEndedAt: number;
  hasUser: boolean;
  userName: string | null;
  lastEndBankroll: number | null;
  onAddSession: (payload: SessionResultCreate) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onActiveSessionChange?: () => void;
  resetSessionTrigger?: number;
  requestOpenEndSessionModal?: boolean;
  onClearRequestOpenEndSessionModal?: () => void;
}

export function ResultsTabs({
  view,
  onViewChange,
  activeTab,
  onTabChange,
  lastHandsEndedAt,
  hasUser,
  userName,
  lastEndBankroll,
  onAddSession,
  onSuccess,
  onError,
  onActiveSessionChange,
  resetSessionTrigger,
  requestOpenEndSessionModal,
  onClearRequestOpenEndSessionModal,
}: ResultsTabsProps) {
  const compact = useCompactMode();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [activeSession, setActiveSessionState] = useState(() => getActiveSession());

  useEffect(() => {
    if (requestOpenEndSessionModal && onClearRequestOpenEndSessionModal) {
      onClearRequestOpenEndSessionModal();
      queueMicrotask(() => {
        const stored = getActiveSession();
        setActiveSessionState(stored);
        if (stored) setEndModalOpen(true);
      });
    }
  }, [requestOpenEndSessionModal, onClearRequestOpenEndSessionModal]);

  useEffect(() => {
    const stored = getActiveSession();
    if (stored && userName && stored.userId !== userName.trim()) {
      clearActiveSession();
      setActiveSessionState(null);
      onActiveSessionChange?.();
    } else {
      setActiveSessionState(stored);
    }
  }, [userName, onActiveSessionChange]);

  useEffect(() => {
    if (resetSessionTrigger == null) return;
    setActiveSessionState(getActiveSession());
  }, [resetSessionTrigger]);

  const handleStartSession = useCallback(() => {
    if (!userName?.trim()) return;
    const session = {
      startTime: new Date().toISOString(),
      userId: userName.trim(),
      startHandNumber: lastHandsEndedAt,
    };
    setActiveSession(session);
    setActiveSessionState(session);
    onActiveSessionChange?.();
    onSuccess('Session started. Click End session when done.');
  }, [userName, lastHandsEndedAt, onSuccess, onActiveSessionChange]);

  const handleEndSessionSuccess = useCallback(
    async (payload: SessionResultCreate) => {
      await onAddSession(payload);
      clearActiveSession();
      setActiveSessionState(null);
      onActiveSessionChange?.();
    },
    [onAddSession, onActiveSessionChange]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: compact ? 0.5 : 1,
        mb: compact ? 1 : 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography
          variant={compact ? 'subtitle1' : 'h6'}
          sx={{ fontWeight: 600, fontSize: compact ? '0.85rem' : undefined }}
        >
          Results
        </Typography>
        <Button
          variant={view === 'summary' ? 'contained' : 'outlined'}
          size="small"
          startIcon={<SummarizeIcon />}
          onClick={() => onViewChange('summary')}
        >
          Summary
        </Button>
        {activeSession ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              Session in progress since {new Date(activeSession.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<StopIcon />}
              onClick={() => setEndModalOpen(true)}
            >
              End session
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartSession}
            disabled={!hasUser}
          >
            Start session
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<PostAddIcon />}
          onClick={() => setLogModalOpen(true)}
          disabled={!hasUser}
        >
          Log new session
        </Button>
        <Button
          variant={view === 'all' ? 'contained' : 'outlined'}
          size="small"
          startIcon={<TableChartIcon />}
          onClick={() => onViewChange('all')}
        >
          All sessions
        </Button>
      </Box>
      <LogNewSessionModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        totalHandsSoFar={lastHandsEndedAt}
        onAddSession={onAddSession}
        onSuccess={onSuccess}
        onError={onError}
      />
      {activeSession && (
        <EndSessionModal
          open={endModalOpen}
          onClose={() => setEndModalOpen(false)}
          activeSession={activeSession}
          lastEndBankroll={lastEndBankroll}
          onEndSession={handleEndSessionSuccess}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
      {view === 'all' && (
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v != null && onTabChange(v)}
          size="small"
        >
          <ToggleButton value="sessions" aria-label="Sessions">
            <TableChartIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Sessions
          </ToggleButton>
          <ToggleButton value="add" aria-label="Add / Upload">
            <AddIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Add / Upload
          </ToggleButton>
        </ToggleButtonGroup>
      )}
    </Box>
  );
}
