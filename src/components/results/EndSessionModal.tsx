import { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import type { SessionResultCreate } from '../../types/results';
import { RESULTS_STAKE_OPTIONS } from '../../types/results';
import type { ActiveSession } from '../../utils/activeSession';

interface EndSessionModalProps {
  open: boolean;
  onClose: () => void;
  activeSession: ActiveSession;
  lastEndBankroll: number | null;
  onEndSession: (payload: SessionResultCreate) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function computeHoursBetween(startIso: string, endDate: Date): number {
  const start = new Date(startIso).getTime();
  const end = endDate.getTime();
  return (end - start) / (1000 * 60 * 60);
}

/** Allow only digits, optional one decimal point, optional leading minus. */
function sanitizeBankrollInput(val: string): string {
  let s = val.replace(/[^\d.-]/g, '');
  if (s.startsWith('-')) s = '-' + s.slice(1).replace(/-/g, '');
  else s = s.replace(/-/g, '');
  const dotIdx = s.indexOf('.');
  if (dotIdx >= 0) s = s.slice(0, dotIdx + 1) + s.slice(dotIdx + 1).replace(/\./g, '');
  return s;
}

/** Allow only digits. */
function sanitizeHandNumberInput(val: string): string {
  return val.replace(/\D/g, '');
}

export function EndSessionModal({
  open,
  onClose,
  activeSession,
  lastEndBankroll,
  onEndSession,
  onSuccess,
  onError,
}: EndSessionModalProps) {
  const [endBankroll, setEndBankroll] = useState('');
  const [startBankroll, setStartBankroll] = useState('');
  const [startTimeEditable, setStartTimeEditable] = useState('');
  const [endingHandNumber, setEndingHandNumber] = useState('');
  const [stake, setStake] = useState<number | ''>('');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const startTimeIso = startTimeEditable.trim()
    ? (() => {
        const d = new Date(startTimeEditable);
        return Number.isNaN(d.getTime()) ? activeSession.startTime : d.toISOString();
      })()
    : activeSession.startTime;
  const totalTimeHours = computeHoursBetween(startTimeIso, now);
  const startDate = new Date(startTimeIso);

  const endBankrollNum = endBankroll.trim() ? parseFloat(endBankroll.replace(/[$,]/g, '')) : null;
  const startBankrollNum =
    lastEndBankroll != null
      ? lastEndBankroll
      : startBankroll.trim()
        ? parseFloat(startBankroll.replace(/[$,]/g, ''))
        : null;
  const dailyNet =
    endBankrollNum != null && startBankrollNum != null && !Number.isNaN(endBankrollNum) && !Number.isNaN(startBankrollNum)
      ? endBankrollNum - startBankrollNum
      : null;

  const endHandNum = endingHandNumber.trim() ? parseInt(endingHandNumber.replace(/,/g, ''), 10) : null;
  const hands =
    endHandNum != null && !Number.isNaN(endHandNum) && endHandNum >= activeSession.startHandNumber
      ? endHandNum - activeSession.startHandNumber
      : null;

  useEffect(() => {
    if (open) {
      setEndBankroll('');
      setStartBankroll(lastEndBankroll != null ? String(lastEndBankroll) : '');
      setEndingHandNumber('');
      setStake('');
      setIsRing(false);
      setIsHU(false);
      setGameType('NLHE');
    }
  }, [open, lastEndBankroll]);

  const handleSubmit = useCallback(async () => {
    if (endBankrollNum == null || Number.isNaN(endBankrollNum)) {
      onError('Enter your end bankroll amount.');
      return;
    }
    if (startBankrollNum == null || Number.isNaN(startBankrollNum)) {
      onError('Enter start bankroll (or we use your last session’s end bankroll).');
      return;
    }
    setSaving(true);
    try {
      const localDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const payload: SessionResultCreate = {
        date: localDateStr,
        startTime: startTimeIso,
        endTime: now.toISOString(),
        totalTime: Math.round(totalTimeHours * 100) / 100,
        hands: hands ?? undefined,
        handsStartedAt: activeSession.startHandNumber,
        handsEndedAt: endHandNum != null && !Number.isNaN(endHandNum) ? endHandNum : undefined,
        dailyNet: dailyNet ?? undefined,
        endBankroll: endBankrollNum,
        stake: stake === '' ? undefined : stake,
        isRing: isRing || undefined,
        isHU: isHU || undefined,
        gameType,
      };
      await onEndSession(payload);
      onSuccess(`Session ended. ${dailyNet != null ? (dailyNet >= 0 ? `+$${dailyNet.toFixed(2)}` : `−$${Math.abs(dailyNet).toFixed(2)}`) : ''}`);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setSaving(false);
    }
  }, [
    endBankrollNum,
    startBankrollNum,
    dailyNet,
    hands,
    totalTimeHours,
    startTimeEditable,
    activeSession.startTime,
    activeSession.startHandNumber,
    stake,
    isRing,
    isHU,
    gameType,
    endHandNum,
    onEndSession,
    onSuccess,
    onError,
    onClose,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>End session</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
          <TextField
            label="Start time"
            type="datetime-local"
            size="small"
            value={startTimeEditable}
            onChange={(e) => setStartTimeEditable(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Time played: {totalTimeHours.toFixed(2)} hrs
          </Typography>
          {lastEndBankroll != null ? (
            <Typography variant="body2" color="text.secondary">
              Start bankroll (from last session): ${lastEndBankroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          ) : (
            <TextField
              label="Start bankroll"
              size="small"
              value={startBankroll}
              onChange={(e) => setStartBankroll(sanitizeBankrollInput(e.target.value))}
              placeholder="0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              fullWidth
              helperText="First session? Enter bankroll at start."
            />
          )}
          <TextField
            label="End bankroll"
            size="small"
            value={endBankroll}
            onChange={(e) => setEndBankroll(sanitizeBankrollInput(e.target.value))}
            placeholder="0.00"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            fullWidth
            required
          />
          {dailyNet != null && (
            <Box>
              <Typography variant="body2" sx={{ color: dailyNet >= 0 ? 'success.main' : 'error.main', fontWeight: 500 }}>
                Net: {dailyNet >= 0 ? '+' : '−'}${Math.abs(dailyNet).toFixed(2)}
              </Typography>
              {hands != null && hands > 0 && (
                <Typography variant="caption" color="text.secondary">
                  $/hand: ${(dailyNet / hands).toFixed(2)}
                </Typography>
              )}
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            Starting hand number: {activeSession.startHandNumber.toLocaleString()}
          </Typography>
          <TextField
            label="Ending hand number"
            size="small"
            value={endingHandNumber}
            onChange={(e) => setEndingHandNumber(sanitizeHandNumberInput(e.target.value))}
            placeholder={String(activeSession.startHandNumber)}
            helperText={
              hands != null ? `${hands.toLocaleString()} hands this session` : 'Optional. Your total hand count at session end.'
            }
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || endBankrollNum == null || Number.isNaN(endBankrollNum) || startBankrollNum == null || Number.isNaN(startBankrollNum)}
        >
          {saving ? 'Saving…' : 'End session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
