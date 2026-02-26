import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { HandReviewCommentRow } from './HandReviewCommentRow';
import { commentKey } from '../utils/handReviewUtils';
import type { HandToReview } from '../types';

export interface HandReviewCommentsSectionActions {
  setCommentText: (handId: string, value: string) => void;
  onAddComment: (handId: string) => void;
  onToggleExpanded: (key: string) => void;
  onShowInitialComment: (handId: string, commentIndex: number) => (e: React.MouseEvent) => void;
  onEditingTextChange: (value: string) => void;
  onStartEdit: (handId: string, commentIndex: number, text: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTogglePrivate: (handId: string, commentIndex: number, currentAuthorOnly: boolean) => void;
  onDeleteClick: (handId: string, commentIndex: number) => void;
}

interface HandReviewCommentsSectionProps {
  hand: HandToReview;
  userName: string;
  commentText: string;
  commentSaving: boolean;
  editingComment: { handId: string; commentIndex: number } | null;
  editingCommentText: string;
  expandedComments: Set<string>;
  revealedPrivateComments: Set<string>;
  actions: HandReviewCommentsSectionActions;
}

export function HandReviewCommentsSection({
  hand,
  userName,
  commentText,
  commentSaving,
  editingComment,
  editingCommentText,
  expandedComments,
  revealedPrivateComments,
  actions: {
    setCommentText,
    onAddComment,
    onToggleExpanded,
    onShowInitialComment,
    onEditingTextChange,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onTogglePrivate,
    onDeleteClick,
  },
}: HandReviewCommentsSectionProps) {
  const allComments = (hand.comments ?? []).map((c, i) => ({ c, i }));

  return (
    <>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Comments ({allComments.length})
      </Typography>
      <Box sx={{ mt: 0.5, mb: 1 }}>
        {allComments.map(({ c, i }) => {
          const key = commentKey(hand._id, i);
          const isPrivateHiddenForReviewer =
            !!c.authorOnly && hand.createdBy !== userName && !revealedPrivateComments.has(key);
          const isEditing =
            editingComment?.handId === hand._id && editingComment?.commentIndex === i;
          const expanded = expandedComments.has(key);
          return (
            <HandReviewCommentRow
              key={i}
              comment={c}
              commentIndex={i}
              handId={hand._id}
              handCreatedBy={hand.createdBy}
              userName={userName}
              isPrivateHiddenForReviewer={isPrivateHiddenForReviewer}
              expanded={expanded}
              isEditing={isEditing}
              editingText={editingCommentText}
              commentSaving={commentSaving}
              onToggleExpanded={() => onToggleExpanded(key)}
              onShowInitialComment={onShowInitialComment(hand._id, i)}
              onEditingTextChange={onEditingTextChange}
              onStartEdit={() => onStartEdit(hand._id, i, c.text)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onTogglePrivate={() => onTogglePrivate(hand._id, i, !!c.authorOnly)}
              onDelete={() => onDeleteClick(hand._id, i)}
            />
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={8}
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(hand._id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onAddComment(hand._id);
            }
          }}
          disabled={commentSaving}
          sx={{ '& .MuiInputBase-input': { resize: 'none' } }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => onAddComment(hand._id)}
          disabled={!commentText.trim() || commentSaving}
        >
          Add
        </Button>
      </Box>
    </>
  );
}
