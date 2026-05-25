import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { GtoStudyTierHelp } from './GtoStudyTierHelp';
import type { GtoTierProgressRow } from '../../types/gtoTierProgress';
import {
  computeNextReviewDate,
  drillStatus,
  formatNextReviewDisplay,
  groupRowsByTier,
  progressBarColor,
  scoreTrendDirection,
  tierAverageAccuracy,
  tierAverageScorePerHand,
  tierLoggedCount,
  type DrillStatusKind,
} from '../../utils/gtoTierProgress';
import { formatAccuracyAcc, formatScorePerHand } from '../../utils/gtoStudyUtils';

const drillNameLinkSx = {
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'text.primary',
  '&:hover': { textDecoration: 'underline' },
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 160,
  textAlign: 'left' as const,
};

interface TierProgressPanelProps {
  rows: GtoTierProgressRow[];
  loading?: boolean;
  error?: string | null;
  onLogResult: (drillId: string) => void;
}

function formatLatestDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusChip(status: DrillStatusKind) {
  switch (status) {
    case 'not_started':
      return (
        <Chip size="small" label="🔴 Not started" color="error" variant="outlined" sx={{ fontSize: '0.7rem' }} />
      );
    case 'in_progress':
      return (
        <Chip size="small" label="🟡 In progress" color="warning" variant="outlined" sx={{ fontSize: '0.7rem' }} />
      );
    case 'solid':
      return (
        <Chip size="small" label="🟢 Solid" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
      );
  }
}

function TrendCell({ row }: { row: GtoTierProgressRow }) {
  const theme = useTheme();
  const trend = scoreTrendDirection(row);
  if (trend == null) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }
  const color =
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.secondary;
  const symbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  return (
    <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
      {symbol}
    </Typography>
  );
}

function NextReviewCell({ row }: { row: GtoTierProgressRow }) {
  const theme = useTheme();
  const { text, overdue } = formatNextReviewDisplay(computeNextReviewDate(row));
  if (text === '—') {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Typography
      variant="caption"
      sx={{ color: overdue ? theme.palette.warning.main : 'text.secondary' }}
    >
      {text}
    </Typography>
  );
}

const STACK_GROUPS = ['100bb', '200bb'] as const;

function TierDrillTableRows({
  drills,
  onLogResult,
}: {
  drills: GtoTierProgressRow[];
  onLogResult: (drillId: string) => void;
}) {
  return (
    <>
      {drills.map((row) => (
        <TableRow key={row.drillId}>
          <TableCell sx={{ maxWidth: 160 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => onLogResult(row.drillId)}
              title={row.name}
              sx={drillNameLinkSx}
            >
              {row.name}
            </Link>
          </TableCell>
          <TableCell align="right">{row.timesLogged}</TableCell>
          <TableCell align="right">{formatAccuracyAcc(row.latestAccuracy ?? undefined)}</TableCell>
          <TableCell align="right">
            {formatScorePerHand(row.latestScore ?? undefined, row.latestHandsPlayed ?? undefined)}
          </TableCell>
          <TableCell align="center">
            <TrendCell row={row} />
          </TableCell>
          <TableCell align="right">{formatLatestDate(row.latestDate)}</TableCell>
          <TableCell align="right">
            <NextReviewCell row={row} />
          </TableCell>
          <TableCell align="center">{statusChip(drillStatus(row))}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function TierDrillTable({
  drills,
  onLogResult,
}: {
  drills: GtoTierProgressRow[];
  onLogResult: (drillId: string) => void;
}) {
  if (drills.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No drills in this tier.
      </Typography>
    );
  }

  const stackSections = STACK_GROUPS.map((stack) => ({
    stack,
    drills: drills.filter((d) => d.stack === stack),
  })).filter((s) => s.drills.length > 0);

  return (
    <Box>
      {stackSections.map((section, idx) => (
        <Box key={section.stack}>
          {idx > 0 && <Divider sx={{ my: 1 }} />}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
          >
            {section.stack}
          </Typography>
          <Table size="small" sx={{ '& td, & th': { py: 0.5, px: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Drill</TableCell>
                <TableCell align="right">Logs</TableCell>
                <TableCell align="right">Latest acc</TableCell>
                <TableCell align="right">Score/hand</TableCell>
                <TableCell align="center">Trend</TableCell>
                <TableCell align="right">Latest date</TableCell>
                <TableCell align="right">Next review</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TierDrillTableRows drills={section.drills} onLogResult={onLogResult} />
            </TableBody>
          </Table>
        </Box>
      ))}
    </Box>
  );
}

function TierSection({
  label,
  description,
  drills,
  onLogResult,
  defaultExpanded,
}: {
  label: string;
  description: string;
  drills: GtoTierProgressRow[];
  onLogResult: (drillId: string) => void;
  defaultExpanded?: boolean;
}) {
  const theme = useTheme();
  const logged = tierLoggedCount(drills);
  const total = drills.length;
  const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
  const avgAcc = tierAverageAccuracy(drills);
  const avgScorePerHand = tierAverageScorePerHand(drills);
  const barColor = progressBarColor(avgAcc, theme.palette);

  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={defaultExpanded}
      sx={{
        bgcolor: 'transparent',
        border: 1,
        borderColor: 'divider',
        '&:before': { display: 'none' },
        '& + &': { mt: 0.75 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ minHeight: 40, py: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {description}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', mr: 1 }}>
          {logged}/{total} logged
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 1 }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: barColor },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Avg accuracy:{' '}
            <Box component="span" sx={{ color: 'text.primary' }}>
              {avgAcc != null ? `${Math.round(avgAcc * 10) / 10}%` : '—'}
            </Box>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg score/hand:{' '}
            <Box component="span" sx={{ color: 'text.primary' }}>
              {avgScorePerHand != null ? formatScorePerHand(avgScorePerHand, 1) : '—'}
            </Box>
          </Typography>
        </Box>
        <Accordion disableGutters elevation={0} sx={{ bgcolor: 'action.hover', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ minHeight: 32 }}>
            <Typography variant="caption">Drill breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <TierDrillTable drills={drills} onLogResult={onLogResult} />
          </AccordionDetails>
        </Accordion>
      </AccordionDetails>
    </Accordion>
  );
}

export function TierProgressPanel({ rows, loading, error, onLogResult }: TierProgressPanelProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const grouped = useMemo(() => groupRowsByTier(rows), [rows]);

  if (rows.length === 0 && !loading && !error) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2">Tier progress</Typography>
          <GtoStudyTierHelp ariaLabel="What are study tiers?" />
        </Box>
        <IconButton
          size="small"
          onClick={() => setPanelOpen((o) => !o)}
          aria-label={panelOpen ? 'Collapse tier progress' : 'Expand tier progress'}
        >
          {panelOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={panelOpen}>
        {loading && rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Loading tier progress…
          </Typography>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No drills yet.
          </Typography>
        ) : (
          <Box>
            {grouped.tiers.map(({ def, drills }) => (
              <TierSection
                key={def.tier}
                label={def.label}
                description={def.description}
                drills={drills}
                onLogResult={onLogResult}
                defaultExpanded={def.tier === 1}
              />
            ))}
            {grouped.uncategorized.length > 0 && (
              <TierSection
                label="Uncategorized"
                description="No study tier set on the drill (edit a drill to assign Tier 1–3)"
                drills={grouped.uncategorized}
                onLogResult={onLogResult}
              />
            )}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
