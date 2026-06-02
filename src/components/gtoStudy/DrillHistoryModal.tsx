import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ConfirmDialog } from '../ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { deleteGtoDrillResult, fetchGtoDrillResults } from '../../api/gtoDrills';
import { GTO_POT_TYPE_LABELS, getDefaultStreet } from '../../constants/gtoStudy';
import { GtoDrillEvChart } from './GtoDrillEvChart';
import type { GtoDrill, GtoDrillResult, GtoPotType } from '../../types/gtoStudy';
import type { GtoTierProgressRow } from '../../types/gtoTierProgress';
import {
  formatAccuracyPercent,
  formatEvDiff,
  formatHandsPlayed,
  formatScorePerHand,
} from '../../utils/gtoStudyUtils';
import { getApiErrorMessage } from '../../utils/apiError';

export type DrillHistoryDrill = GtoDrill | GtoTierProgressRow;

export function isGtoDrill(drill: DrillHistoryDrill): drill is GtoDrill {
  return '_id' in drill;
}

export function getHistoryDrillId(drill: DrillHistoryDrill): string {
  return isGtoDrill(drill) ? drill._id : drill.drillId;
}

export function getHistoryDrillName(drill: DrillHistoryDrill): string {
  return drill.name;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatHistorySubtitle(drill: DrillHistoryDrill, solverOverride?: string): string {
  if (isGtoDrill(drill)) {
    const street = drill.street ?? getDefaultStreet(drill.handStart);
    return [drill.stack, GTO_POT_TYPE_LABELS[drill.potType], street, drill.solver].join(' · ');
  }
  const potLabel =
    drill.potType in GTO_POT_TYPE_LABELS
      ? GTO_POT_TYPE_LABELS[drill.potType as GtoPotType]
      : drill.potType;
  const solver = solverOverride;
  const parts = [drill.stack, potLabel, drill.street];
  if (solver) parts.push(solver);
  return parts.join(' · ');
}

function displayOrDash(value: string): string {
  return value.trim() === '' ? '—' : value;
}

interface DrillHistoryModalProps {
  open: boolean;
  onClose: () => void;
  drill: DrillHistoryDrill | null;
  userId: string | null;
  drillSolvers?: Record<string, string>;
  onLogResult: (drill: DrillHistoryDrill) => void;
  onLoadError?: (msg: string) => void;
  onDeleteSuccess?: (msg: string) => void;
  onDeleteError?: (msg: string) => void;
  onResultsChanged?: () => void;
  onEditResult?: (result: GtoDrillResult) => void;
}

type HistoryTab = 'chart' | 'results';

export function DrillHistoryModal({
  open,
  onClose,
  drill,
  userId,
  drillSolvers,
  onLogResult,
  onLoadError,
  onDeleteSuccess,
  onDeleteError,
  onResultsChanged,
  onEditResult,
}: DrillHistoryModalProps) {
  const [tab, setTab] = useState<HistoryTab>('chart');
  const [results, setResults] = useState<GtoDrillResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    confirmOpen: deleteConfirmOpen,
    openConfirm: openDeleteConfirm,
    closeConfirm: closeDeleteConfirm,
    handleConfirm: handleDeleteConfirm,
    confirmOptions: deleteConfirmOptions,
  } = useConfirm({
    title: 'Delete result?',
    message: 'This result will be permanently removed.',
    confirmText: 'Delete',
    confirmDanger: true,
  });

  const drillId = drill ? getHistoryDrillId(drill) : null;
  const solver =
    drill && isGtoDrill(drill) ? drill.solver : drillId ? drillSolvers?.[drillId] : undefined;

  useEffect(() => {
    if (!open) {
      setTab('chart');
      setResults([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !drillId || !userId?.trim()) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setResults([]);

    void (async () => {
      try {
        const data = await fetchGtoDrillResults(drillId, userId);
        if (!cancelled) setResults(data ?? []);
      } catch (err) {
        if (cancelled) return;
        const msg = getApiErrorMessage(err, 'Failed to load drill history');
        setLoadError(msg);
        onLoadError?.(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, drillId, userId, onLoadError]);

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [results]
  );

  const requestDeleteResult = (resultId: string) => {
    openDeleteConfirm(async () => {
      if (!drillId || !userId?.trim()) return;
      setDeleting(true);
      try {
        await deleteGtoDrillResult(drillId, resultId, userId);
        setResults((prev) => prev.filter((r) => r._id !== resultId));
        onResultsChanged?.();
        onDeleteSuccess?.('Result deleted');
      } catch (err) {
        onDeleteError?.(getApiErrorMessage(err, 'Failed to delete result'));
      } finally {
        setDeleting(false);
      }
    });
  };

  if (!drill) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          pr: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="div" sx={{ lineHeight: 1.3 }}>
            {getHistoryDrillName(drill)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {formatHistorySubtitle(drill, solver)}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={() => onLogResult(drill)}
          sx={{ flexShrink: 0, mt: 0.25 }}
        >
          Log Result
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v: HistoryTab) => setTab(v)}
          sx={{ minHeight: 36, mb: 1, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Chart" value="chart" sx={{ minHeight: 36, py: 0.5 }} />
          <Tab label="Results" value="results" sx={{ minHeight: 36, py: 0.5 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : loadError ? (
          <Typography variant="body2" color="error">
            {loadError}
          </Typography>
        ) : tab === 'chart' ? (
          sortedResults.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No data yet
            </Typography>
          ) : (
            <GtoDrillEvChart results={sortedResults} />
          )
        ) : sortedResults.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No results logged yet.
          </Typography>
        ) : (
          <Table size="small" sx={{ '& td, & th': { py: 0.5, px: 0.75, fontSize: '0.75rem' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Hands</TableCell>
                <TableCell align="right">Accuracy</TableCell>
                <TableCell align="right">Score/hand</TableCell>
                <TableCell align="right">EV Diff</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="center" sx={{ width: onEditResult ? 72 : 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedResults.map((result) => (
                <TableRow key={result._id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatHistoryDate(result.date)}</TableCell>
                  <TableCell align="right">{formatHandsPlayed(result.handsPlayed)}</TableCell>
                  <TableCell align="right">{formatAccuracyPercent(result.accuracy)}</TableCell>
                  <TableCell align="right">
                    {formatScorePerHand(result.score, result.handsPlayed)}
                  </TableCell>
                  <TableCell align="right">{formatEvDiff(result.evDiff)}</TableCell>
                  <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayOrDash(result.notes?.trim() ?? '')}
                  </TableCell>
                  <TableCell align="center" sx={{ width: onEditResult ? 72 : 40, px: 0.25, whiteSpace: 'nowrap' }}>
                    {onEditResult && (
                      <Tooltip title="Edit result">
                        <IconButton
                          size="small"
                          aria-label="Edit result"
                          disabled={deleting}
                          onClick={() => onEditResult(result)}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete result">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Delete result"
                          disabled={deleting}
                          onClick={() => requestDeleteResult(result._id)}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        {...deleteConfirmOptions}
      />
    </Dialog>
  );
}
