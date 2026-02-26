import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { RichNoteRenderer } from './RichNoteRenderer';
import type { HandToReviewComment } from '../types';

interface HandReviewCommentRowProps {
  comment: HandToReviewComment;
  commentIndex: number;
  handId: string;
  handCreatedBy: string;
  userName: string;
  isPrivateHiddenForReviewer: boolean;
  expanded: boolean;
  isEditing: boolean;
  editingText: string;
  commentSaving: boolean;
  onToggleExpanded: () => void;
  onShowInitialComment: (e: React.MouseEvent) => void;
  onEditingTextChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTogglePrivate: () => void;
  onDelete: () => void;
}

export function HandReviewCommentRow({
  comment: c,
  commentIndex: _i,
  handId: _handId,
  handCreatedBy,
  userName,
  isPrivateHiddenForReviewer,
  expanded,
  isEditing,
  editingText,
  commentSaving,
  onToggleExpanded,
  onShowInitialComment,
  onEditingTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTogglePrivate,
  onDelete,
}: HandReviewCommentRowProps) {
  if (isPrivateHiddenForReviewer) {
    return (
      <Box
        sx={{
          py: 0.5,
          px: 1,
          mb: 0.5,
          bgcolor: 'background.paper',
          borderRadius: 0.5,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Author&apos;s initial thoughts (hidden to avoid influencing review)
        </Typography>
        <Button size="small" variant="outlined" onClick={onShowInitialComment}>
          Show initial comment
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 0.5,
        px: 1,
        mb: 0.5,
        bgcolor: 'background.paper',
        borderRadius: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover .comment-action-btn': { opacity: 1 },
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onToggleExpanded}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          width: '100%',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          p: 0,
          textAlign: 'left',
          color: 'inherit',
          '&:hover': { color: 'text.primary' },
        }}
        aria-expanded={expanded}
      >
        <IconButton size="small" sx={{ p: 0 }} aria-hidden>
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {c.addedBy} • {new Date(c.addedAt).toLocaleString()}
          {c.authorOnly && handCreatedBy === userName && (
            <> • <Box component="span" sx={{ fontStyle: 'italic' }}>private</Box></>
          )}
          {c.editedAt && (
            <> (edited by {c.editedBy ?? 'Unknown'} • {new Date(c.editedAt).toLocaleString()})</>
          )}
        </Typography>
        {handCreatedBy === userName && (
          <Box component="span" onClick={(e) => e.stopPropagation()} sx={{ flexShrink: 0 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={!!c.authorOnly}
                  onChange={onTogglePrivate}
                  disabled={commentSaving}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">Private</Typography>
              }
            />
          </Box>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
            mt: 0.25,
            pl: 2.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <Box sx={{ mt: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  maxRows={8}
                  value={editingText}
                  onChange={(e) => onEditingTextChange(e.target.value)}
                  disabled={commentSaving}
                  sx={{ '& .MuiInputBase-input': { resize: 'none' } }}
                  slotProps={{ input: { 'aria-label': 'Edit comment' } }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  <Button size="small" variant="outlined" onClick={onCancelEdit} disabled={commentSaving}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={onSaveEdit}
                    disabled={!editingText.trim() || commentSaving}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 0.25 }}>
                <RichNoteRenderer text={c.text} />
              </Box>
            )}
          </Box>
          {!isEditing && handCreatedBy === userName && (
            <>
              <IconButton
                size="small"
                className="comment-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit();
                }}
                sx={{
                  p: 0.25,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  flexShrink: 0,
                }}
                aria-label="Edit comment"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                className="comment-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                sx={{
                  p: 0.25,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  flexShrink: 0,
                }}
                aria-label="Delete comment"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
