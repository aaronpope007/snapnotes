import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useUserName } from '../context/UserNameContext';
import {
  PLAYER_TYPE_KEYS,
  getPlayerTypeColor,
  getPlayerTypeLabel,
} from '../constants/playerTypes';
import type { PlayerTypeKey, PlayerCreate, NoteEntry } from '../types';
import { STAKE_VALUES, GAME_TYPE_OPTIONS, FORMAT_OPTIONS, ORIGIN_OPTIONS } from '../types';

interface AddPlayerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (player: PlayerCreate) => Promise<void>;
  initialUsername?: string;
}

export function AddPlayerModal({ open, onClose, onSubmit, initialUsername }: AddPlayerModalProps) {
  const userName = useUserName();
  const [username, setUsername] = useState('');
  const [playerType, setPlayerType] = useState<PlayerTypeKey>('unknown');
  const [gameTypes, setGameTypes] = useState<string[]>([]);
  const [stakesSeenAt, setStakesSeenAt] = useState<number[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [origin, setOrigin] = useState('WPT Gold');
  const [rawNote, setRawNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const initialUsernameValue = initialUsername ?? '';
  const isDirty =
    username !== initialUsernameValue ||
    playerType !== 'unknown' ||
    gameTypes.length > 0 ||
    stakesSeenAt.length > 0 ||
    formats.length > 0 ||
    rawNote.trim() !== '';

  useEffect(() => {
    if (open && initialUsername) {
      setUsername(initialUsername);
    }
  }, [open, initialUsername]);

  const reset = () => {
    setUsername('');
    setPlayerType('unknown');
    setGameTypes([]);
    setStakesSeenAt([]);
    setFormats([]);
    setOrigin('WPT Gold');
    setRawNote('');
    setLoading(false);
  };

  const handleClose = () => {
    if (isDirty) {
      setConfirmCloseOpen(true);
      return;
    }
    doClose();
  };

  const doClose = () => {
    setConfirmCloseOpen(false);
    reset();
    onClose();
  };

  const handleStakeToggle = (stake: number) => {
    setStakesSeenAt((prev) =>
      prev.includes(stake) ? prev.filter((s) => s !== stake) : [...prev, stake].sort((a, b) => a - b)
    );
  };

  const handleFormatToggle = (format: string) => {
    setFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const handleGameTypeToggle = (gameType: string) => {
    setGameTypes((prev) =>
      prev.includes(gameType) ? prev.filter((g) => g !== gameType) : [...prev, gameType]
    );
  };

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const note = rawNote.trim();
    setLoading(true);
    try {
      const notes: NoteEntry[] | undefined =
        note && userName
          ? [
              {
                text: note,
                addedBy: userName,
                addedAt: new Date().toISOString(),
              },
            ]
          : undefined;
      await onSubmit({
        username: trimmed,
        playerType,
        gameTypes: gameTypes.length ? gameTypes : undefined,
        stakesSeenAt: stakesSeenAt.length ? stakesSeenAt : undefined,
        formats: formats.length ? formats : undefined,
        origin: origin || 'WPT Gold',
        notes,
      });
      doClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add New Player</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (username.trim() && !loading) handleSubmit();
            }
          }}
          margin="normal"
        />
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Player Type</InputLabel>
          <Select
            value={playerType}
            label="Player Type"
            onChange={(e) => setPlayerType(e.target.value as PlayerTypeKey)}
          >
            {PLAYER_TYPE_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: getPlayerTypeColor(key),
                    }}
                  />
                  {getPlayerTypeLabel(key)}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Games
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {GAME_TYPE_OPTIONS.map((g) => (
            <FormControlLabel
              key={g}
              control={
                <Checkbox
                  size="small"
                  checked={gameTypes.includes(g)}
                  onChange={() => handleGameTypeToggle(g)}
                />
              }
              label={g}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Format
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {FORMAT_OPTIONS.map((f) => (
            <FormControlLabel
              key={f}
              control={
                <Checkbox
                  size="small"
                  checked={formats.includes(f)}
                  onChange={() => handleFormatToggle(f)}
                />
              }
              label={f}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Stakes seen at
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {STAKE_VALUES.map((s) => (
            <FormControlLabel
              key={s}
              control={
                <Checkbox
                  size="small"
                  checked={stakesSeenAt.includes(s)}
                  onChange={() => handleStakeToggle(s)}
                />
              }
              label={s}
            />
          ))}
        </Box>
        <FormControl fullWidth size="small" margin="normal">
          <InputLabel>Site</InputLabel>
          <Select
            value={origin}
            label="Site"
            onChange={(e) => setOrigin(e.target.value)}
          >
            {ORIGIN_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Initial notes"
          multiline
          minRows={3}
          value={rawNote}
          onChange={(e) => setRawNote(e.target.value)}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!username.trim() || loading}>
          Add Player
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
      <DialogTitle>Discard changes?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have unsaved changes. Are you sure you want to close without adding this player?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmCloseOpen(false)}>Keep Editing</Button>
        <Button color="error" variant="contained" onClick={doClose}>
          Discard
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
