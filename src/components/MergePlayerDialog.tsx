import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { PlayerListItem } from '../types';

interface MergePlayerDialogProps {
  open: boolean;
  onClose: () => void;
  sourcePlayer: PlayerListItem;
  players: PlayerListItem[];
  onConfirm: (targetId: string) => Promise<void>;
  loading?: boolean;
}

export function MergePlayerDialog({
  open,
  onClose,
  sourcePlayer,
  players,
  onConfirm,
  loading = false,
}: MergePlayerDialogProps) {
  const [targetId, setTargetId] = useState('');
  const options = players.filter((p) => p._id !== sourcePlayer._id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetId) void onConfirm(targetId).then(() => { setTargetId(''); onClose(); });
  };

  const handleClose = () => {
    setTargetId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Merge into another player</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Merge &quot;{sourcePlayer.username}&quot; into another player. All notes and hand histories will be
            combined; the source player will be deleted.
          </DialogContentText>
          <FormControl fullWidth size="small" required>
            <InputLabel id="merge-target-label">Target player</InputLabel>
            <Select
              labelId="merge-target-label"
              label="Target player"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={options.length === 0}
            >
              {options.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading || !targetId}>
            {loading ? 'Merging…' : 'Merge'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
