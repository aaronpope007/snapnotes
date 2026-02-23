import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { RichNoteRenderer } from './RichNoteRenderer';

interface AppendNoteProps {
  onAppend: (text: string) => Promise<void>;
}

export function AppendNote({ onAppend }: AppendNoteProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

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
    <Box sx={{ mt: 1 }}>
      <TextField
        fullWidth
        placeholder="Append new line..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        size="small"
        autoFocus
      />
      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Preview
      </Typography>
      <Box sx={{ fontSize: '0.9rem', lineHeight: 1.6, minHeight: 24, mb: 1 }}>
        {value ? <RichNoteRenderer text={value} /> : null}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
        >
          Append
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setOpen(false);
            setValue('');
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
