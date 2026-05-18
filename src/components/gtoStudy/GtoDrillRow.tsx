import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useCompactMode } from '../../context/CompactModeContext';
import { formatDrillSummary } from '../../constants/gtoStudy';
import {
  drillListPerformanceLabel,
  drillListPerformancePrimary,
  drillListPerformanceSecondary,
  drillListTrend,
} from '../../utils/drillListSummary';
import type { GtoDrill } from '../../types/gtoStudy';

interface GtoDrillRowProps {
  drill: GtoDrill;
  onOpenDrill: (drill: GtoDrill) => void;
  onOpenChart: (drill: GtoDrill) => void;
  onLogResult: (drillId: string) => void;
  onEdit: (drill: GtoDrill) => void;
  onDelete: (drillId: string) => void;
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
  onOpenDrill,
  onOpenChart,
  onLogResult,
  onEdit,
  onDelete,
}: GtoDrillRowProps) {
  const compact = useCompactMode();
  const summaryLine = formatDrillSummary(drill);
  const perfPrimary = drillListPerformancePrimary(drill.recentResultsSummary);
  const perfSecondary = drillListPerformanceSecondary(drill.recentResultsSummary);
  const perfLabel = drillListPerformanceLabel(drill.recentResultsSummary);
  const trend = drillListTrend(drill.recentResultsSummary);

  return (
    <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 1, width: '100%' }}>
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {summaryLine}
          </Typography>
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
              onClick={() => onDelete(drill._id)}
              aria-label="Delete drill"
              sx={{ p: 0.25 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
