import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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

interface SessionsGridTabProps {
  sessions: SessionResult[];
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

export function SessionsGridTab({ sessions, loading, onUpdate, onDelete }: SessionsGridTabProps) {
  const [editSession, setEditSession] = useState<SessionResult | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      handsPerHour: number | null;
    }>();
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let cumulativeHands = 0;
    let prevEndBankroll: number | null = null;
    for (const s of sorted) {
      const handsStart = s.handsStartedAt ?? null;
      const handsEnd = s.handsEndedAt ?? null;
      const h = s.hands ?? 0;
      const displayHandsStart = handsStart ?? cumulativeHands;
      const displayHandsEnd = handsEnd ?? cumulativeHands + h;
      cumulativeHands = handsEnd ?? (cumulativeHands + h);
      const accountEnd = s.endBankroll ?? null;
      const totalTime = s.totalTime ?? 0;
      const handsPerHour = totalTime > 0 && h > 0 ? Math.round(h / totalTime) : null;
      byId.set(s._id, {
        handsStart: displayHandsStart,
        handsEnd: displayHandsEnd,
        accountStart: prevEndBankroll,
        accountEnd,
        handsPerHour,
      });
      prevEndBankroll = accountEnd;
    }
    return byId;
  }, [sessions]);

  const columns = useMemo<GridColDef<SessionResult>[]>(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        flex: 1,
        minWidth: 100,
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
        field: 'dailyNet',
        headerName: 'Daily Net',
        width: 95,
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
          const net = row.dailyNet ?? null;
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

  const rows = useMemo(
    () =>
      sessions.map((s) => ({
        ...s,
        id: s._id,
      })),
    [sessions]
  );

  return (
    <>
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
            sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
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
