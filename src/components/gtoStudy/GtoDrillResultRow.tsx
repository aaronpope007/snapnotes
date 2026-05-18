import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCompactMode } from '../../context/CompactModeContext';
import {
  formatAccuracyPercent,
  formatBestActionRate,
  formatEvDiff,
  formatHandsPlayed,
  formatResultTime,
  formatScorePerHand,
  formatSessionScore,
} from '../../utils/gtoStudyUtils';
import type { GtoDrillResult } from '../../types/gtoStudy';

interface GtoDrillResultRowProps {
  result: GtoDrillResult;
  onEdit: (result: GtoDrillResult) => void;
  onDelete: (resultId: string) => void;
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: '1 1 52px', minWidth: 0, textAlign: 'center' }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontSize: '0.6rem', lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
        {value}
      </Typography>
    </Box>
  );
}

export function GtoDrillResultRow({ result, onEdit, onDelete }: GtoDrillResultRowProps) {
  const compact = useCompactMode();
  const timeStr = formatResultTime(result.date);

  return (
    <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: compact ? 0.25 : 0.5,
          p: compact ? 0.375 : 0.75,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}
          >
            {timeStr}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              mb: result.notes ? 0.25 : 0,
            }}
          >
            <MetricCell label="Hands" value={formatHandsPlayed(result.handsPlayed)} />
            <MetricCell label="Accuracy" value={formatAccuracyPercent(result.accuracy)} />
            <MetricCell
              label="Best Action %"
              value={formatBestActionRate(result.bestActionRate)}
            />
            <MetricCell label="Score" value={formatSessionScore(result.score)} />
            <MetricCell
              label="Score/Hand"
              value={formatScorePerHand(result.score, result.handsPlayed)}
            />
            <MetricCell label="EV Diff" value={formatEvDiff(result.evDiff)} />
          </Box>
          {result.notes && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {result.notes}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexShrink: 0 }}>
          <IconButton size="small" onClick={() => onEdit(result)} aria-label="Edit result" sx={{ p: 0.25 }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(result._id)}
            aria-label="Delete result"
            sx={{ p: 0.25 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
