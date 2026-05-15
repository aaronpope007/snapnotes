import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { useCompactMode } from '../../context/CompactModeContext';

interface GtoStudyTabsProps {
  onLog: () => void;
  onNewDrill: () => void;
}

export function GtoStudyTabs({ onLog, onNewDrill }: GtoStudyTabsProps) {
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
        <Button variant="outlined" size="small" onClick={onNewDrill}>
          New Drill
        </Button>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onLog}>
          Log
        </Button>
      </Box>
    </Box>
  );
}
