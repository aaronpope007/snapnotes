import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface DeleteCommentConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

export function DeleteCommentConfirmDialog({
  open,
  onClose,
  onConfirm,
  confirming,
}: DeleteCommentConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete comment?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this comment? This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={confirming}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
