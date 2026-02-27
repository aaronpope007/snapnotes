import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useCompactMode } from '../../context/CompactModeContext';
import type { Leak } from '../../types/learning';

const REVIEW_STAGE_LABELS: Record<number, string> = {
  0: '7-day check',
  1: '7-day check',
  2: '30-day check',
  3: '90-day check',
};

interface ReviewCardProps {
  leak: Leak;
  onStillFixed: (leakId: string) => void;
  onRegressed: (leakId: string) => void;
  loading?: boolean;
}

export function ReviewCard({ leak, onStillFixed, onRegressed, loading }: ReviewCardProps) {
  const compact = useCompactMode();
  const stage = leak.reviewStage ?? 0;
  const label = REVIEW_STAGE_LABELS[stage] ?? `${stage}-day check`;

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
      <Box sx={{ p: compact ? 0.75 : 1.5 }}>
        <Typography
          variant={compact ? 'caption' : 'body2'}
          sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
        >
          {leak.title || 'Untitled leak'}
        </Typography>
        {leak.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: compact ? 0.5 : 1, whiteSpace: 'pre-wrap' }}
          >
            {leak.description}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: compact ? 0.5 : 1 }}>
          Resolved {leak.resolvedAt ? new Date(leak.resolvedAt).toLocaleDateString() : '—'} • {label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onStillFixed(leak._id)}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Still fixed ✓
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<CancelIcon />}
            onClick={() => onRegressed(leak._id)}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Regressed ✗
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
