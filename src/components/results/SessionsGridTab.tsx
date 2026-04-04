import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { SessionResult, SessionResultCreate } from '../../types/results';
import { EditSessionModal } from './EditSessionModal';
import { computeHandRangeStats, getLatestHandCounterEnd } from '../../utils/handRangeStats';

interface SessionsGridTabProps {
  sessions: SessionResult[];
  /**
   * Optional full session list used only for bankroll carry-forward so that
   * filtered views (HU-only / Ring-only) still infer Account start correctly
   * when a session is missing an explicit startBankroll.
   */
  allSessionsForBankroll?: SessionResult[];
  loading: boolean;
  onUpdate: (id: string, updates: Partial<SessionResultCreate>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  const sign = n < 0 ? '−' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function sanitizeHandCountInput(val: string): string {
  return val.replace(/\D/g, '');
}

export function SessionsGridTab({ sessions, allSessionsForBankroll, loading, onUpdate, onDelete }: SessionsGridTabProps) {
  const [editSession, setEditSession] = useState<SessionResult | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [handRangeFrom, setHandRangeFrom] = useState('');
  const [handRangeTo, setHandRangeTo] = useState('');
  const [handRangeError, setHandRangeError] = useState<string | null>(null);
  const [handRangeStats, setHandRangeStats] = useState<ReturnType<typeof computeHandRangeStats> | null>(null);

  const bankrollMetaById = useMemo(() => {
    const base = allSessionsForBankroll ?? sessions;
    const sorted = [...base].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const byId = new Map<string, { accountStart: number | null; accountEnd: number | null; sessionNet: number | null }>();
    let prevEndBankroll: number | null = null;
    for (const s of sorted) {
      const accountStart = s.startBankroll ?? prevEndBankroll;
      const accountEnd = s.endBankroll ?? null;
      const sessionNet =
        accountStart != null && accountEnd != null ? accountEnd - accountStart : (s.dailyNet ?? null);
      byId.set(s._id, { accountStart, accountEnd, sessionNet });
      prevEndBankroll = accountEnd;
    }
    return byId;
  }, [allSessionsForBankroll, sessions]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteId, onDelete]);

  const gridMeta = useMemo(() => {
    const byId = new Map<string, {
      handsStart: number | null;
      handsEnd: number | null;
      accountStart: number | null;
      accountEnd: number | null;
      sessionNet: number | null;
      handsPerHour: number | null;
    }>();
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let cumulativeHands = 0;
    for (const s of sorted) {
      const handsStart = s.handsStartedAt ?? null;
      const handsEnd = s.handsEndedAt ?? null;
      const h = s.hands ?? 0;
      const displayHandsStart = handsStart ?? cumulativeHands;
      const displayHandsEnd = handsEnd ?? cumulativeHands + h;
      cumulativeHands = handsEnd ?? (cumulativeHands + h);
      const bankrollMeta = bankrollMetaById.get(s._id);
      const accountStart = bankrollMeta?.accountStart ?? s.startBankroll ?? null;
      const accountEnd = bankrollMeta?.accountEnd ?? s.endBankroll ?? null;
      const sessionNet =
        bankrollMeta?.sessionNet ?? (accountStart != null && accountEnd != null ? accountEnd - accountStart : (s.dailyNet ?? null));
      const totalTime = s.totalTime ?? 0;
      const handsPerHour = totalTime > 0 && h > 0 ? Math.round(h / totalTime) : null;
      byId.set(s._id, {
        handsStart: displayHandsStart,
        handsEnd: displayHandsEnd,
        accountStart,
        accountEnd,
        sessionNet,
        handsPerHour,
      });
    }
    return byId;
  }, [sessions, bankrollMetaById]);

  const latestHandEnd = useMemo(
    () => getLatestHandCounterEnd(allSessionsForBankroll ?? sessions),
    [allSessionsForBankroll, sessions]
  );

  const handleHandRangeCalculate = useCallback(() => {
    setHandRangeError(null);
    const fromStr = handRangeFrom.trim();
    const toStr = handRangeTo.trim();
    if (!fromStr || !toStr) {
      setHandRangeError('Enter both from and to hand numbers.');
      setHandRangeStats(null);
      return;
    }
    const fromN = parseInt(fromStr.replace(/,/g, ''), 10);
    const toN = parseInt(toStr.replace(/,/g, ''), 10);
    if (Number.isNaN(fromN) || Number.isNaN(toN)) {
      setHandRangeError('Use whole numbers only.');
      setHandRangeStats(null);
      return;
    }
    if (fromN > toN) {
      setHandRangeError('"From" must be less than or equal to "to".');
      setHandRangeStats(null);
      return;
    }
    setHandRangeStats(
      computeHandRangeStats(sessions, fromN, toN, allSessionsForBankroll ?? sessions)
    );
  }, [handRangeFrom, handRangeTo, sessions, allSessionsForBankroll]);

  const columns = useMemo<GridColDef<SessionResult>[]>(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        flex: 1,
        minWidth: 100,
        sortComparator: (_v1, _v2, p1, p2) => {
          const r1 = p1.api.getRow(p1.id) as SessionResult;
          const r2 = p2.api.getRow(p2.id) as SessionResult;
          const d1 = new Date(r1.date).toISOString().slice(0, 10);
          const d2 = new Date(r2.date).toISOString().slice(0, 10);
          return d1.localeCompare(d2);
        },
        valueFormatter: (value) => {
          const d = value as string | null;
          if (!d) return '—';
          return new Date(d).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        },
      },
      {
        field: 'totalTime',
        headerName: 'Time (hrs)',
        width: 90,
        valueFormatter: (value) => {
          const n = value as number | null;
          if (n === null || n === undefined) return '—';
          return Number(n).toFixed(2);
        },
      },
      {
        field: 'startTime',
        headerName: 'Time start',
        width: 90,
        sortComparator: (_v1, _v2, p1, p2) => {
          const r1 = p1.api.getRow(p1.id) as SessionResult;
          const r2 = p2.api.getRow(p2.id) as SessionResult;
          const t1 = r1.startTime ? new Date(r1.startTime).getTime() : 0;
          const t2 = r2.startTime ? new Date(r2.startTime).getTime() : 0;
          return t1 - t2;
        },
        valueFormatter: (value) => {
          const s = value as string | null;
          if (!s) return '—';
          try {
            return new Date(s).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          } catch {
            return '—';
          }
        },
      },
      {
        field: 'endTime',
        headerName: 'Time end',
        width: 90,
        valueFormatter: (value) => {
          const s = value as string | null;
          if (!s) return '—';
          try {
            return new Date(s).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          } catch {
            return '—';
          }
        },
      },
      {
        field: 'handsStart',
        headerName: 'Hands start',
        width: 100,
        valueGetter: (_, row) => gridMeta.get(row._id)?.handsStart ?? null,
        valueFormatter: (value) =>
          value != null ? Number(value).toLocaleString() : '—',
      },
      {
        field: 'hands',
        headerName: 'Hands',
        width: 80,
        valueFormatter: (value) => {
          const n = value as number | null;
          if (n === null || n === undefined) return '—';
          return String(n);
        },
      },
      {
        field: 'handsEnd',
        headerName: 'Hands end',
        width: 100,
        valueGetter: (_, row) => gridMeta.get(row._id)?.handsEnd ?? null,
        valueFormatter: (value) =>
          value != null ? Number(value).toLocaleString() : '—',
      },
      {
        field: 'handsPerHour',
        headerName: 'Hands/hr',
        width: 85,
        valueGetter: (_, row) => gridMeta.get(row._id)?.handsPerHour ?? null,
        valueFormatter: (value) =>
          value != null ? String(value) : '—',
      },
      {
        field: 'accountStart',
        headerName: 'Account start',
        width: 110,
        valueGetter: (_, row) => gridMeta.get(row._id)?.accountStart ?? null,
        valueFormatter: (value) =>
          value != null ? formatCurrency(value) : '—',
      },
      {
        field: 'accountEnd',
        headerName: 'Account end',
        width: 110,
        valueGetter: (_, row) => gridMeta.get(row._id)?.accountEnd ?? null,
        valueFormatter: (value) =>
          value != null ? formatCurrency(value) : '—',
      },
      {
        field: 'sessionNet',
        headerName: 'Session Net',
        width: 95,
        valueGetter: (_, row) => gridMeta.get(row._id)?.sessionNet ?? null,
        valueFormatter: (value) => formatCurrency(value as number | null),
        cellClassName: (params) => {
          const n = params.value as number | null;
          if (n === null || n === undefined) return '';
          return n >= 0 ? 'net-positive' : 'net-negative';
        },
      },
      {
        field: 'profitPerHand',
        headerName: '$/hand',
        width: 80,
        valueGetter: (_, row) => {
          const net = gridMeta.get(row._id)?.sessionNet ?? row.dailyNet ?? null;
          const hands = row.hands ?? 0;
          if (net == null || hands <= 0) return null;
          return Number(net) / hands;
        },
        valueFormatter: (value) => {
          if (value === null || value === undefined) return '—';
          const n = Number(value);
          if (Number.isNaN(n)) return '—';
          const sign = n < 0 ? '−' : '';
          return `${sign}$${Math.abs(n).toFixed(2)}`;
        },
        cellClassName: (params) => {
          const n = params.value as number | null;
          if (n === null || n === undefined) return '';
          return n >= 0 ? 'net-positive' : 'net-negative';
        },
      },
      {
        field: 'rating',
        headerName: 'Rating',
        width: 70,
        valueFormatter: (value) => (value as string) || '—',
      },
      {
        field: 'stake',
        headerName: 'Stake',
        width: 75,
        valueFormatter: (value) => {
          const n = value as number | null;
          if (n === null || n === undefined) return '—';
          return String(n);
        },
      },
      {
        field: 'gameType',
        headerName: 'Game',
        width: 70,
        valueFormatter: (value) => (value as string) || 'NLHE',
      },
      {
        field: 'format',
        headerName: 'Format',
        width: 85,
        valueGetter: (_, row) => {
          const ring = row.isRing === true ? 'Ring' : '';
          const hu = row.isHU === true ? 'HU' : '';
          if (ring && hu) return 'Ring, HU';
          return ring || hu || '—';
        },
      },
      {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <IconButton
              size="small"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setEditSession(params.row as SessionResult);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Delete"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(params.row._id);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [gridMeta]
  );

  const rows = useMemo(() => {
    const dateKey = (s: SessionResult) => new Date(s.date).toISOString().slice(0, 10);
    const timeKey = (s: SessionResult) =>
      (s.endTime || s.startTime) ? new Date(s.endTime || s.startTime!).getTime() : 0;
    const sorted = [...sessions].sort((a, b) => {
      const dA = dateKey(a);
      const dB = dateKey(b);
      if (dB !== dA) return dB.localeCompare(dA);
      return timeKey(b) - timeKey(a);
    });
    return sorted.map((s) => ({ ...s, id: s._id }));
  }, [sessions]);

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Stats for a hand range
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          From / to are inclusive hand counters (same as the site and the grid). Net profit is split by overlap when a
          session only partly falls in the range.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            label="From hand #"
            value={handRangeFrom}
            onChange={(e) => setHandRangeFrom(sanitizeHandCountInput(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleHandRangeCalculate();
              }
            }}
            inputProps={{ inputMode: 'numeric' }}
            sx={{ width: 120 }}
          />
          <TextField
            size="small"
            label="To hand #"
            value={handRangeTo}
            onChange={(e) => setHandRangeTo(sanitizeHandCountInput(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleHandRangeCalculate();
              }
            }}
            inputProps={{ inputMode: 'numeric' }}
            sx={{ width: 120 }}
          />
          <Button size="small" variant="contained" onClick={handleHandRangeCalculate} sx={{ mt: 0.5 }}>
            Calculate
          </Button>
        </Box>
        {latestHandEnd != null && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Highest hands-end counter in your log (approx.): {latestHandEnd.toLocaleString()}
          </Typography>
        )}
        {handRangeError && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
            {handRangeError}
          </Typography>
        )}
        {handRangeStats && !handRangeError && (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body2">
              <Box component="span" color="text.secondary">
                Net in range:{' '}
              </Box>
              <Box
                component="span"
                sx={{ fontWeight: 600, color: handRangeStats.totalNet >= 0 ? 'success.main' : 'error.main' }}
              >
                {formatCurrency(handRangeStats.totalNet)}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hands in range: {handRangeStats.handsInRange.toLocaleString()}
              {handRangeStats.profitPerHand != null && (
                <>
                  {' · '}
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {formatCurrency(handRangeStats.profitPerHand)}/hand
                  </Box>
                </>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {handRangeStats.sessionsTouching} session{handRangeStats.sessionsTouching !== 1 ? 's' : ''} touched this
              range
            </Typography>
          </Box>
        )}
      </Paper>
      <Box
        sx={{
          width: '100%',
          minHeight: 320,
          '& .net-positive': { color: 'success.main' },
          '& .net-negative': { color: 'error.main' },
          '& .MuiDataGrid-cell': { fontSize: '0.8rem' },
          '& .MuiDataGrid-columnHeaders': { fontSize: '0.75rem' },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          initialState={{
            sorting: {
              sortModel: [
                { field: 'date', sort: 'desc' },
                { field: 'endTime', sort: 'desc' },
              ],
            },
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
        />
      </Box>
      <EditSessionModal
        open={!!editSession}
        onClose={() => setEditSession(null)}
        session={editSession}
        onSave={onUpdate}
      />
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle>Delete session?</DialogTitle>
        <DialogContent>
          <DialogContentText>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
