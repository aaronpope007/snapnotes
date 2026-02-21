import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { NoteDisplay } from './NoteDisplay';

interface NoteEditorProps {
  notes: string;
  onSave: (notes: string) => Promise<void>;
  onAppend: (text: string) => Promise<void>;
}

export function NoteEditor({ notes, onSave, onAppend }: NoteEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(notes);
  const [appendOpen, setAppendOpen] = useState(false);
  const [appendValue, setAppendValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(notes);
    setEditing(false);
  };

  const handleAppendSubmit = async () => {
    const text = appendValue.trim();
    if (!text) {
      setAppendOpen(false);
      setAppendValue('');
      return;
    }
    setLoading(true);
    try {
      await onAppend(text);
      setAppendValue('');
      setAppendOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {editing ? (
        <Box>
          <TextField
            fullWidth
            multiline
            minRows={6}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={loading}
            >
              Save
            </Button>
            <Button variant="outlined" size="small" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <NoteDisplay notes={notes} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAppendOpen(true)}
            >
              Append
            </Button>
          </Box>
        </>
      )}

      {appendOpen && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            placeholder="Append new line..."
            value={appendValue}
            onChange={(e) => setAppendValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAppendSubmit();
              }
            }}
            size="small"
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleAppendSubmit}
              disabled={loading || !appendValue.trim()}
            >
              Append
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setAppendOpen(false);
                setAppendValue('');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
