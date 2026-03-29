import { useState, useCallback, useEffect, memo } from 'react';
import Box from '@mui/material/Box';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from './ConfirmDialog';
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
import { useCompactMode } from '../context/CompactModeContext';
import { AppendNote } from './AppendNote';
import { HAND_TEMPLATES } from '../constants/handTemplates';
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

interface NoteRowProps {
  entry: NoteEntry;
  index: number;
  isEditing: boolean;
  saving: boolean;
  userName: string | null;
  compact: boolean;
  onStartEdit: () => void;
  onEditNote?: (index: number, text: string, editedBy: string) => Promise<void>;
  onCloseEdit: () => void;
  onDeleteNote?: (index: number) => Promise<void>;
  openDeleteConfirm: (onConfirm: () => void, options: { title: string; message: string; confirmText: string; confirmDanger: boolean }) => void;
}

const NoteRow = memo(function NoteRow({
  entry,
  index,
  isEditing,
  saving,
  userName,
  compact,
  onStartEdit,
  onEditNote,
  onCloseEdit,
  onDeleteNote,
  openDeleteConfirm,
}: NoteRowProps) {
  const [localValue, setLocalValue] = useState(entry.text);
  useEffect(() => {
    if (isEditing) setLocalValue(entry.text);
  }, [isEditing, entry.text]);

  const handleSave = useCallback(async () => {
    if (onEditNote && userName && localValue.trim() !== entry.text) {
      await onEditNote(index, localValue.trim(), userName);
    }
    onCloseEdit();
  }, [index, localValue, entry.text, userName, onEditNote, onCloseEdit]);

  return (
    <Box
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
          {entry.editedAt != null && !isEditing
            ? `Edited by ${entry.editedBy ?? 'Unknown'} · ${formatDate(entry.editedAt)}`
            : entry.source === 'import'
              ? `Imported by ${entry.addedBy}${entry.addedAt ? ` · ${formatDate(entry.addedAt)}` : ''}`
              : `Added by ${entry.addedBy}${entry.addedAt ? ` · ${formatDate(entry.addedAt)}` : ''}`}
        </Typography>
        {isEditing ? (
          <Box sx={{ pl: 0.5 }}>
            <TextField
              multiline
              minRows={2}
              fullWidth
              size="small"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              disabled={saving}
              autoFocus
              sx={{ fontSize: '0.9rem' }}
            />
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
              {HAND_TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setLocalValue((prev) =>
                      prev.trim() ? `${prev}\n\n${t.text}` : t.text
                    )
                  }
                >
                  {t.label}
                </Button>
              ))}
              <Button
                size="small"
                variant="contained"
                onClick={() => void handleSave()}
                disabled={saving || !localValue.trim()}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={onCloseEdit}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ pl: 0.5 }}>
            <RichNoteRenderer text={entry.text} cardSize={compact ? 'xxxs' : 'sm'} />
          </Box>
        )}
      </Box>
      {!isEditing && (
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
              onClick={onStartEdit}
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
              onClick={() =>
                openDeleteConfirm(() => onDeleteNote(index), {
                  title: 'Delete note?',
                  message:
                    'Are you sure you want to delete this note? This cannot be undone.',
                  confirmText: 'Delete',
                  confirmDanger: true,
                })
              }
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
  );
});

export function NotesSection({
  notes,
  onAppendNote,
  onEditNote,
  onDeleteNote,
  userName,
  saving = false,
}: NotesSectionProps) {
  const compact = useCompactMode();
  const [expanded, setExpanded] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const {
    confirmOpen: deleteNoteConfirmOpen,
    openConfirm: openDeleteNoteConfirm,
    closeConfirm: closeDeleteNoteConfirm,
    handleConfirm: handleConfirmDeleteNote,
    confirmOptions: deleteNoteConfirmOptions,
  } = useConfirm();

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
              <NoteRow
                key={i}
                entry={entry}
                index={i}
                isEditing={editingIndex === i}
                saving={saving}
                userName={userName}
                compact={compact}
                onStartEdit={() => setEditingIndex(i)}
                onEditNote={onEditNote}
                onCloseEdit={() => setEditingIndex(null)}
                onDeleteNote={onDeleteNote}
                openDeleteConfirm={openDeleteNoteConfirm}
              />
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

      <ConfirmDialog
        open={deleteNoteConfirmOpen}
        onClose={closeDeleteNoteConfirm}
        onConfirm={handleConfirmDeleteNote}
        {...deleteNoteConfirmOptions}
      />
    </Box>
  );
}
