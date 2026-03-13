import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import type { ActiveSession } from '../../utils/activeSession';

interface EditActiveSessionModalProps {
  open: boolean;
  onClose: () => void;
  activeSession: ActiveSession | null;
  onSave: (startTimeIso: string) => void;
  onError: (msg: string) => void;
}

function toDateString(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function toTimeString(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function EditActiveSessionModal({
  open,
  onClose,
  activeSession,
  onSave,
  onError,
}: EditActiveSessionModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (activeSession && open) {
      setDate(toDateString(activeSession.startTime));
      setTime(toTimeString(activeSession.startTime));
    }
  }, [activeSession, open]);

  const handleSubmit = () => {
    if (!activeSession) return;
    const dateTrim = date.trim();
    const timeTrim = time.trim();
    if (!dateTrim || !timeTrim) {
      onError('Enter both date and time.');
      return;
    }
    const [hours, minutes] = timeTrim.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      onError('Enter a valid time (HH:MM).');
      return;
    }
    const timePadded = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const parsed = new Date(`${dateTrim}T${timePadded}:00`);
    if (Number.isNaN(parsed.getTime())) {
      onError('Enter a valid date and time.');
      return;
    }
    const startTimeIso = parsed.toISOString();
    onSave(startTimeIso);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit session start time</DialogTitle>
      <DialogContent>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 60 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
