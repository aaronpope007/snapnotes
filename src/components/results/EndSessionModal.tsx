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
import type { SessionResultCreate, SessionRating } from '../../types/results';
import { RESULTS_STAKE_OPTIONS, SESSION_RATING_OPTIONS } from '../../types/results';
import type { ActiveSession } from '../../utils/activeSession';
import { finalizePauseIntervalsForEnd } from '../../utils/activeSession';
import { getPlayingHoursFromWallAndPauses } from '../../utils/sessionPause';

interface EndSessionModalProps {
  open: boolean;
  onClose: () => void;
  activeSession: ActiveSession;
  lastEndBankroll: number | null;
  onEndSession: (payload: SessionResultCreate) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onAddLeak?: (title: string) => Promise<void>;
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
  onAddLeak,
}: EndSessionModalProps) {
  const [endBankroll, setEndBankroll] = useState('');
  const [startBankroll, setStartBankroll] = useState('');
  const [startTimeEditable, setStartTimeEditable] = useState('');
  const [endingHandNumber, setEndingHandNumber] = useState('');
  const [stake, setStake] = useState<number | ''>('');
  const [rating, setRating] = useState<SessionRating | ''>('');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [trackLeakOpen, setTrackLeakOpen] = useState(false);
  const [leakTitle, setLeakTitle] = useState('');
  const [trackingSaving, setTrackingSaving] = useState(false);

  const now = new Date();
  const startTimeIso = startTimeEditable.trim()
    ? (() => {
        const d = new Date(startTimeEditable);
        return Number.isNaN(d.getTime()) ? activeSession.startTime : d.toISOString();
      })()
    : activeSession.startTime;
  const endIso = now.toISOString();
  const closedPauseIntervals = finalizePauseIntervalsForEnd(activeSession, endIso);
  const totalTimeHours = getPlayingHoursFromWallAndPauses(startTimeIso, endIso, closedPauseIntervals);
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
      setRating('');
      setIsRing(false);
      setIsHU(false);
      setGameType('NLHE');
      setNotes('');
      setTrackLeakOpen(false);
      setLeakTitle('');
    }
  }, [open, lastEndBankroll]);

  useEffect(() => {
    if (trackLeakOpen) setLeakTitle(notes.trim());
  }, [trackLeakOpen, notes]);

  const handleTrackLeak = useCallback(async () => {
    if (!leakTitle.trim() || !onAddLeak) return;
    setTrackingSaving(true);
    try {
      await onAddLeak(leakTitle.trim());
      setTrackLeakOpen(false);
      setLeakTitle('');
    } catch {
      // error handled by parent
    } finally {
      setTrackingSaving(false);
    }
  }, [leakTitle, onAddLeak]);

  const handleSubmit = useCallback(async () => {
    if (endBankrollNum == null || Number.isNaN(endBankrollNum)) {
      onError('Enter your end bankroll amount.');
      return;
    }
    if (startBankrollNum == null || Number.isNaN(startBankrollNum)) {
      onError('Enter start bankroll (or we use your last session’s end bankroll).');
      return;
    }
    if (rating === '') {
      onError('Select how you played (rating).');
      return;
    }
    setSaving(true);
    try {
      const localDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const payload: SessionResultCreate = {
        date: localDateStr,
        startTime: startTimeIso,
        endTime: endIso,
        totalTime: Math.round(totalTimeHours * 100) / 100,
        ...(closedPauseIntervals.length > 0 ? { pauseIntervals: closedPauseIntervals } : {}),
        hands: hands ?? undefined,
        handsStartedAt: activeSession.startHandNumber,
        handsEndedAt: endHandNum != null && !Number.isNaN(endHandNum) ? endHandNum : undefined,
        dailyNet: dailyNet ?? undefined,
        endBankroll: endBankrollNum,
        stake: stake === '' ? undefined : stake,
        rating: rating as SessionRating,
        isRing: isRing || undefined,
        isHU: isHU || undefined,
        gameType,
        notes: notes.trim() || null,
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
    activeSession,
    closedPauseIntervals,
    endIso,
    stake,
    isRing,
    isHU,
    gameType,
    endHandNum,
    rating,
    notes,
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
          <TextField
            select
            label="How did you play?"
            size="small"
            value={rating}
            onChange={(e) => setRating((e.target.value || '') as SessionRating | '')}
            fullWidth
            required
            helperText="Rate your play (required)"
          >
            <MenuItem value="">Select…</MenuItem>
            {SESSION_RATING_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
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
          <TextField
            label="Session notes / journal"
            size="small"
            multiline
            minRows={2}
            maxRows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={"What went well? What did you do poorly?\nWhat to focus on next session?"}
            fullWidth
          />
          {onAddLeak && notes.trim() && (
            <Box>
              {!trackLeakOpen ? (
                <Box
                  component="span"
                  onClick={() => setTrackLeakOpen(true)}
                  sx={{ fontSize: '0.78rem', color: 'warning.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  → Track as leak
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={leakTitle}
                    onChange={(e) => setLeakTitle(e.target.value)}
                    placeholder="Leak title"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleTrackLeak(); } }}
                  />
                  <Button size="small" variant="outlined" onClick={() => void handleTrackLeak()} disabled={trackingSaving || !leakTitle.trim()} sx={{ whiteSpace: 'nowrap', minWidth: 60 }}>
                    Add
                  </Button>
                  <Button size="small" onClick={() => setTrackLeakOpen(false)} sx={{ minWidth: 0, px: 0.5 }}>✕</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || endBankrollNum == null || Number.isNaN(endBankrollNum) || startBankrollNum == null || Number.isNaN(startBankrollNum) || rating === ''}
        >
          {saving ? 'Saving…' : 'End session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
