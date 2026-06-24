import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { NoteWithCardPicker } from './NoteWithCardPicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useDirtyFormClose } from '../hooks/useDirtyFormClose';

interface AppendNoteProps {
  onAppend: (text: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

export function AppendNote({ onAppend, onDirtyChange }: AppendNoteProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    confirmOpen,
    closeConfirm,
    handleConfirm,
    confirmOptions,
    requestClose: requestDirtyClose,
  } = useDirtyFormClose({
    message: 'You have an unsaved note. Discard it?',
  });

  const isDirty = open && value.trim() !== '';

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const closeEditor = () => {
    setOpen(false);
    setValue('');
  };

  const handleCancel = () => {
    requestDirtyClose(isDirty, closeEditor);
  };

  const handleSubmit = async () => {
    const text = value.trim();
    if (!text) {
      setOpen(false);
      setValue('');
      return;
    }
    setLoading(true);
    try {
      await onAppend(text);
      setValue('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outlined" size="small" onClick={() => setOpen(true)}>
        Append
      </Button>
    );
  }

  return (
    <>
    <Box sx={{ mt: 1 }}>
      <NoteWithCardPicker
        value={value}
        onChange={setValue}
        placeholder="Append new line..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => void handleSubmit()}
          disabled={loading || !value.trim()}
        >
          Append
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </Box>
    </Box>
    <ConfirmDialog
      open={confirmOpen}
      onClose={closeConfirm}
      onConfirm={handleConfirm}
      {...confirmOptions}
    />
    </>
  );
}
