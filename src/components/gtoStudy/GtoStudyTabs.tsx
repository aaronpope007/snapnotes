import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useCompactMode } from '../../context/CompactModeContext';

export type GtoStudyTabValue = 'log' | 'chart';

interface GtoStudyTabsProps {
  activeTab: GtoStudyTabValue;
  onTabChange: (tab: GtoStudyTabValue) => void;
  onAdd?: () => void;
}

export function GtoStudyTabs({ activeTab, onTabChange, onAdd }: GtoStudyTabsProps) {
  const compact = useCompactMode();

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
        GTO Study
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v != null && onTabChange(v)}
          size="small"
        >
          <ToggleButton value="log" aria-label="Log">
            <ListIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Log
          </ToggleButton>
          <ToggleButton value="chart" aria-label="Chart">
            <ShowChartIcon sx={{ fontSize: 14, mr: 0.25 }} />
            Chart
          </ToggleButton>
        </ToggleButtonGroup>
        {activeTab === 'log' && onAdd && (
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={onAdd}>
            Log
          </Button>
        )}
      </Box>
    </Box>
  );
}
