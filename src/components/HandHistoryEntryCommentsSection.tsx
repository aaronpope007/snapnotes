import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { RichNoteRenderer } from './RichNoteRenderer';
import type { HandHistoryComment } from '../types';

export interface HandHistoryEntryCommentsSectionActions {
  onToggleExpanded: (key: string) => void;
  onStartEdit: (commentIndex: number, text: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (commentIndex: number) => void;
  onDeleteClick: (commentIndex: number) => void;
}

interface HandHistoryEntryCommentsSectionProps {
  entryIndex: number;
  comments: HandHistoryComment[];
  commentText: string;
  commentSaving: boolean;
  editingCommentIndex: number | null;
  editingCommentText: string;
  expandedComments: Set<string>;
  commentKey: (entryIndex: number, commentIndex: number) => string;
  onCommentTextChange: (value: string) => void;
  onAddComment: () => void;
  onEditingCommentTextChange: (value: string) => void;
  actions: HandHistoryEntryCommentsSectionActions;
  userName: string | null;
}

export function HandHistoryEntryCommentsSection({
  entryIndex,
  comments,
  commentText,
  commentSaving,
  editingCommentIndex,
  editingCommentText,
  expandedComments,
  commentKey: getCommentKey,
  onCommentTextChange,
  onAddComment,
  onEditingCommentTextChange,
  actions: {
    onToggleExpanded,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDeleteClick,
  },
  userName,
}: HandHistoryEntryCommentsSectionProps) {
  return (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: 'block', mt: 1 }}
      >
        Comments ({comments.length})
      </Typography>
      <Box sx={{ mt: 0.5, mb: 1 }}>
        {comments.map((c, j) => {
          const key = getCommentKey(entryIndex, j);
          const expanded = expandedComments.has(key);
          const isEditing = editingCommentIndex === j;
          return (
            <Box
              key={j}
              sx={{
                py: 0.5,
                px: 0.5,
                mb: 0.5,
                bgcolor: 'background.paper',
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => onToggleExpanded(key)}
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
                  fontSize: '0.75rem',
                }}
              >
                {expanded ? (
                  <ExpandLessIcon sx={{ fontSize: 14 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 14 }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {c.addedBy} • {new Date(c.addedAt).toLocaleString()}
                  {c.editedAt && <> (edited)</>}
                </Typography>
              </Box>
              <Collapse in={expanded}>
                <Box sx={{ pl: 2.5, pt: 0.25 }}>
                  {isEditing ? (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        value={editingCommentText}
                        onChange={(e) => onEditingCommentTextChange(e.target.value)}
                        sx={{ '& .MuiInputBase-input': { resize: 'none' } }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Button size="small" onClick={onCancelEdit}>
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onSaveEdit(j)}
                          disabled={!editingCommentText.trim() || commentSaving}
                        >
                          Save
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <RichNoteRenderer text={c.text} />
                      <Box sx={{ display: 'flex', gap: 0, mt: 0.25 }}>
                        <IconButton
                          size="small"
                          sx={{ p: 0.25 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartEdit(j, c.text);
                          }}
                          aria-label="Edit comment"
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ p: 0.25 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(j);
                          }}
                          aria-label="Delete comment"
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={1}
          maxRows={4}
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          disabled={commentSaving}
          sx={{ '& .MuiInputBase-input': { resize: 'none' } }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={onAddComment}
          disabled={!commentText.trim() || commentSaving || !userName}
        >
          Add
        </Button>
      </Box>
    </>
  );
}
