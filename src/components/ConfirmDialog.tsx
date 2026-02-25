import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** If true, confirm button uses color error (e.g. for destructive discard). */
  confirmDanger?: boolean;
}

const DEFAULT_OPTIONS: Required<ConfirmDialogOptions> = {
  title: 'Discard changes?',
  message: 'Are you sure you want to discard your changes?',
  confirmText: 'Discard',
  cancelText: 'Cancel',
  confirmDanger: true,
};

interface ConfirmDialogProps extends ConfirmDialogOptions {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = DEFAULT_OPTIONS.title,
  message = DEFAULT_OPTIONS.message,
  confirmText = DEFAULT_OPTIONS.confirmText,
  cancelText = DEFAULT_OPTIONS.cancelText,
  confirmDanger = DEFAULT_OPTIONS.confirmDanger,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          variant="contained"
          color={confirmDanger ? 'error' : 'primary'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
