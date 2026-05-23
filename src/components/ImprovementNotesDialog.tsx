import { useState, useEffect, useCallback, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useUserCredentials } from '../context/UserNameContext';
import { getImprovementNotes, saveImprovementNotes } from '../api/me';
import { ConfirmDialog } from './ConfirmDialog';
import { useDirtyFormClose } from '../hooks/useDirtyFormClose';

interface ImprovementNotesDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenChangeName?: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function ImprovementNotesDialog({
  open,
  onClose,
  onOpenChangeName,
  onSuccess,
  onError,
}: ImprovementNotesDialogProps) {
  const { userName, userPassword, isClaimedUser } = useUserCredentials();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedBaselineRef = useRef('');

  const {
    confirmOpen,
    closeConfirm,
    handleConfirm,
    confirmOptions,
    requestClose: requestDirtyClose,
  } = useDirtyFormClose();

  const loadNotes = useCallback(async () => {
    if (!userName || !userPassword) return;
    setLoading(true);
    try {
      const data = await getImprovementNotes(userName, userPassword);
      const text = data ?? '';
      loadedBaselineRef.current = text;
      setContent(text);
    } catch {
      onError?.('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }, [userName, userPassword, onError]);

  useEffect(() => {
    if (open && isClaimedUser) void loadNotes();
  }, [open, isClaimedUser, loadNotes]);

  const isDirty = isClaimedUser && content !== loadedBaselineRef.current;
  const requestClose = () => requestDirtyClose(isDirty, onClose);

  const handleSave = async () => {
    if (!userName || !userPassword) return;
    setSaving(true);
    try {
      await saveImprovementNotes(userName, userPassword, content);
      onSuccess?.('Notes saved');
      onClose();
    } catch {
      onError?.('Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={requestClose} maxWidth="sm" fullWidth>
      <DialogTitle>Improvement notes</DialogTitle>
      <DialogContent>
        {!isClaimedUser ? (
          <DialogContentText>
            Set a password in &quot;Change my name&quot; to claim your name and use improvement
            notes. Your notes are private and sync across devices when you log in with the same name
            and password.
          </DialogContentText>
        ) : loading ? (
          <DialogContentText color="text.secondary">Loading…</DialogContentText>
        ) : (
          <TextField
            fullWidth
            multiline
            minRows={8}
            maxRows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Things to work on to improve your game…"
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        {!isClaimedUser && onOpenChangeName && (
          <Button onClick={onOpenChangeName} color="primary">
            Change my name
          </Button>
        )}
        <Button onClick={requestClose}>{isClaimedUser ? 'Cancel' : 'Close'}</Button>
        {isClaimedUser && (
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
    <ConfirmDialog
      open={confirmOpen}
      onClose={closeConfirm}
      onConfirm={handleConfirm}
      {...confirmOptions}
    />
    </>
  );
}
