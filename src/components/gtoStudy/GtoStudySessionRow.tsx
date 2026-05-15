import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCompactMode } from '../../context/CompactModeContext';
import { GTO_ENDS_AFTER_LABELS, GTO_FORMAT_LABELS } from '../../constants/gtoStudy';
import { formatSessionTime } from '../../utils/gtoStudyUtils';
import type { GtoStudySession } from '../../types/gtoStudy';

interface GtoStudySessionRowProps {
  session: GtoStudySession;
  onEdit: (session: GtoStudySession) => void;
  onDelete: (id: string) => void;
}

export function GtoStudySessionRow({ session, onEdit, onDelete }: GtoStudySessionRowProps) {
  const compact = useCompactMode();
  const timeStr = formatSessionTime(session.sessionDate);
  const formatLabel = GTO_FORMAT_LABELS[session.format];
  const endsLabel = GTO_ENDS_AFTER_LABELS[session.endsAfter];

  const summaryParts = [
    formatLabel,
    session.stack,
    session.handStart,
    session.potType,
    `Hero ${session.heroPosition}`,
  ];
  if (session.villainPosition) {
    summaryParts.push(`vs ${session.villainPosition}`);
  }
  summaryParts.push(endsLabel);

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
          p: compact ? 0.375 : 0.75,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {timeStr}
            </Typography>
            {session.evLoss != null && (
              <Box
                component="span"
                sx={{
                  px: 0.5,
                  py: 0.125,
                  borderRadius: 0.5,
                  fontSize: '0.65rem',
                  bgcolor: 'error.dark',
                  color: 'error.contrastText',
                  fontWeight: 600,
                }}
              >
                −{session.evLoss} bb
              </Box>
            )}
          </Box>
          <Typography
            variant={compact ? 'caption' : 'body2'}
            sx={{ lineHeight: 1.35, display: 'block' }}
          >
            {summaryParts.join(' · ')}
          </Typography>
          {session.notes && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.25, whiteSpace: 'pre-wrap' }}
            >
              {session.notes}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={() => onEdit(session)}
            sx={{ p: 0.25 }}
            aria-label="Edit session"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(session._id)}
            sx={{ p: 0.25 }}
            aria-label="Delete session"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
