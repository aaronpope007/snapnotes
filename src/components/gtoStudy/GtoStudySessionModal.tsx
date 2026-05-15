import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {
  GTO_ENDS_AFTER_LABELS,
  GTO_ENDS_AFTER_OPTIONS,
  GTO_FORMAT_LABELS,
  GTO_HAND_START_OPTIONS,
  getDefaultHeroPosition,
  getDefaultStack,
  getPositionsForFormat,
  getPotTypesForSession,
} from '../../constants/gtoStudy';
import type {
  GtoFormat,
  GtoHandStart,
  GtoPosition,
  GtoPotType,
  GtoStack,
  GtoStudySession,
  GtoStudySessionCreate,
  GtoStudySessionUpdate,
} from '../../types/gtoStudy';

interface GtoStudySessionModalProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  session?: GtoStudySession | null;
  onSubmitCreate: (payload: GtoStudySessionCreate) => Promise<void>;
  onSubmitUpdate: (id: string, payload: GtoStudySessionUpdate) => Promise<void>;
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GtoStudySessionModal({
  open,
  onClose,
  saving,
  session,
  onSubmitCreate,
  onSubmitUpdate,
}: GtoStudySessionModalProps) {
  const isEdit = Boolean(session);
  const [sessionDate, setSessionDate] = useState(() => toLocalDatetimeValue(new Date().toISOString()));
  const [format, setFormat] = useState<GtoFormat>('HU');
  const [stack, setStack] = useState<GtoStack>('100bb');
  const [handStart, setHandStart] = useState<GtoHandStart>('Preflop');
  const [potType, setPotType] = useState<GtoPotType>('SRP');
  const [heroPosition, setHeroPosition] = useState<GtoPosition>('SB');
  const [villainPosition, setVillainPosition] = useState<GtoPosition | ''>('');
  const [endsAfter, setEndsAfter] = useState<GtoStudySessionCreate['endsAfter']>('HandEnd');
  const [evLoss, setEvLoss] = useState('');
  const [notes, setNotes] = useState('');

  const positions = getPositionsForFormat(format);
  const potTypes = getPotTypesForSession(format, handStart);
  const showVillain = handStart === 'Postflop';

  useEffect(() => {
    if (!open) return;
    if (session) {
      setSessionDate(toLocalDatetimeValue(session.sessionDate));
      setFormat(session.format);
      setStack(session.stack);
      setHandStart(session.handStart);
      setPotType(session.potType);
      setHeroPosition(session.heroPosition);
      setVillainPosition(session.villainPosition ?? '');
      setEndsAfter(session.endsAfter);
      setEvLoss(session.evLoss != null ? String(session.evLoss) : '');
      setNotes(session.notes ?? '');
    } else {
      setSessionDate(toLocalDatetimeValue(new Date().toISOString()));
      setFormat('HU');
      setStack('100bb');
      setHandStart('Preflop');
      setPotType('SRP');
      setHeroPosition('SB');
      setVillainPosition('');
      setEndsAfter('HandEnd');
      setEvLoss('');
      setNotes('');
    }
  }, [open, session]);

  useEffect(() => {
    if (!open || isEdit) return;
    const defaultStack = getDefaultStack(format);
    setStack(defaultStack);
    setHeroPosition(getDefaultHeroPosition(format) as GtoPosition);
    if (format === '8max') {
      setHandStart((prev) => prev);
    }
  }, [format, open, isEdit]);

  useEffect(() => {
    if (!potTypes.includes(potType)) {
      setPotType(potTypes[0]);
    }
  }, [potTypes, potType]);

  useEffect(() => {
    if (!positions.includes(heroPosition)) {
      setHeroPosition(positions[0] as GtoPosition);
    }
    if (villainPosition && !positions.includes(villainPosition)) {
      setVillainPosition('');
    }
  }, [positions, heroPosition, villainPosition]);

  useEffect(() => {
    if (handStart === 'Preflop') {
      setVillainPosition('');
    }
  }, [handStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEv =
      evLoss.trim() === '' ? undefined : Number.parseFloat(evLoss);
    if (evLoss.trim() !== '' && (parsedEv == null || !Number.isFinite(parsedEv))) {
      return;
    }
    const payload = {
      sessionDate: new Date(sessionDate).toISOString(),
      format,
      stack,
      handStart,
      potType,
      heroPosition,
      villainPosition: showVillain && villainPosition ? villainPosition : undefined,
      endsAfter,
      evLoss: parsedEv,
      notes: notes.trim().slice(0, 500) || undefined,
    };
    if (session) {
      await onSubmitUpdate(session._id, payload);
    } else {
      await onSubmitCreate(payload);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit drill session' : 'Log GTO Wizard drill'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <TextField
            label="Date & time"
            type="datetime-local"
            fullWidth
            required
            size="small"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Format</InputLabel>
              <Select
                label="Format"
                value={format}
                onChange={(e) => setFormat(e.target.value as GtoFormat)}
              >
                {(Object.keys(GTO_FORMAT_LABELS) as GtoFormat[]).map((f) => (
                  <MenuItem key={f} value={f}>
                    {GTO_FORMAT_LABELS[f]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Stacks</InputLabel>
              <Select
                label="Stacks"
                value={stack}
                onChange={(e) => setStack(e.target.value as GtoStack)}
              >
                {(format === 'HU' ? ['100bb', '200bb'] : ['200bb']).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Hand starts at</InputLabel>
              <Select
                label="Hand starts at"
                value={handStart}
                onChange={(e) => setHandStart(e.target.value as GtoHandStart)}
              >
                {GTO_HAND_START_OPTIONS.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Pot type</InputLabel>
              <Select
                label="Pot type"
                value={potType}
                onChange={(e) => setPotType(e.target.value as GtoPotType)}
              >
                {potTypes.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Hero position</InputLabel>
              <Select
                label="Hero position"
                value={heroPosition}
                onChange={(e) => setHeroPosition(e.target.value as GtoPosition)}
              >
                {positions.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {showVillain ? (
              <FormControl fullWidth size="small">
                <InputLabel>Villain position</InputLabel>
                <Select
                  label="Villain position"
                  value={villainPosition}
                  onChange={(e) => setVillainPosition(e.target.value as GtoPosition)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {positions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ flex: 1 }} />
            )}
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>Ends after</InputLabel>
            <Select
              label="Ends after"
              value={endsAfter}
              onChange={(e) => setEndsAfter(e.target.value as GtoStudySessionCreate['endsAfter'])}
            >
              {GTO_ENDS_AFTER_OPTIONS.map((e) => (
                <MenuItem key={e} value={e}>
                  {GTO_ENDS_AFTER_LABELS[e]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="EV loss (bb, optional)"
            type="number"
            fullWidth
            size="small"
            value={evLoss}
            onChange={(e) => setEvLoss(e.target.value)}
            inputProps={{ step: '0.01' }}
            helperText="Can be added after the drill ends"
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
          {!isEdit && (
            <Typography variant="caption" color="text.secondary">
              Log each drill spot as a separate entry.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Log session'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
