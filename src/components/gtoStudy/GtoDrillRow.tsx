import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { useCompactMode } from '../../context/CompactModeContext';
import { formatDrillSummary } from '../../constants/gtoStudy';
import { GtoDrillDescriptionButton } from './GtoDrillDescriptionButton';
import {
  drillListPerformanceLabel,
  drillListPerformancePrimary,
  drillListPerformanceSecondary,
  drillListTrend,
} from '../../utils/drillListSummary';
import type { GtoDrill } from '../../types/gtoStudy';

interface GtoDrillRowProps {
  drill: GtoDrill;
  isArchived?: boolean;
  onOpenDrill: (drill: GtoDrill) => void;
  onOpenChart: (drill: GtoDrill) => void;
  onLogResult: (drillId: string) => void;
  onEdit: (drill: GtoDrill) => void;
  onClone: (drill: GtoDrill) => void;
  onDelete: (drillId: string) => void;
  onArchive?: (drillId: string) => void;
  onUnarchive?: (drillId: string) => void;
  onCopySuccess?: () => void;
  onCopyError?: (msg: string) => void;
}

function TrendGlyph({ trend }: { trend: ReturnType<typeof drillListTrend> }) {
  if (trend == null) return null;
  const baseSx = {
    ml: 0.25,
    fontSize: '0.72rem',
    lineHeight: 1,
    fontWeight: 700 as const,
  };
  if (trend === 'improving') {
    return <Box component="span" sx={{ ...baseSx, color: 'success.main' }} aria-hidden>▲</Box>;
  }
  if (trend === 'declining') {
    return <Box component="span" sx={{ ...baseSx, color: 'error.main' }} aria-hidden>▼</Box>;
  }
  return <Box component="span" sx={{ ...baseSx, color: 'text.secondary' }} aria-hidden>→</Box>;
}

export function GtoDrillRow({
  drill,
  isArchived = false,
  onOpenDrill,
  onOpenChart,
  onLogResult,
  onEdit,
  onClone,
  onDelete,
  onArchive,
  onUnarchive,
  onCopySuccess,
  onCopyError,
}: GtoDrillRowProps) {
  const compact = useCompactMode();
  const [archiveAnchor, setArchiveAnchor] = useState<HTMLElement | null>(null);

  const handleCopyName = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const text = drill.name.trim();
      if (!text) {
        onCopyError?.('Nothing to copy');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        onCopySuccess?.();
      } catch {
        onCopyError?.('Could not copy to clipboard');
      }
    },
    [drill.name, onCopySuccess, onCopyError]
  );

  const handleArchiveClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setArchiveAnchor(e.currentTarget);
  };

  const handleArchiveConfirm = () => {
    setArchiveAnchor(null);
    onArchive?.(drill._id);
  };

  const summaryLine = formatDrillSummary(drill);
  const perfPrimary = drillListPerformancePrimary(drill.recentResultsSummary);
  const perfSecondary = drillListPerformanceSecondary(drill.recentResultsSummary);
  const perfLabel = drillListPerformanceLabel(drill.recentResultsSummary);
  const trend = drillListTrend(drill.recentResultsSummary);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: 1,
        width: '100%',
        opacity: isArchived ? 0.72 : 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: compact ? 0.5 : 1,
          p: compact ? 0.5 : 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.375,
              minWidth: 0,
              mb: 0.25,
            }}
          >
            <Typography
              component="button"
              type="button"
              variant={compact ? 'body2' : 'subtitle2'}
              title={drill.name}
              onClick={() => onOpenDrill(drill)}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                bgcolor: 'transparent',
                color: 'primary.main',
                p: 0,
                textAlign: 'left',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {drill.name}
            </Typography>
            {isArchived && (
              <Chip
                label="Archived"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  flexShrink: 0,
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
                variant="outlined"
              />
            )}
            <Tooltip title="Copy name for Lucid">
              <IconButton
                size="small"
                aria-label="Copy drill name"
                onClick={(e) => void handleCopyName(e)}
                sx={{ p: 0.25, flexShrink: 0 }}
              >
                <ContentCopyIcon sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Tooltip>
            <Box
              component="span"
              sx={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: '0.68rem',
                lineHeight: 1.35,
                color: 'text.secondary',
              }}
              title={`${perfLabel}${trend !== null ? ` (${trend === 'flat' ? 'flat' : trend})` : ''}`}
            >
              · {perfPrimary}
              <Typography
                component="span"
                variant="caption"
                sx={{
                  ml: 0.375,
                  fontSize: '0.6rem',
                  color: 'text.disabled',
                  fontWeight: 400,
                }}
              >
                · {perfSecondary}
              </Typography>
              <TrendGlyph trend={trend} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: 0.25 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {summaryLine}
            </Typography>
            <GtoDrillDescriptionButton description={drill.description} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <IconButton
              size="small"
              aria-label={`Chart — ${drill.name}`}
              onClick={() => onOpenChart(drill)}
              sx={{ p: 0.375 }}
            >
              <ShowChartIcon fontSize="small" />
            </IconButton>
            <Button size="small" variant="outlined" onClick={() => onLogResult(drill._id)}>
              Log Result
            </Button>
          </Box>
          <Box>
            <IconButton size="small" onClick={() => onEdit(drill)} aria-label="Edit drill" sx={{ p: 0.25 }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onClone(drill)}
              aria-label={`Clone drill — ${drill.name}`}
              title="Clone drill"
              sx={{ p: 0.25 }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            {isArchived ? (
              <Tooltip title="Restore to active drills">
                <IconButton
                  size="small"
                  onClick={() => onUnarchive?.(drill._id)}
                  aria-label="Unarchive drill"
                  sx={{ p: 0.25 }}
                >
                  <UnarchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Archive drill">
                <IconButton
                  size="small"
                  onClick={handleArchiveClick}
                  aria-label="Archive drill"
                  sx={{ p: 0.25 }}
                >
                  <ArchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              onClick={() => onDelete(drill._id)}
              aria-label="Delete drill"
              sx={{ p: 0.25 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Popover
        open={Boolean(archiveAnchor)}
        anchorEl={archiveAnchor}
        onClose={() => setArchiveAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 1.5, maxWidth: 260 }}>
          <Typography variant="body2" sx={{ mb: 1.25 }}>
            Archive this drill? It won&apos;t appear in your active list or tier progress.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
            <Button size="small" onClick={() => setArchiveAnchor(null)}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleArchiveConfirm}>
              Confirm
            </Button>
          </Box>
        </Box>
      </Popover>
    </Paper>
  );
}
