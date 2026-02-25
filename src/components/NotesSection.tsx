import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { RichNoteRenderer } from './RichNoteRenderer';
import { AppendNote } from './AppendNote';
import type { NoteEntry } from '../types';

interface NotesSectionProps {
  notes: NoteEntry[];
  onAppendNote: (text: string, addedBy: string) => Promise<void>;
  onEditNote?: (index: number, text: string, editedBy: string) => Promise<void>;
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
  onEditNote,
  onDeleteNote,
  userName,
  saving = false,
}: NotesSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

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
                  '&:hover .note-actions': { opacity: 1 },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.25 }}
                  >
                    {entry.editedAt != null && editingIndex !== i
                      ? `Edited by ${entry.editedBy ?? 'Unknown'} · ${formatDate(entry.editedAt)}`
                      : entry.source === 'import'
                        ? `Imported by ${entry.addedBy}${entry.addedAt ? ` · ${formatDate(entry.addedAt)}` : ''}`
                        : `Added by ${entry.addedBy}${entry.addedAt ? ` · ${formatDate(entry.addedAt)}` : ''}`}
                  </Typography>
                  {editingIndex === i ? (
                    <Box sx={{ pl: 0.5 }}>
                      <TextField
                        multiline
                        minRows={2}
                        fullWidth
                        size="small"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        disabled={saving}
                        autoFocus
                        sx={{ fontSize: '0.9rem' }}
                      />
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            if (onEditNote && userName && editValue.trim() !== entry.text) {
                              await onEditNote(i, editValue.trim(), userName);
                            }
                            setEditingIndex(null);
                          }}
                          disabled={saving || !editValue.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingIndex(null);
                            setEditValue('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ pl: 0.5 }}>
                      <RichNoteRenderer text={entry.text} />
                    </Box>
                  )}
                </Box>
                {editingIndex !== i && (
                  <Box
                    className="note-actions"
                    sx={{
                      display: 'flex',
                      gap: 0,
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    {onEditNote && userName && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingIndex(i);
                          setEditValue(entry.text);
                        }}
                        disabled={saving}
                        sx={{ p: 0.25, '&:hover': { opacity: 1 } }}
                        aria-label="Edit note"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDeleteNote && (
                      <IconButton
                        size="small"
                        onClick={() => onDeleteNote(i)}
                        disabled={saving}
                        sx={{ p: 0.25, '&:hover': { opacity: 1 } }}
                        aria-label="Delete note"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
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
