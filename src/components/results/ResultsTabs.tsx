import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { useCompactMode } from '../../context/CompactModeContext';
import { LogNewSessionModal } from './LogNewSessionModal';
import type { SessionResultCreate } from '../../types/results';

export type ResultsViewValue = 'summary' | 'all';
export type ResultsTabValue = 'sessions' | 'add';

interface ResultsTabsProps {
  view: ResultsViewValue;
  onViewChange: (view: ResultsViewValue) => void;
  activeTab: ResultsTabValue;
  onTabChange: (tab: ResultsTabValue) => void;
  totalHands: number;
  hasUser: boolean;
  onAddSession: (payload: SessionResultCreate) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ResultsTabs({
  view,
  onViewChange,
  activeTab,
  onTabChange,
  totalHands,
  hasUser,
  onAddSession,
  onSuccess,
  onError,
}: ResultsTabsProps) {
  const compact = useCompactMode();
  const [logModalOpen, setLogModalOpen] = useState(false);

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
        totalHandsSoFar={totalHands}
        onAddSession={onAddSession}
        onSuccess={onSuccess}
        onError={onError}
      />
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
