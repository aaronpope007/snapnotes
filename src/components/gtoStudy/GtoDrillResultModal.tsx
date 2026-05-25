import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ConfirmDialog } from '../ConfirmDialog';
import { useDirtyFormClose } from '../../hooks/useDirtyFormClose';
import {
  validateAccuracyPercentInput,
  validateEvDiffInput,
  validateHandsPlayedInput,
  validateScorePositiveInput,
} from '../../utils/gtoStudyUtils';
import {
  emptyResultFormSnapshot,
  isResultFormDirty,
  resultFormSnapshotFromResult,
  type GtoResultFormSnapshot,
} from '../../utils/gtoResultForm';
import { useUserName } from '../../context/UserNameContext';
import type {
  GtoDrillResult,
  GtoDrillResultCreate,
  GtoDrillResultUpdate,
  GtoStudySession,
} from '../../types/gtoStudy';

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
  const userName = useUserName();
  const [form, setForm] = useState<GtoResultFormSnapshot>(emptyResultFormSnapshot);
  const [studySessionId, setStudySessionId] = useState('');
  const [studySessions, setStudySessions] = useState<GtoStudySession[]>([]);
  const baselineRef = useRef<GtoResultFormSnapshot | null>(null);

  const {
    confirmOpen,
    closeConfirm,
    handleConfirm,
    confirmOptions,
    requestClose: requestDirtyClose,
  } = useDirtyFormClose();

  useEffect(() => {
    if (!open) return;
    const initial = result ? resultFormSnapshotFromResult(result) : emptyResultFormSnapshot();
    setForm(initial);
    baselineRef.current = initial;
    setStudySessionId('');
  }, [open, result]);

  useEffect(() => {
    if (!open || isEdit || !userName?.trim()) {
      setStudySessions([]);
      return;
    }
    void axios
      .get<GtoStudySession[]>('/api/gto-study', { params: { userId: userName.trim() } })
      .then(({ data }) => setStudySessions(data.slice(0, 10)))
      .catch(() => setStudySessions([]));
  }, [open, isEdit, userName]);

  const formatStudySessionLabel = (session: GtoStudySession): string => {
    const d = new Date(session.sessionDate);
    const dateLabel = Number.isNaN(d.getTime())
      ? session.sessionDate
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateLabel} · ${session.format} ${session.stack}`;
  };

  const patch = (updates: Partial<GtoResultFormSnapshot>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const requestClose = useCallback(() => {
    requestDirtyClose(isResultFormDirty(form, baselineRef.current), onClose);
  }, [form, onClose, requestDirtyClose]);

  const handsPlayedError = validateHandsPlayedInput(form.handsPlayed);
  const accuracyError = validateAccuracyPercentInput(form.accuracy);
  const evDiffError = validateEvDiffInput(form.evDiff);
  const scoreError = validateScorePositiveInput(form.score);
  const evLossInvalid =
    form.evLoss.trim() !== '' &&
    (() => {
      const n = Number.parseFloat(form.evLoss);
      return !Number.isFinite(n);
    })();
  const canSubmit =
    !handsPlayedError && !accuracyError && !evDiffError && !scoreError && !evLossInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const isoDate = new Date(form.date).toISOString();
    const notesCreate = form.notes.trim().slice(0, 500) || undefined;
    const notesUpdate = form.notes.trim().slice(0, 500);

    if (result) {
      const parsedEv = form.evLoss.trim() === '' ? null : Number.parseFloat(form.evLoss);
      const parsedHands =
        form.handsPlayed.trim() === '' ? null : Number.parseInt(form.handsPlayed.trim(), 10);
      const parsedAccuracy =
        form.accuracy.trim() === '' ? null : Number.parseFloat(form.accuracy.trim());
      const parsedEvDiffField =
        form.evDiff.trim() === '' ? null : Number.parseFloat(form.evDiff.trim());
      const parsedScore = form.score.trim() === '' ? null : Number.parseFloat(form.score.trim());
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
      const parsedEv = form.evLoss.trim() === '' ? undefined : Number.parseFloat(form.evLoss);
      const parsedHands =
        form.handsPlayed.trim() === '' ? undefined : Number.parseInt(form.handsPlayed.trim(), 10);
      const parsedAccuracy =
        form.accuracy.trim() === '' ? undefined : Number.parseFloat(form.accuracy.trim());
      const parsedEvDiffField =
        form.evDiff.trim() === '' ? undefined : Number.parseFloat(form.evDiff.trim());
      const parsedScore = form.score.trim() === '' ? undefined : Number.parseFloat(form.score.trim());
      await onSubmitCreate({
        date: isoDate,
        evLoss: parsedEv,
        handsPlayed: parsedHands,
        accuracy: parsedAccuracy,
        evDiff: parsedEvDiffField,
        score: parsedScore,
        notes: notesCreate,
        studySessionId: studySessionId.trim() || undefined,
      });
    }
    baselineRef.current = form;
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={requestClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{isEdit ? 'Edit result' : `Log result — ${drillName}`}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
            <TextField
              label="Date & time"
              type="datetime-local"
              fullWidth
              required
              size="small"
              value={form.date}
              onChange={(e) => patch({ date: e.target.value })}
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
                value={form.handsPlayed}
                onChange={(e) => patch({ handsPlayed: e.target.value })}
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
                value={form.accuracy}
                onChange={(e) => patch({ accuracy: e.target.value })}
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
                value={form.evDiff}
                onChange={(e) => patch({ evDiff: e.target.value })}
                error={Boolean(evDiffError)}
                helperText={evDiffError ?? 'Optional · can be negative'}
                inputProps={{ step: 0.01 }}
              />
              <TextField
                label="Score"
                type="number"
                fullWidth
                size="small"
                value={form.score}
                onChange={(e) => patch({ score: e.target.value })}
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
              value={form.evLoss}
              onChange={(e) => patch({ evLoss: e.target.value })}
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
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value.slice(0, 500) })}
              helperText={`${form.notes.length}/500`}
            />
            {!isEdit && (
              <FormControl fullWidth size="small">
                <InputLabel>Link to study session</InputLabel>
                <Select
                  label="Link to study session"
                  value={studySessionId}
                  onChange={(e) => setStudySessionId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {studySessions.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {formatStudySessionLabel(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={requestClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !canSubmit}>
              {saving ? 'Saving...' : isEdit ? 'Save' : 'Log result'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        {...confirmOptions}
      />
    </>
  );
}
