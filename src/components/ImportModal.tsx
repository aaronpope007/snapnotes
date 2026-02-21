import { useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import mammoth from 'mammoth';
import { parseImportText } from '../utils/importParser';
import type { ImportPlayer } from '../types';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (players: ImportPlayer[]) => Promise<{ created: number; updated: number }>;
  existingUsernames: Set<string>;
}

export function ImportModal({
  open,
  onClose,
  onImport,
  existingUsernames,
}: ImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ImportPlayer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const reset = () => {
    setRawText('');
    setParsed(null);
    setLoading(false);
    setStep('input');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      if (file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type. Use .txt or .docx.'));
      }
    });
  };

  const extractDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      try {
        let text: string;
        if (file.name.endsWith('.txt')) {
          text = await readFileAsText(file);
        } else if (file.name.endsWith('.docx')) {
          text = await extractDocxText(file);
        } else {
          setRawText('');
          return;
        }
        setRawText(text);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    },
    []
  );

  const handleParse = () => {
    const players = parseImportText(rawText);
    setParsed(players);
    setStep('preview');
  };

  const handleConfirmImport = async () => {
    if (!parsed || parsed.length === 0) return;
    setLoading(true);
    try {
      await onImport(parsed);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setParsed(null);
  };

  const newCount = parsed?.filter((p) => !existingUsernames.has(p.username)).length ?? 0;
  const existingCount = (parsed?.length ?? 0) - newCount;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Notes</DialogTitle>
      <DialogContent>
        {step === 'input' ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Paste raw text below or upload a .txt or .docx file. Format:
            </Typography>
            <Typography
              component="pre"
              variant="caption"
              sx={{
                bgcolor: 'action.hover',
                p: 1,
                borderRadius: 1,
                mb: 1,
                overflow: 'auto',
              }}
            >
              {`PlayerName - [stake] [type] - [note text]
**observation line
more lines...`}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={12}
              placeholder="Paste notes here or upload a file..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Button variant="outlined" component="label" disabled={loading}>
              Upload .txt or .docx
              <input
                type="file"
                accept=".txt,.docx"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Found {parsed?.length ?? 0} player(s): {newCount} new, {existingCount} existing (notes
              will be appended).
            </Typography>
            <Box
              sx={{
                maxHeight: 240,
                overflow: 'auto',
                bgcolor: 'action.hover',
                borderRadius: 1,
                p: 1,
              }}
            >
              {parsed?.map((p, i) => (
                <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                  {p.username}
                  {existingUsernames.has(p.username) ? (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {' '}
                      (append)
                    </Typography>
                  ) : (
                    <Typography component="span" variant="caption" color="primary.main">
                      {' '}
                      (new)
                    </Typography>
                  )}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {step === 'preview' ? (
          <>
            <Button onClick={handleBack}>Back</Button>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleConfirmImport}
              disabled={loading || !parsed?.length}
            >
              Import
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleParse}
              disabled={!rawText.trim() || loading}
            >
              Parse & Preview
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
