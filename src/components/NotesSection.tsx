import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import { RichNoteRenderer } from './RichNoteRenderer';
import { AppendNote } from './AppendNote';
import type { NoteEntry } from '../types';

interface NotesSectionProps {
  notes: NoteEntry[];
  onAppendNote: (text: string, addedBy: string) => Promise<void>;
  onDeleteNote?: (index: number) => Promise<void>;
  userName: string | null;
  saving?: boolean;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function NotesSection({
  notes,
  onAppendNote,
  onDeleteNote,
  userName,
  saving = false,
}: NotesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box>
      <Box
        component="button"
        onClick={() => setExpanded((e) => !e)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          p: 0,
          mb: 0.5,
          textAlign: 'left',
          width: '100%',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Notes
        </Typography>
        <IconButton size="small" sx={{ p: 0, ml: -0.5 }}>
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        {!notes || notes.length === 0 ? (
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}
            >
              No notes yet.
            </Typography>
            {userName ? (
              <Box sx={{ mt: 1 }}>
                <AppendNote
                  onAppend={(text) => onAppendNote(text, userName)}
                />
              </Box>
            ) : null}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {notes.map((entry, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  '&:hover .note-delete': { opacity: 1 },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.25 }}
                  >
                    {entry.source === 'import'
                      ? `Imported by ${entry.addedBy}`
                      : `Added by ${entry.addedBy}`}
                    {entry.addedAt ? ` · ${formatDate(entry.addedAt)}` : ''}
                  </Typography>
                  <Box sx={{ pl: 0.5 }}>
                    <RichNoteRenderer text={entry.text} />
                  </Box>
                </Box>
                {onDeleteNote && (
                  <IconButton
                    className="note-delete"
                    size="small"
                    onClick={() => onDeleteNote(i)}
                    disabled={saving}
                    sx={{
                      opacity: 0,
                      p: 0.25,
                      transition: 'opacity 0.15s',
                      flexShrink: 0,
                      '&:hover': { opacity: 1 },
                    }}
                    aria-label="Delete note"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
            {userName ? (
              <Box sx={{ mt: 1 }}>
                <AppendNote
                  onAppend={(text) => onAppendNote(text, userName)}
                />
              </Box>
            ) : null}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
