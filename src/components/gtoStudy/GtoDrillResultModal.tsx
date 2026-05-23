import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  validateAccuracyPercentInput,
  validateEvDiffInput,
  validateHandsPlayedInput,
  validateScorePositiveInput,
} from '../../utils/gtoStudyUtils';
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
  const [accuracy, setAccuracy] = useState('');
  const [evDiff, setEvDiff] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (result) {
      setDate(toLocalDatetimeValue(result.date));
      setEvLoss(result.evLoss != null ? String(result.evLoss) : '');
      setHandsPlayed(result.handsPlayed != null ? String(result.handsPlayed) : '');
      setAccuracy(result.accuracy != null ? String(result.accuracy) : '');
      setEvDiff(result.evDiff != null ? String(result.evDiff) : '');
      setScore(result.score != null ? String(result.score) : '');
      setNotes(result.notes ?? '');
    } else {
      setDate(toLocalDatetimeValue(new Date().toISOString()));
      setEvLoss('');
      setHandsPlayed('');
      setAccuracy('');
      setEvDiff('');
      setScore('');
      setNotes('');
    }
  }, [open, result]);

  const handsPlayedError = validateHandsPlayedInput(handsPlayed);
  const accuracyError = validateAccuracyPercentInput(accuracy);
  const evDiffError = validateEvDiffInput(evDiff);
  const scoreError = validateScorePositiveInput(score);
  const evLossInvalid =
    evLoss.trim() !== '' &&
    (() => {
      const n = Number.parseFloat(evLoss);
      return !Number.isFinite(n);
    })();
  const canSubmit =
    !handsPlayedError && !accuracyError && !evDiffError && !scoreError && !evLossInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const isoDate = new Date(date).toISOString();
    const notesCreate = notes.trim().slice(0, 500) || undefined;
    const notesUpdate = notes.trim().slice(0, 500);

    if (result) {
      const parsedEv = evLoss.trim() === '' ? null : Number.parseFloat(evLoss);
      const parsedHands =
        handsPlayed.trim() === '' ? null : Number.parseInt(handsPlayed.trim(), 10);
      const parsedAccuracy =
        accuracy.trim() === '' ? null : Number.parseFloat(accuracy.trim());
      const parsedEvDiffField =
        evDiff.trim() === '' ? null : Number.parseFloat(evDiff.trim());
      const parsedScore = score.trim() === '' ? null : Number.parseFloat(score.trim());
      await onSubmitUpdate({
        date: isoDate,
        evLoss: parsedEv,
        handsPlayed: parsedHands,
        accuracy: parsedAccuracy,
        evDiff: parsedEvDiffField,
        score: parsedScore,
        notes: notesUpdate,
      });
    } else {
      const parsedEv = evLoss.trim() === '' ? undefined : Number.parseFloat(evLoss);
      const parsedHands =
        handsPlayed.trim() === '' ? undefined : Number.parseInt(handsPlayed.trim(), 10);
      const parsedAccuracy =
        accuracy.trim() === '' ? undefined : Number.parseFloat(accuracy.trim());
      const parsedEvDiffField =
        evDiff.trim() === '' ? undefined : Number.parseFloat(evDiff.trim());
      const parsedScore = score.trim() === '' ? undefined : Number.parseFloat(score.trim());
      await onSubmitCreate({
        date: isoDate,
        evLoss: parsedEv,
        handsPlayed: parsedHands,
        accuracy: parsedAccuracy,
        evDiff: parsedEvDiffField,
        score: parsedScore,
        notes: notesCreate,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit result' : `Log result — ${drillName}`}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
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
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            Session stats
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
            }}
          >
            <TextField
              label="Hands played"
              type="number"
              fullWidth
              size="small"
              value={handsPlayed}
              onChange={(e) => setHandsPlayed(e.target.value)}
              error={Boolean(handsPlayedError)}
              helperText={handsPlayedError ?? 'Optional · min 1 if entered'}
              inputProps={{ step: 1, min: 1 }}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-') {
                  e.preventDefault();
                }
              }}
            />
            <TextField
              label="Accuracy %"
              type="number"
              fullWidth
              size="small"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
              error={Boolean(accuracyError)}
              helperText={accuracyError ?? 'Optional · 0–100'}
              inputProps={{ step: 0.1, min: 0, max: 100 }}
            />
            <Tooltip title="Available once Lucid Player Insights launches" placement="top">
              <Box>
                <TextField
                  label="Best Action %"
                  type="number"
                  fullWidth
                  size="small"
                  value=""
                  disabled
                  helperText="(Lucid Player Insights — coming soon)"
                  inputProps={{ step: 0.1, min: 0, max: 100 }}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      opacity: 0.55,
                    },
                  }}
                />
              </Box>
            </Tooltip>
            <TextField
              label="EV diff"
              type="number"
              fullWidth
              size="small"
              value={evDiff}
              onChange={(e) => setEvDiff(e.target.value)}
              error={Boolean(evDiffError)}
              helperText={evDiffError ?? 'Optional · can be negative'}
              inputProps={{ step: 0.01 }}
            />
            <TextField
              label="Score"
              type="number"
              fullWidth
              size="small"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              error={Boolean(scoreError)}
              helperText={scoreError ?? 'Optional · positive'}
              inputProps={{ step: 0.01 }}
              onKeyDown={(e) => {
                if (e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
            />
          </Box>
          <TextField
            label="EV loss (bb, optional)"
            type="number"
            fullWidth
            size="small"
            value={evLoss}
            onChange={(e) => setEvLoss(e.target.value)}
            error={evLossInvalid}
            helperText={evLossInvalid ? 'Invalid number' : undefined}
            inputProps={{ step: '0.01' }}
          />
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
