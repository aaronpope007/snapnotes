import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { validateHandsPlayedInput } from '../../utils/gtoStudyUtils';
import type { GtoDrillResult, GtoDrillResultCreate, GtoDrillResultUpdate } from '../../types/gtoStudy';

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface GtoDrillResultModalProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  drillName: string;
  result?: GtoDrillResult | null;
  onSubmitCreate: (payload: GtoDrillResultCreate) => Promise<void>;
  onSubmitUpdate: (payload: GtoDrillResultUpdate) => Promise<void>;
}

export function GtoDrillResultModal({
  open,
  onClose,
  saving,
  drillName,
  result,
  onSubmitCreate,
  onSubmitUpdate,
}: GtoDrillResultModalProps) {
  const isEdit = Boolean(result);
  const [date, setDate] = useState(() => toLocalDatetimeValue(new Date().toISOString()));
  const [evLoss, setEvLoss] = useState('');
  const [handsPlayed, setHandsPlayed] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (result) {
      setDate(toLocalDatetimeValue(result.date));
      setEvLoss(result.evLoss != null ? String(result.evLoss) : '');
      setHandsPlayed(result.handsPlayed != null ? String(result.handsPlayed) : '');
      setNotes(result.notes ?? '');
    } else {
      setDate(toLocalDatetimeValue(new Date().toISOString()));
      setEvLoss('');
      setHandsPlayed('');
      setNotes('');
    }
  }, [open, result]);

  const handsPlayedError = validateHandsPlayedInput(handsPlayed);
  const evLossInvalid =
    evLoss.trim() !== '' &&
    (() => {
      const n = Number.parseFloat(evLoss);
      return !Number.isFinite(n);
    })();
  const canSubmit = !handsPlayedError && !evLossInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsedEv = evLoss.trim() === '' ? undefined : Number.parseFloat(evLoss);
    const parsedHands =
      handsPlayed.trim() === '' ? undefined : Number.parseInt(handsPlayed.trim(), 10);

    const payload = {
      date: new Date(date).toISOString(),
      evLoss: parsedEv,
      handsPlayed: parsedHands,
      notes: notes.trim().slice(0, 500) || undefined,
    };

    if (result) {
      await onSubmitUpdate(payload);
    } else {
      await onSubmitCreate(payload);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit result' : `Log result — ${drillName}`}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <TextField
            label="Date & time"
            type="datetime-local"
            fullWidth
            required
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="EV loss (bb, optional)"
              type="number"
              fullWidth
              size="small"
              value={evLoss}
              onChange={(e) => setEvLoss(e.target.value)}
              inputProps={{ step: '0.01' }}
            />
            <TextField
              label="Hands played (optional)"
              type="number"
              fullWidth
              size="small"
              value={handsPlayed}
              onChange={(e) => setHandsPlayed(e.target.value)}
              error={Boolean(handsPlayedError)}
              helperText={handsPlayedError ?? 'Min 1 if entered'}
              inputProps={{ step: 1, min: 1 }}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-') {
                  e.preventDefault();
                }
              }}
            />
          </Box>
          <TextField
            label="Notes (optional)"
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            helperText={`${notes.length}/500`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || !canSubmit}>
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Log result'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
