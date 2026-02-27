import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCompactMode } from '../../context/CompactModeContext';
import type { MentalGameEntry } from '../../types/learning';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'OK',
  4: 'Good',
  5: 'Excellent',
};

interface MentalEntryCardProps {
  entry: MentalGameEntry;
  onDelete: (id: string) => void;
}

export function MentalEntryCard({ entry, onDelete }: MentalEntryCardProps) {
  const compact = useCompactMode();
  const dateStr = new Date(entry.sessionDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const affects: string[] = [];
  if (entry.tiltAffected) affects.push('tilt');
  if (entry.fatigueAffected) affects.push('fatigue');
  if (entry.confidenceAffected) affects.push('confidence');

  return (
    <Paper
      variant="outlined"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: compact ? 0.25 : 0.5,
          p: compact ? 0.375 : 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary">
              {dateStr}
            </Typography>
            <Box
              component="span"
              sx={{
                px: 0.5,
                py: 0.125,
                borderRadius: 0.5,
                fontSize: '0.65rem',
                bgcolor: 'action.selected',
                color: 'text.secondary',
              }}
            >
              {RATING_LABELS[entry.stateRating] ?? entry.stateRating}/5
            </Box>
            {affects.length > 0 && (
              <Typography variant="caption" color="error.main" sx={{ fontSize: '0.65rem' }}>
                {affects.join(', ')}
              </Typography>
            )}
          </Box>
          {entry.observation && (
            <Typography
              variant={compact ? 'caption' : 'body2'}
              sx={{ whiteSpace: 'pre-wrap', display: 'block' }}
            >
              {entry.observation}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          onClick={() => onDelete(entry._id)}
          sx={{ p: 0.25 }}
          aria-label="Delete"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}
