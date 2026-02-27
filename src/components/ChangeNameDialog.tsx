import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useUserName, useUserCredentials } from '../context/UserNameContext';
import { isNameClaimed, claimName, login } from '../api/me';

interface ChangeNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export function ChangeNameDialog({ open, onClose, onSuccess }: ChangeNameDialogProps) {
  const userName = useUserName();
  const { setCredentials } = useUserCredentials();
  const [name, setName] = useState(userName ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(userName ?? '');
      setPassword('');
      setError(null);
    }
  }, [open, userName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(null);
    if (!password.trim()) {
      setError('Password is required to protect your name and use improvement notes.');
      return;
    }
    setSubmitting(true);
    try {
      const claimed = await isNameClaimed(trimmedName);
      if (claimed) {
        await login(trimmedName, password);
      } else {
        await claimName(trimmedName, password);
      }
      setCredentials(trimmedName, password);
      onSuccess?.('Name updated');
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err && typeof (err as { response: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response: { data: { error: string } } }).response.data.error
          : 'Failed to save. Try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change your name</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Your name is used when adding notes, comments, and ratings. Set a password to protect
            your name (others can&apos;t use it) and to use &quot;Improvement notes&quot; on other
            devices.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aaron Pope"
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Required to claim or log in"
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!name.trim() || !password || submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
