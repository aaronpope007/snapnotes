import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import type { SessionResult, SessionResultCreate, SessionRating } from '../../types/results';
import { RESULTS_STAKE_OPTIONS, SESSION_RATING_OPTIONS } from '../../types/results';

interface EditSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: SessionResult | null;
  onSave: (id: string, updates: Partial<SessionResultCreate>) => Promise<void>;
}

export function EditSessionModal({ open, onClose, session, onSave }: EditSessionModalProps) {
  const [date, setDate] = useState('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [handsStartedAt, setHandsStartedAt] = useState<string>('');
  const [handsEndedAt, setHandsEndedAt] = useState<string>('');
  const [hands, setHands] = useState<string>('');
  const [startBankroll, setStartBankroll] = useState<string>('');
  const [endBankroll, setEndBankroll] = useState<string>('');
  const [stake, setStake] = useState<number | ''>('');
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [rating, setRating] = useState<SessionRating | ''>('');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function toTimeString(isoOrDate: string | null | undefined): string {
    if (!isoOrDate) return '';
    try {
      const d = new Date(isoOrDate);
      if (Number.isNaN(d.getTime())) return '';
      const h = d.getHours();
      const m = d.getMinutes();
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }

  useEffect(() => {
    if (session) {
      const d = new Date(session.date);
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setDate(localDateStr);
      setTotalTime(session.totalTime != null ? String(session.totalTime) : '');
      setStartTime(toTimeString(session.startTime));
      setEndTime(toTimeString(session.endTime));
      setHandsStartedAt(session.handsStartedAt != null ? String(session.handsStartedAt) : '');
      setHandsEndedAt(session.handsEndedAt != null ? String(session.handsEndedAt) : '');
      setHands(session.hands != null ? String(session.hands) : '');
      setStartBankroll(session.startBankroll != null ? String(session.startBankroll) : '');
      setEndBankroll(session.endBankroll != null ? String(session.endBankroll) : '');
      setStake(session.stake ?? '');
      setGameType(session.gameType ?? 'NLHE');
      setRating(session.rating ?? '');
      setIsRing(session.isRing ?? false);
      setIsHU(session.isHU ?? false);
      setNotes(session.notes ?? '');
    }
  }, [session]);

  const derivedHands = useMemo(() => {
    const start = handsStartedAt.trim() ? parseInt(handsStartedAt.replace(/,/g, ''), 10) : NaN;
    const end = handsEndedAt.trim() ? parseInt(handsEndedAt.replace(/,/g, ''), 10) : NaN;
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) return end - start;
    return hands.trim() ? parseInt(hands.replace(/,/g, ''), 10) : NaN;
  }, [handsStartedAt, handsEndedAt, hands]);

  const derivedDailyNet = useMemo(() => {
    const start = startBankroll.trim() ? parseFloat(startBankroll.replace(/[$,]/g, '')) : NaN;
    const end = endBankroll.trim() ? parseFloat(endBankroll.replace(/[$,]/g, '')) : NaN;
    if (!Number.isNaN(start) && !Number.isNaN(end)) return end - start;
    return NaN;
  }, [startBankroll, endBankroll]);

  const derivedTotalTime = useMemo(() => {
    if (!startTime.trim() || !endTime.trim()) return NaN;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if ([sh, sm, eh, em].some(Number.isNaN)) return NaN;
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diffMins = endMins - startMins;
    if (diffMins < 0) return NaN; // end before start
    return Math.round((diffMins / 60) * 100) / 100; // 2 decimal places
  }, [startTime, endTime]);

  const handleSubmit = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const sessionDate = date || new Date().toISOString().slice(0, 10);
      await onSave(session._id, {
        date: date || undefined,
        totalTime: (() => {
          const val = !Number.isNaN(derivedTotalTime) ? derivedTotalTime : (totalTime.trim() ? Number(totalTime) : NaN);
          return !Number.isNaN(val) ? Math.round(val * 100) / 100 : null;
        })(),
        startTime: startTime.trim() ? `${sessionDate}T${startTime.trim()}:00` : null,
        endTime: endTime.trim() ? `${sessionDate}T${endTime.trim()}:00` : null,
        handsStartedAt: handsStartedAt.trim() ? Number(handsStartedAt.replace(/,/g, '')) : null,
        handsEndedAt: handsEndedAt.trim() ? Number(handsEndedAt.replace(/,/g, '')) : null,
        hands: !Number.isNaN(derivedHands) ? derivedHands : (hands.trim() ? Number(hands.replace(/,/g, '')) : null),
        dailyNet: !Number.isNaN(derivedDailyNet) ? Math.round(derivedDailyNet * 100) / 100 : null,
        startBankroll: startBankroll.trim() ? Number(startBankroll.replace(/[$,]/g, '')) : null,
        endBankroll: endBankroll.trim() ? Number(endBankroll.replace(/[$,]/g, '')) : null,
        stake: stake === '' ? null : stake,
        gameType,
        rating: rating === '' ? null : rating,
        isRing: isRing || null,
        isHU: isHU || null,
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit session</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
          <TextField
            label="Date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Time (hrs)"
            type="number"
            size="small"
            value={!Number.isNaN(derivedTotalTime) ? derivedTotalTime : totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
            InputProps={{ readOnly: !Number.isNaN(derivedTotalTime) }}
            inputProps={{ step: 0.01, min: 0 }}
            fullWidth
          />
          <TextField
            label="Time start"
            type="time"
            size="small"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
            fullWidth
          />
          <TextField
            label="Time end"
            type="time"
            size="small"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
            fullWidth
          />
          <TextField
            label="Hands start"
            type="number"
            size="small"
            value={handsStartedAt}
            onChange={(e) => setHandsStartedAt(e.target.value)}
            fullWidth
          />
          <TextField
            label="Hands end"
            type="number"
            size="small"
            value={handsEndedAt}
            onChange={(e) => setHandsEndedAt(e.target.value)}
            fullWidth
          />
          <TextField
            label="Hands"
            type="number"
            size="small"
            value={!Number.isNaN(derivedHands) ? derivedHands : hands}
            onChange={(e) => setHands(e.target.value)}
            InputProps={{ readOnly: !Number.isNaN(derivedHands) }}
            fullWidth
          />
          <TextField
            label="Account start"
            size="small"
            value={startBankroll}
            onChange={(e) => setStartBankroll(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            fullWidth
          />
          <TextField
            label="Account end (bankroll)"
            size="small"
            value={endBankroll}
            onChange={(e) => setEndBankroll(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            fullWidth
          />
          <TextField
            label="Session Net"
            size="small"
            value={!Number.isNaN(derivedDailyNet) ? derivedDailyNet.toFixed(2) : ''}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              readOnly: true,
            }}
            fullWidth
          />
          <TextField
            select
            label="Stake"
            size="small"
            value={stake === '' ? '' : stake}
            onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
          >
            <MenuItem value="">—</MenuItem>
            {RESULTS_STAKE_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Game"
            size="small"
            value={gameType}
            onChange={(e) => setGameType(e.target.value as 'NLHE' | 'PLO')}
            fullWidth
          >
            <MenuItem value="NLHE">NLHE</MenuItem>
            <MenuItem value="PLO">PLO</MenuItem>
          </TextField>
          <TextField
            select
            label="Rating"
            size="small"
            value={rating}
            onChange={(e) => setRating((e.target.value || '') as SessionRating | '')}
            fullWidth
          >
            <MenuItem value="">—</MenuItem>
            {SESSION_RATING_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={isRing} onChange={(e) => setIsRing(e.target.checked)} size="small" />}
              label="Ring"
            />
            <FormControlLabel
              control={<Checkbox checked={isHU} onChange={(e) => setIsHU(e.target.checked)} size="small" />}
              label="HU"
            />
          </Box>
          <TextField
            label="Session notes / journal"
            size="small"
            multiline
            minRows={2}
            maxRows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What went well? What did you do poorly? What to work on?"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
