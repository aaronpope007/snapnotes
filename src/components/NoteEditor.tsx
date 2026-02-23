import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { NoteDisplay } from './NoteDisplay';
import { RichNoteRenderer } from './RichNoteRenderer';
import { AppendNote } from './AppendNote';
import { parseExploitsFromRawNote } from '../utils/importParser';

interface NoteEditorProps {
  rawNote: string;
  onSave: (rawNote: string, exploits: string[]) => Promise<void>;
  onAppend: (text: string) => Promise<void>;
}

export function NoteEditor({ rawNote, onSave, onAppend }: NoteEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(rawNote);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const exploits = parseExploitsFromRawNote(editValue);
      await onSave(editValue, exploits);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(rawNote);
    setEditing(false);
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
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Preview
          </Typography>
          <Box sx={{ fontSize: '0.9rem', lineHeight: 1.6, minHeight: 24, mb: 1, whiteSpace: 'pre-wrap' }}>
            {editValue ? <RichNoteRenderer text={editValue} /> : null}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={handleSave} disabled={loading}>
              Save
            </Button>
            <Button variant="outlined" size="small" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <NoteDisplay text={rawNote} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditValue(rawNote);
                setEditing(true);
              }}
            >
              Edit
            </Button>
            <AppendNote onAppend={onAppend} />
          </Box>
        </>
      )}
    </Box>
  );
}
