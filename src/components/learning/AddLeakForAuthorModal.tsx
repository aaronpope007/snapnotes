import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

interface AddLeakForAuthorModalProps {
  open: boolean;
  onClose: () => void;
  authorName: string;
  handTitle?: string;
  saving: boolean;
  onSubmit: (title: string) => Promise<void>;
}

export function AddLeakForAuthorModal({
  open,
  onClose,
  authorName,
  handTitle,
  saving,
  onSubmit,
}: AddLeakForAuthorModalProps) {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) setDescription('');
  }, [open]);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    await onSubmit(description.trim());
    setDescription('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add leak for {authorName}</DialogTitle>
      <DialogContent>
        {handTitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Hand: {handTitle}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Describe a leak you noticed. It will be added to {authorName}&apos;s learning list for them to review later.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="e.g. Overcalling river bets too wide in multiway pots"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          sx={{ mt: 0.5 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || !description.trim()}
        >
          {saving ? 'Adding...' : 'Add leak'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
