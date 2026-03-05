import { useState, useEffect } from 'react';
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
import type { SessionResult, SessionResultCreate } from '../../types/results';
import { RESULTS_STAKE_OPTIONS } from '../../types/results';

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
  const [dailyNet, setDailyNet] = useState<string>('');
  const [endBankroll, setEndBankroll] = useState<string>('');
  const [stake, setStake] = useState<number | ''>('');
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
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
      setDate(d.toISOString().slice(0, 10));
      setTotalTime(session.totalTime != null ? String(session.totalTime) : '');
      setStartTime(toTimeString(session.startTime));
      setEndTime(toTimeString(session.endTime));
      setHandsStartedAt(session.handsStartedAt != null ? String(session.handsStartedAt) : '');
      setHandsEndedAt(session.handsEndedAt != null ? String(session.handsEndedAt) : '');
      setHands(session.hands != null ? String(session.hands) : '');
      setDailyNet(session.dailyNet != null ? String(session.dailyNet) : '');
      setEndBankroll(session.endBankroll != null ? String(session.endBankroll) : '');
      setStake(session.stake ?? '');
      setGameType(session.gameType ?? 'NLHE');
      setIsRing(session.isRing ?? false);
      setIsHU(session.isHU ?? false);
    }
  }, [session]);

  const handleSubmit = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const sessionDate = date || new Date().toISOString().slice(0, 10);
      await onSave(session._id, {
        date: date ? `${date}T12:00:00` : undefined,
        totalTime: totalTime.trim() ? Math.round(Number(totalTime) * 100) / 100 : null,
        startTime: startTime.trim() ? `${sessionDate}T${startTime.trim()}:00` : null,
        endTime: endTime.trim() ? `${sessionDate}T${endTime.trim()}:00` : null,
        handsStartedAt: handsStartedAt.trim() ? Number(handsStartedAt.replace(/,/g, '')) : null,
        handsEndedAt: handsEndedAt.trim() ? Number(handsEndedAt.replace(/,/g, '')) : null,
        hands: hands.trim() ? Number(hands.replace(/,/g, '')) : null,
        dailyNet: dailyNet.trim() ? Number(dailyNet.replace(/[$,]/g, '')) : null,
        endBankroll: endBankroll.trim() ? Number(endBankroll.replace(/[$,]/g, '')) : null,
        stake: stake === '' ? null : stake,
        gameType,
        isRing: isRing || null,
        isHU: isHU || null,
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
            value={totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
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
            value={hands}
            onChange={(e) => setHands(e.target.value)}
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
            label="Daily Net"
            size="small"
            value={dailyNet}
            onChange={(e) => setDailyNet(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
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
