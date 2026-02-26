import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { RichNoteRenderer } from './RichNoteRenderer';
import { HandHistoryEntryCommentsSection } from './HandHistoryEntryCommentsSection';
import type { HandHistoryEntryCommentsSectionActions } from './HandHistoryEntryCommentsSection';
import { useCompactMode } from '../context/CompactModeContext';
import type { HandHistoryEntry } from '../types';

interface HandHistoryEntryCardProps {
  entry: HandHistoryEntry;
  index: number;
  expanded: boolean;
  commentText: string;
  commentSaving: boolean;
  editingCommentIndex: number | null;
  editingCommentText: string;
  expandedComments: Set<string>;
  spoilerExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSpoiler: () => void;
  commentKey: (entryIndex: number, commentIndex: number) => string;
  onCommentTextChange: (value: string) => void;
  onAddComment: () => void;
  onEditingCommentTextChange: (value: string) => void;
  commentActions: HandHistoryEntryCommentsSectionActions;
  userName: string | null;
  saving: boolean;
}

export function HandHistoryEntryCard({
  entry,
  index,
  expanded,
  commentText,
  commentSaving,
  editingCommentIndex,
  editingCommentText,
  expandedComments,
  spoilerExpanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleSpoiler,
  commentKey,
  onCommentTextChange,
  onAddComment,
  onEditingCommentTextChange,
  commentActions,
  userName,
  saving,
}: HandHistoryEntryCardProps) {
  const compact = useCompactMode();
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.25 : 0.5,
          width: '100%',
          p: compact ? 0.375 : 1,
          minHeight: compact ? 28 : undefined,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          bgcolor: expanded ? 'action.selected' : 'action.hover',
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
        <Typography
          variant={compact ? 'caption' : 'body2'}
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {entry.title || `Hand ${index + 1}`}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          disabled={saving}
          sx={{ p: 0.25 }}
          aria-label="Edit"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={saving}
          sx={{ p: 0.25 }}
          aria-label="Delete"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box
          sx={{
            fontSize: compact ? '0.7rem' : '0.8rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            p: compact ? 0.375 : 1,
            pt: 0,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {entry.content ? (
            <RichNoteRenderer text={entry.content} cardSize={compact ? 'xxxs' : 'sm'} />
          ) : (
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              No content
            </Typography>
          )}
          {(entry.spoilerText ?? '').trim() !== '' && (
            <Box sx={{ mt: compact ? 0.5 : 1 }}>
              <Box
                component="button"
                type="button"
                onClick={onToggleSpoiler}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  p: 0,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {spoilerExpanded ? (
                  <ExpandLessIcon sx={{ fontSize: 14 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 14 }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {spoilerExpanded ? 'Hide spoiler' : 'Reveal spoiler'}
                </Typography>
              </Box>
              <Collapse in={spoilerExpanded}>
                <Box sx={{ mt: 0.5, p: compact ? 0.25 : 0.5, borderRadius: 0.5, bgcolor: 'action.hover' }}>
                  <RichNoteRenderer text={entry.spoilerText ?? ''} cardSize={compact ? 'xxxs' : 'sm'} />
                </Box>
              </Collapse>
            </Box>
          )}
          <HandHistoryEntryCommentsSection
            entryIndex={index}
            comments={entry.comments ?? []}
            commentText={commentText}
            commentSaving={commentSaving}
            editingCommentIndex={editingCommentIndex}
            editingCommentText={editingCommentText}
            expandedComments={expandedComments}
            commentKey={commentKey}
            onCommentTextChange={onCommentTextChange}
            onAddComment={onAddComment}
            onEditingCommentTextChange={onEditingCommentTextChange}
            actions={commentActions}
            userName={userName}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
