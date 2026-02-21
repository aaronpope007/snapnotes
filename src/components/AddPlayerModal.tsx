import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
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
import {
  STAKE_VALUES,
  PLAYER_TYPES,
  PLAYER_TYPE_COLORS,
  type PlayerType,
  type PlayerCreate,
} from '../types';

interface AddPlayerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (player: PlayerCreate) => Promise<void>;
}

export function AddPlayerModal({ open, onClose, onSubmit }: AddPlayerModalProps) {
  const [username, setUsername] = useState('');
  const [playerType, setPlayerType] = useState<PlayerType>('Unknown');
  const [stakesSeenAt, setStakesSeenAt] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUsername('');
    setPlayerType('Unknown');
    setStakesSeenAt([]);
    setNotes('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleStakeToggle = (stake: number) => {
    setStakesSeenAt((prev) =>
      prev.includes(stake) ? prev.filter((s) => s !== stake) : [...prev, stake].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onSubmit({
        username: trimmed,
        playerType,
        stakesSeenAt: stakesSeenAt.length ? stakesSeenAt : undefined,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add New Player</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
        />
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Player Type</InputLabel>
          <Select
            value={playerType}
            label="Player Type"
            onChange={(e) => setPlayerType(e.target.value as PlayerType)}
          >
            {PLAYER_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: PLAYER_TYPE_COLORS[t],
                    }}
                  />
                  {t}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <TextField
          fullWidth
          label="Initial notes"
          multiline
          minRows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
  );
}
