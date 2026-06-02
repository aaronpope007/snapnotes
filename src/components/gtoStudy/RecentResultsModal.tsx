import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { ConfirmDialog } from '../ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { deleteGtoDrillResult, fetchRecentGtoDrillResults } from '../../api/gtoDrills';
import type { GtoDrillResult, GtoFormat, GtoRecentDrillResult } from '../../types/gtoStudy';
import {
  formatAccuracyPercent,
  formatEvDiff,
  formatHandsPlayed,
  formatScorePerHand,
} from '../../utils/gtoStudyUtils';
import { getApiErrorMessage } from '../../utils/apiError';

function formatRecentDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface RecentResultsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  format: GtoFormat;
  refreshKey?: string;
  onEditResult: (drillId: string, result: GtoDrillResult, drillName: string) => void;
  onOpenDrillHistory: (drillId: string) => void;
  onLoadError?: (msg: string) => void;
  onDeleteSuccess?: (msg: string) => void;
  onDeleteError?: (msg: string) => void;
  onResultsChanged?: () => void;
}

export function RecentResultsModal({
  open,
  onClose,
  userId,
  format,
  refreshKey,
  onEditResult,
  onOpenDrillHistory,
  onLoadError,
  onDeleteSuccess,
  onDeleteError,
  onResultsChanged,
}: RecentResultsModalProps) {
  const [rows, setRows] = useState<GtoRecentDrillResult[]>([]);
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

  const loadRecent = useCallback(async () => {
    if (!userId?.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchRecentGtoDrillResults(userId, format);
      setRows(data ?? []);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load recent results');
      setLoadError(msg);
      onLoadError?.(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId, format, onLoadError]);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    void loadRecent();
  }, [open, loadRecent, refreshKey]);

  const requestDelete = (row: GtoRecentDrillResult) => {
    openDeleteConfirm(async () => {
      if (!userId?.trim()) return;
      setDeleting(true);
      try {
        await deleteGtoDrillResult(row.drillId, row._id, userId);
        setRows((prev) => prev.filter((r) => r._id !== row._id));
        onResultsChanged?.();
        onDeleteSuccess?.('Result deleted');
      } catch (err) {
        onDeleteError?.(getApiErrorMessage(err, 'Failed to delete result'));
      } finally {
        setDeleting(false);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>
          Recent results
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {format === 'HU' ? 'Heads-Up' : '8max Ring'} · newest first
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : loadError ? (
            <Typography variant="body2" color="error">
              {loadError}
            </Typography>
          ) : rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No results logged yet for this format.
            </Typography>
          ) : (
            <Table size="small" sx={{ '& td, & th': { py: 0.5, px: 0.75, fontSize: '0.75rem' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Drill</TableCell>
                  <TableCell align="right">Hands</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell align="right">Score/hand</TableCell>
                  <TableCell align="right">EV Diff</TableCell>
                  <TableCell align="center" sx={{ width: 88 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatRecentDate(row.date)}</TableCell>
                    <TableCell sx={{ maxWidth: 140 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        <Typography
                          component="button"
                          type="button"
                          variant="caption"
                          onClick={() => onOpenDrillHistory(row.drillId)}
                          title={row.drillName}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            textAlign: 'left',
                            border: 'none',
                            bgcolor: 'transparent',
                            color: 'primary.main',
                            cursor: 'pointer',
                            p: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 'inherit',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {row.drillName}
                        </Typography>
                        {row.drillArchived && (
                          <Chip
                            label="Archived"
                            size="small"
                            sx={{ height: 16, fontSize: '0.58rem', flexShrink: 0 }}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatHandsPlayed(row.handsPlayed)}</TableCell>
                    <TableCell align="right">{formatAccuracyPercent(row.accuracy)}</TableCell>
                    <TableCell align="right">
                      {formatScorePerHand(row.score, row.handsPlayed)}
                    </TableCell>
                    <TableCell align="right">{formatEvDiff(row.evDiff)}</TableCell>
                    <TableCell align="center" sx={{ px: 0.25, whiteSpace: 'nowrap' }}>
                      <Tooltip title="Drill history">
                        <IconButton
                          size="small"
                          aria-label="Open drill history"
                          onClick={() => onOpenDrillHistory(row.drillId)}
                        >
                          <ShowChartIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit result">
                        <IconButton
                          size="small"
                          aria-label="Edit result"
                          disabled={deleting}
                          onClick={() => onEditResult(row.drillId, row, row.drillName)}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete result">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Delete result"
                            disabled={deleting}
                            onClick={() => requestDelete(row)}
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
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        {...deleteConfirmOptions}
      />
    </>
  );
}
