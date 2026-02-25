import { useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import mammoth from 'mammoth';
import { parseImportText } from '../utils/importParser';
import { parseLooseImport, findFuzzyDuplicates } from '../utils/looseParser';
import { useUserName } from '../context/UserNameContext';
import type { ImportPlayer, ParsedImportPlayer } from '../types';

export type ImportMode = 'strict' | 'loose';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (players: ImportPlayer[]) => Promise<{ created: number; updated: number }>;
  existingUsernames: Set<string>;
}

function toImportPlayer(p: ParsedImportPlayer, importedBy: string): ImportPlayer {
  const now = new Date().toISOString();
  return {
    username: p.username,
    playerType: p.playerType,
    gameTypes: [],
    stakesSeenAt: p.stakesSeenAt,
    formats: ['Ring'],
    origin: 'WPT Gold',
    exploits: p.exploits,
    importedBy,
    notes: p.noteText.trim()
      ? [{ text: p.noteText, addedBy: importedBy, addedAt: now, source: 'import' as const }]
      : [],
  };
}

export function ImportModal({
  open,
  onClose,
  onImport,
  existingUsernames,
}: ImportModalProps) {
  const userName = useUserName();
  const [importMode, setImportMode] = useState<ImportMode>('strict');
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedImportPlayer[] | null>(null);
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
    const players = importMode === 'strict' ? parseImportText(rawText) : parseLooseImport(rawText);
    setParsed(players);
    setStep('preview');
  };

  const handleConfirmImport = async () => {
    if (!parsed || parsed.length === 0 || !userName?.trim()) return;
    setLoading(true);
    try {
      const toImport = parsed.map((p) => toImportPlayer(p, userName.trim()));
      await onImport(toImport);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setParsed(null);
  };

  const normalizedExisting = new Set([...existingUsernames].map((u) => u.toLowerCase()));
  const newCount = parsed?.filter((p) => !normalizedExisting.has(p.username.toLowerCase())).length ?? 0;
  const existingCount = (parsed?.length ?? 0) - newCount;
  const fuzzyDuplicates = parsed ? findFuzzyDuplicates(parsed, existingUsernames) : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Notes</DialogTitle>
      <DialogContent>
        {step === 'input' ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Import mode
            </Typography>
            <ToggleButtonGroup
              value={importMode}
              exclusive
              onChange={(_, v) => v != null && setImportMode(v)}
              size="small"
              sx={{ mb: 1 }}
            >
              <ToggleButton value="strict" aria-label="Strict import">
                Strict Import
              </ToggleButton>
              <ToggleButton value="loose" aria-label="Loose import">
                Loose Import
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
              {importMode === 'strict'
                ? "For notes in 'PlayerName - stake - note' format"
                : 'For notes where player names and notes are on separate lines'}
            </Typography>
            {importMode === 'strict' && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Format:
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
**exploit line
– 400 - multi-stake continuation`}
                </Typography>
              </>
            )}
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
              <input type="file" accept=".txt,.docx" hidden onChange={handleFileUpload} />
            </Button>
          </Box>
        ) : (
          <Box>
            {!userName?.trim() && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                Enter your name first (close this dialog and you&apos;ll be prompted) to attribute imports.
              </Typography>
            )}
            <Typography variant="body2" sx={{ mb: 1 }}>
              {importMode === 'loose' && (
                <>
                  Total player blocks detected: {parsed?.length ?? 0}.{' '}
                </>
              )}
              {newCount} new, {existingCount} existing (notes will be appended).
            </Typography>
            {fuzzyDuplicates.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {fuzzyDuplicates.map(({ incoming, existing }, i) => (
                  <Typography key={i} variant="body2" component="span" display="block">
                    &quot;{incoming}&quot; may match existing player &quot;{existing}&quot; — will be
                    treated as a new player unless you merge them manually after import.
                  </Typography>
                ))}
              </Alert>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Detected player names
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
                  {normalizedExisting.has(p.username.toLowerCase()) ? (
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
              disabled={loading || !parsed?.length || !userName?.trim()}
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
