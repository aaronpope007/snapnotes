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
  const [hands, setHands] = useState<string>('');
  const [dailyNet, setDailyNet] = useState<string>('');
  const [stake, setStake] = useState<number | ''>('');
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      const d = new Date(session.date);
      setDate(d.toISOString().slice(0, 10));
      setTotalTime(session.totalTime != null ? String(session.totalTime) : '');
      setHands(session.hands != null ? String(session.hands) : '');
      setDailyNet(session.dailyNet != null ? String(session.dailyNet) : '');
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
      await onSave(session._id, {
        date: date ? `${date}T12:00:00` : undefined,
        totalTime: totalTime.trim() ? Number(totalTime) : null,
        hands: hands.trim() ? Number(hands) : null,
        dailyNet: dailyNet.trim() ? Number(dailyNet.replace(/[$,]/g, '')) : null,
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
            label="Hands"
            type="number"
            size="small"
            value={hands}
            onChange={(e) => setHands(e.target.value)}
            fullWidth
          />
          <TextField
            label="Net"
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
