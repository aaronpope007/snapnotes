import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Paper from '@mui/material/Paper';
import { RichNoteRenderer } from './RichNoteRenderer';

const EXPLOIT_COLOR = '#ffb74d';
const PANEL_WIDTH = 340;

interface HandHistoryPanelProps {
  handHistories: string;
  exploitHandExamples: string[];
  exploits: string[];
  onUpdateHandHistories: (value: string) => Promise<void>;
  onUpdateExploitHandExample: (index: number, value: string) => Promise<void>;
  saving?: boolean;
}

export function HandHistoryPanel({
  handHistories,
  exploitHandExamples,
  exploits,
  onUpdateHandHistories,
  onUpdateExploitHandExample,
  saving = false,
}: HandHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [handHistoriesValue, setHandHistoriesValue] = useState(handHistories);
  const [handExamplesValues, setHandExamplesValues] = useState<string[]>(() =>
    exploits.map((_, i) => exploitHandExamples[i] ?? '')
  );

  useEffect(() => {
    setHandHistoriesValue(handHistories);
  }, [handHistories]);

  useEffect(() => {
    setHandExamplesValues(exploits.map((_, i) => exploitHandExamples[i] ?? ''));
  }, [exploits, exploitHandExamples]);
  const [savingHandHistories, setSavingHandHistories] = useState(false);
  const [savingExamples, setSavingExamples] = useState<Record<number, boolean>>({});

  const handleHandHistoriesBlur = async () => {
    if (handHistoriesValue === handHistories) return;
    setSavingHandHistories(true);
    try {
      await onUpdateHandHistories(handHistoriesValue);
    } finally {
      setSavingHandHistories(false);
    }
  };

  const handleHandExampleBlur = async (index: number) => {
    const current = handExamplesValues[index] ?? '';
    const saved = exploitHandExamples[index] ?? '';
    if (current === saved) return;
    setSavingExamples((prev) => ({ ...prev, [index]: true }));
    try {
      await onUpdateExploitHandExample(index, current);
    } finally {
      setSavingExamples((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleHandExampleChange = (index: number, value: string) => {
    setHandExamplesValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <IconButton
        size="small"
        onClick={() => setExpanded(!expanded)}
        sx={{
          alignSelf: 'flex-start',
          mt: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
      >
        {expanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>

      {expanded && (
        <Paper
          elevation={0}
          sx={{
            width: PANEL_WIDTH,
            minWidth: PANEL_WIDTH,
            ml: 0.5,
            p: 2,
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'auto',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
          >
            Hand Histories
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            placeholder="Paste or type hand histories... Use `kd` for cards, e.g. `kdac2s`"
            value={handHistoriesValue}
            onChange={(e) => setHandHistoriesValue(e.target.value)}
            onBlur={handleHandHistoriesBlur}
            disabled={saving || savingHandHistories}
            size="small"
            sx={{
              mb: 0.5,
              '& .MuiInputBase-input': { fontSize: '0.8rem', fontFamily: 'monospace' },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
            Preview
          </Typography>
          <Box
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              minHeight: 24,
              mb: 2,
              p: 1,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            {handHistoriesValue ? <RichNoteRenderer text={handHistoriesValue} /> : null}
          </Box>

          {exploits.length > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1, fontWeight: 600 }}
              >
                Hand Examples (by exploit)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {exploits.map((exploit, i) => (
                  <Box key={i}>
                    <Box
                      sx={{
                        color: EXPLOIT_COLOR,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        mb: 0.5,
                      }}
                    >
                      <RichNoteRenderer text={exploit} />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={6}
                      placeholder="Example hand... Use `kd` for cards"
                      value={handExamplesValues[i] ?? ''}
                      onChange={(e) => handleHandExampleChange(i, e.target.value)}
                      onBlur={() => handleHandExampleBlur(i)}
                      disabled={saving || savingExamples[i]}
                      size="small"
                      sx={{
                        mb: 0.5,
                        '& .MuiInputBase-input': { fontSize: '0.75rem', fontFamily: 'monospace' },
                      }}
                    />
                    <Box
                      sx={{
                        fontSize: '0.75rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        p: 0.5,
                        borderRadius: 0.5,
                        bgcolor: 'action.hover',
                      }}
                    >
                      {handExamplesValues[i] ? (
                        <RichNoteRenderer text={handExamplesValues[i] ?? ''} />
                      ) : null}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
