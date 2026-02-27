import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Badge from '@mui/material/Badge';
import { useCompactMode } from '../../context/CompactModeContext';

export type LearningTabValue = 'leaks' | 'edges' | 'mental' | 'due';

interface LearningTabsProps {
  activeTab: LearningTabValue;
  onTabChange: (tab: LearningTabValue) => void;
  dueCount: number;
  onAddLeak?: () => void;
  onAddEdge?: () => void;
  onAddMental?: () => void;
}

export function LearningTabs({
  activeTab,
  onTabChange,
  dueCount,
  onAddLeak,
  onAddEdge,
  onAddMental,
}: LearningTabsProps) {
  const compact = useCompactMode();

  const handleAdd = () => {
    if (activeTab === 'leaks') onAddLeak?.();
    else if (activeTab === 'edges') onAddEdge?.();
    else if (activeTab === 'mental') onAddMental?.();
  };

  const showAdd =
    (activeTab === 'leaks' && onAddLeak) ||
    (activeTab === 'edges' && onAddEdge) ||
    (activeTab === 'mental' && onAddMental);

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
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        sx={{ fontWeight: 600, fontSize: compact ? '0.85rem' : undefined }}
      >
        Leaks &amp; Edge
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v != null && onTabChange(v)}
          size="small"
        >
          <ToggleButton value="leaks" aria-label="Leaks">
            <BugReportIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Leaks
          </ToggleButton>
          <ToggleButton value="edges" aria-label="Edges">
            <TrendingUpIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Edges
          </ToggleButton>
          <ToggleButton value="mental" aria-label="Mental">
            <PsychologyIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Mental
          </ToggleButton>
          <ToggleButton
            value="due"
            aria-label="Due for review"
            sx={dueCount > 0 ? { color: 'primary.main' } : undefined}
          >
            <Badge badgeContent={dueCount} color="primary" sx={{ '& .MuiBadge-badge': { right: -4, top: 2 } }}>
              <ScheduleIcon sx={{ fontSize: 14, mr: 0.25 }} />
            </Badge>
            Due
          </ToggleButton>
        </ToggleButtonGroup>
        {showAdd && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add
          </Button>
        )}
      </Box>
    </Box>
  );
}
