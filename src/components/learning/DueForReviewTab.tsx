import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCompactMode } from '../../context/CompactModeContext';
import { ReviewCard } from './ReviewCard';

interface DueForReviewTabProps extends ReturnType<typeof import('../../hooks/useDueReviews').useDueReviews> {
  userId: string | null;
}

export function DueForReviewTab({
  dueLeaks,
  loading,
  reviewingId,
  loadDue,
  handleStillFixed,
  handleRegressed,
}: DueForReviewTabProps) {
  const compact = useCompactMode();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: compact ? 1 : 1.5,
        }}
      >
        <IconButton size="small" onClick={() => void loadDue()} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : dueLeaks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No leaks due for review today. Resolve leaks to get 7, 30, and 90-day follow-up prompts.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.5 : 1 }}>
          {dueLeaks.map((leak) => (
            <ReviewCard
              key={leak._id}
              leak={leak}
              onStillFixed={handleStillFixed}
              onRegressed={handleRegressed}
              loading={reviewingId === leak._id}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
