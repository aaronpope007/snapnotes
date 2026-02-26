import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useUserName, useSetUserName } from '../context/UserNameContext';

interface ChangeNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export function ChangeNameDialog({ open, onClose, onSuccess }: ChangeNameDialogProps) {
  const userName = useUserName();
  const setUserName = useSetUserName();
  const [value, setValue] = useState(userName ?? '');

  useEffect(() => {
    if (open) {
      setValue(userName ?? '');
    }
  }, [open, userName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      setUserName(trimmed);
      onSuccess?.('Name updated');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change your name</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Your name is used when adding notes, comments, and ratings.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Your name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Aaron Pope"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!value.trim()}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
