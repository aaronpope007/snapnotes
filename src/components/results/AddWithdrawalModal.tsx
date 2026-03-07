import { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import type { WithdrawalCreate } from '../../types/results';

function sanitizeAmount(val: string): string {
  return val.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
}

interface AddWithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: WithdrawalCreate) => Promise<void>;
  onError: (msg: string) => void;
}

export function AddWithdrawalModal({
  open,
  onClose,
  onAdd,
  onError,
}: AddWithdrawalModalProps) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount('');
      setNotes('');
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (Number.isNaN(amt) || amt < 0) {
      onError('Enter a valid amount (≥ 0)');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        date: date ? `${date}T12:00:00` : undefined,
        amount: amt,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add withdrawal');
    } finally {
      setSaving(false);
    }
  }, [date, amount, notes, onAdd, onClose, onError]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add withdrawal</DialogTitle>
      <DialogContent>
        <TextField
          label="Date"
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Amount"
          size="small"
          value={amount}
          onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
          placeholder="0.00"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Notes (optional)"
          size="small"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          minRows={1}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !amount.trim()}
        >
          {saving ? 'Saving…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
