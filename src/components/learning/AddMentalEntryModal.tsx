import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import type { MentalGameEntryCreate } from '../../types/learning';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'OK',
  4: 'Good',
  5: 'Excellent',
};

interface AddMentalEntryModalProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  onSubmit: (payload: MentalGameEntryCreate) => Promise<void>;
}

export function AddMentalEntryModal({
  open,
  onClose,
  saving,
  onSubmit,
}: AddMentalEntryModalProps) {
  const [sessionDate, setSessionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [stateRating, setStateRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [observation, setObservation] = useState('');
  const [tiltAffected, setTiltAffected] = useState(false);
  const [fatigueAffected, setFatigueAffected] = useState(false);
  const [confidenceAffected, setConfidenceAffected] = useState(false);

  useEffect(() => {
    if (open) {
      setSessionDate(new Date().toISOString().slice(0, 10));
      setStateRating(3);
      setObservation('');
      setTiltAffected(false);
      setFatigueAffected(false);
      setConfidenceAffected(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      sessionDate: new Date(sessionDate).toISOString(),
      stateRating,
      observation: observation.trim().slice(0, 280),
      tiltAffected,
      fatigueAffected,
      confidenceAffected,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Log session</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Session date"
            type="date"
            fullWidth
            required
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              How was your mental state? ({RATING_LABELS[stateRating]})
            </Typography>
            <Slider
              value={stateRating}
              onChange={(_, v) => setStateRating(v as 1 | 2 | 3 | 4 | 5)}
              min={1}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => RATING_LABELS[v]}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <TextField
            margin="dense"
            label="One-liner (what did you notice?)"
            fullWidth
            multiline
            minRows={2}
            maxRows={3}
            placeholder="e.g. Felt sharp preflop, tired by the river"
            value={observation}
            onChange={(e) => setObservation(e.target.value.slice(0, 280))}
            size="small"
            helperText={`${observation.length}/280`}
          />
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={tiltAffected}
                  onChange={(e) => setTiltAffected(e.target.checked)}
                />
              }
              label={<Typography variant="caption">Tilt affected decisions</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={fatigueAffected}
                  onChange={(e) => setFatigueAffected(e.target.checked)}
                />
              }
              label={<Typography variant="caption">Fatigue affected decisions</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={confidenceAffected}
                  onChange={(e) => setConfidenceAffected(e.target.checked)}
                />
              }
              label={<Typography variant="caption">Confidence affected decisions</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
