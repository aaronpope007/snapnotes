import { useState, useCallback, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import type { SessionResultCreate } from '../../types/results';
import { RESULTS_STAKE_OPTIONS } from '../../types/results';

interface LogNewSessionModalProps {
  open: boolean;
  onClose: () => void;
  totalHandsSoFar: number;
  onAddSession: (payload: SessionResultCreate) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function LogNewSessionModal({
  open,
  onClose,
  totalHandsSoFar,
  onAddSession,
  onSuccess,
  onError,
}: LogNewSessionModalProps) {
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [stake, setStake] = useState<number | ''>('');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [handsStartedAt, setHandsStartedAt] = useState<string>('');
  const [handsEndedAt, setHandsEndedAt] = useState<string>('');
  const [dailyNet, setDailyNet] = useState<string>('');

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setHandsStartedAt(String(totalHandsSoFar));
      setHandsEndedAt('');
      setStartTime('');
      setEndTime('');
      setDailyNet('');
    }
  }, [open, totalHandsSoFar]);

  const totalTimeFromTimes =
    startTime && endTime
      ? (() => {
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          const startMins = (sh ?? 0) * 60 + (sm ?? 0);
          let endMins = (eh ?? 0) * 60 + (em ?? 0);
          if (endMins < startMins) endMins += 24 * 60;
          return (endMins - startMins) / 60;
        })()
      : null;

  const startNum = handsStartedAt.trim() ? parseInt(handsStartedAt.replace(/,/g, ''), 10) : 0;
  const endNum = handsEndedAt.trim() ? parseInt(handsEndedAt.replace(/,/g, ''), 10) : 0;
  const handsPlayed = !Number.isNaN(startNum) && !Number.isNaN(endNum) && endNum >= startNum
    ? endNum - startNum
    : null;

  const handleSubmit = useCallback(async () => {
    if (handsPlayed == null || handsPlayed < 0) {
      onError('Enter valid hands started and hands ended.');
      return;
    }
    setSaving(true);
    try {
      const sessionDate = date ? `${date}T12:00:00` : new Date().toISOString();
      const payload: SessionResultCreate = {
        date: sessionDate,
        totalTime: totalTimeFromTimes != null ? Math.round(totalTimeFromTimes * 100) / 100 : undefined,
        hands: handsPlayed,
        dailyNet: dailyNet.trim() ? Number(dailyNet.replace(/[$,]/g, '')) : undefined,
        startTime: startTime ? `${date}T${startTime}:00` : undefined,
        endTime: endTime ? `${date}T${endTime}:00` : undefined,
        stake: stake === '' ? undefined : stake,
        isRing: isRing || undefined,
        isHU: isHU || undefined,
        gameType,
      };
      await onAddSession(payload);
      onSuccess('Session logged.');
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to log session');
    } finally {
      setSaving(false);
    }
  }, [
    date,
    startTime,
    endTime,
    stake,
    isRing,
    isHU,
    gameType,
    handsPlayed,
    dailyNet,
    totalTimeFromTimes,
    onAddSession,
    onSuccess,
    onError,
    onClose,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Log new session</DialogTitle>
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Start"
              type="time"
              size="small"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="End"
              type="time"
              size="small"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            label="Hands started at"
            type="number"
            size="small"
            value={handsStartedAt}
            onChange={(e) => setHandsStartedAt(e.target.value)}
            placeholder={String(totalHandsSoFar)}
            helperText="Your total hands before this session"
            fullWidth
          />
          <TextField
            label="Hands ended at"
            type="number"
            size="small"
            value={handsEndedAt}
            onChange={(e) => setHandsEndedAt(e.target.value)}
            helperText={handsPlayed != null ? `${handsPlayed.toLocaleString()} hands this session` : ''}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Stake"
              size="small"
              value={stake === '' ? '' : stake}
              onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value) || '')}
              sx={{ minWidth: 90 }}
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
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="NLHE">NLHE</MenuItem>
              <MenuItem value="PLO">PLO</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Checkbox checked={isRing} onChange={(e) => setIsRing(e.target.checked)} size="small" />}
              label="Ring"
            />
            <FormControlLabel
              control={<Checkbox checked={isHU} onChange={(e) => setIsHU(e.target.checked)} size="small" />}
              label="HU"
            />
            <TextField
              label="Net"
              size="small"
              value={dailyNet}
              onChange={(e) => setDailyNet(e.target.value)}
              placeholder="$0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ width: 110 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || handsPlayed == null || handsPlayed < 0}
        >
          {saving ? 'Logging…' : 'Log session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
