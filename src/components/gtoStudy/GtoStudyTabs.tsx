import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useCompactMode } from '../../context/CompactModeContext';

interface GtoStudyTabsProps {
  filterQuery: string;
  onFilterChange: (value: string) => void;
  onLog: () => void;
  onNewDrill: () => void;
}

export function GtoStudyTabs({
  filterQuery,
  onFilterChange,
  onLog,
  onNewDrill,
}: GtoStudyTabsProps) {
  const compact = useCompactMode();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: compact ? 0.75 : 1,
        mb: compact ? 1 : 2,
      }}
    >
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        sx={{ fontWeight: 600, fontSize: compact ? '0.85rem' : undefined, flexShrink: 0 }}
      >
        GTO Study
      </Typography>
      <TextField
        size="small"
        placeholder="Filter drills..."
        value={filterQuery}
        onChange={(e) => onFilterChange(e.target.value)}
        sx={{
          flex: '1 1 140px',
          minWidth: 120,
          maxWidth: 220,
          '& .MuiInputBase-root': {
            typography: compact ? 'caption' : 'body2',
          },
        }}
        inputProps={{ 'aria-label': 'Filter drills' }}
        InputProps={{
          endAdornment:
            filterQuery.trim() !== '' ? (
              <InputAdornment position="end" sx={{ ml: -0.5 }}>
                <IconButton edge="end" size="small" onClick={() => onFilterChange('')} aria-label="Clear filter">
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
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
