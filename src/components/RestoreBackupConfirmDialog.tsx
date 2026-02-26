import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface RestoreBackupConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  playerCount: number;
  handsToReviewCount: number;
  loading?: boolean;
}

export function RestoreBackupConfirmDialog({
  open,
  onClose,
  onConfirm,
  playerCount,
  handsToReviewCount,
  loading = false,
}: RestoreBackupConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Restore from backup?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will replace all current data with the backup: {playerCount} player{playerCount !== 1 ? 's' : ''} and{' '}
          {handsToReviewCount} hand{handsToReviewCount !== 1 ? 's' : ''} to review. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={() => void onConfirm()} disabled={loading}>
          {loading ? 'Restoring…' : 'Restore'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
