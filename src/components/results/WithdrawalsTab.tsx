import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import type { Withdrawal, WithdrawalCreate } from '../../types/results';
import { AddWithdrawalModal } from './AddWithdrawalModal';
import { EditWithdrawalModal } from './EditWithdrawalModal';

interface WithdrawalsTabProps {
  withdrawals: Withdrawal[];
  loading: boolean;
  onAdd: (payload: WithdrawalCreate) => Promise<void>;
  onUpdate: (id: string, updates: Partial<WithdrawalCreate>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onError?: (msg: string) => void;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function WithdrawalsTab({
  withdrawals,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onError,
}: WithdrawalsTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editWithdrawal, setEditWithdrawal] = useState<Withdrawal | null>(null);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="small" onClick={() => setAddOpen(true)}>
          Add withdrawal
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          Loading…
        </Box>
      ) : withdrawals.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          No withdrawals recorded. Add one when you cash out profits.
        </Box>
      ) : (
        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {withdrawals.map((w) => (
            <Box
              key={w._id}
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                py: 1,
                px: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(w.amount)}
                </Box>
                <Box
                  component="span"
                  sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  {new Date(w.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {w.notes ? ` · ${w.notes}` : ''}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <IconButton
                  size="small"
                  aria-label="Edit"
                  onClick={() => setEditWithdrawal(w)}
                >
                  <Box sx={{ fontSize: '0.9rem' }}>✎</Box>
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Delete"
                  onClick={() => setDeleteId(w._id)}
                >
                  <Box sx={{ fontSize: '0.9rem' }}>×</Box>
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <AddWithdrawalModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
        onError={(msg) => onError?.(msg)}
      />

      <EditWithdrawalModal
        open={!!editWithdrawal}
        onClose={() => setEditWithdrawal(null)}
        withdrawal={editWithdrawal}
        onSave={onUpdate}
        onSuccess={() => setEditWithdrawal(null)}
        onError={(msg) => onError?.(msg)}
      />

      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle>Delete withdrawal?</DialogTitle>
        <DialogContent>
          <Box>This cannot be undone.</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
