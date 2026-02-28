import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useDefaultStakes, useSetDefaultStakes, type DefaultStakes } from '../context/DefaultStakesContext';
import { STAKE_VALUES } from '../types';
import { GAME_TYPE_OPTIONS, FORMAT_OPTIONS, ORIGIN_OPTIONS } from '../constants/stakes';

interface DefaultStakesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DefaultStakesDialog({ open, onClose }: DefaultStakesDialogProps) {
  const defaultStakes = useDefaultStakes();
  const setDefaultStakes = useSetDefaultStakes();

  const [stakesSeenAt, setStakesSeenAt] = useState<number[]>(defaultStakes.stakesSeenAt);
  const [gameTypes, setGameTypes] = useState<string[]>(defaultStakes.gameTypes);
  const [formats, setFormats] = useState<string[]>(defaultStakes.formats);
  const [origin, setOrigin] = useState(defaultStakes.origin);

  useEffect(() => {
    if (open) {
      setStakesSeenAt(defaultStakes.stakesSeenAt);
      setGameTypes(defaultStakes.gameTypes);
      setFormats(defaultStakes.formats);
      setOrigin(defaultStakes.origin);
    }
  }, [open, defaultStakes.stakesSeenAt, defaultStakes.gameTypes, defaultStakes.formats, defaultStakes.origin]);

  const handleSave = () => {
    const next: DefaultStakes = {
      stakesSeenAt,
      gameTypes,
      formats,
      origin,
    };
    setDefaultStakes(next);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Default stakes for new players</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Pre-fill these when adding players to save time if you usually play the same stakes.
        </DialogContentText>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Games
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {GAME_TYPE_OPTIONS.map((g) => (
            <FormControlLabel
              key={g}
              control={
                <Checkbox size="small" checked={gameTypes.includes(g)} onChange={() => handleGameTypeToggle(g)} />
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
                <Checkbox size="small" checked={formats.includes(f)} onChange={() => handleFormatToggle(f)} />
              }
              label={f}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Stakes
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
          <Select value={origin} label="Site" onChange={(e) => setOrigin(e.target.value)}>
            {ORIGIN_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
