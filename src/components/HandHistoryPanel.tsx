import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { HandHistoryEntryCard } from './HandHistoryEntryCard';
import { HandHistoryPanelModal } from './HandHistoryPanelModal';
import { ConfirmDialog } from './ConfirmDialog';
import { DeleteCommentConfirmDialog } from './DeleteCommentConfirmDialog';
import { useHandHistoryPanel } from '../hooks/useHandHistoryPanel';
import { useUserName } from '../context/UserNameContext';
import { useCompactMode } from '../context/CompactModeContext';
import type { HandHistoryEntry } from '../types';

const PANEL_WIDTH_DEFAULT = 340;
const PANEL_WIDTH_COMPACT = 260;

interface HandHistoryPanelProps {
  handHistories: HandHistoryEntry[];
  onUpdateHandHistories: (handHistories: HandHistoryEntry[]) => Promise<void>;
  saving?: boolean;
  horizontal?: boolean;
}

export function HandHistoryPanel({
  handHistories,
  onUpdateHandHistories,
  saving = false,
  horizontal = false,
}: HandHistoryPanelProps) {
  const userName = useUserName();
  const compact = useCompactMode();
  const panelWidth = horizontal ? '100%' : compact ? PANEL_WIDTH_COMPACT : PANEL_WIDTH_DEFAULT;
  const hook = useHandHistoryPanel({
    handHistories,
    onUpdateHandHistories,
    userName: userName ?? null,
    saving,
  });

  const commentActionsForEntry = (entryIndex: number) => ({
    onToggleExpanded: hook.toggleExpandedComment,
    onStartEdit: (commentIndex: number, text: string) => {
      hook.setEditingComment({ entryIndex, commentIndex });
      hook.setEditingCommentText(text);
    },
    onCancelEdit: () => {
      hook.setEditingComment(null);
      hook.setEditingCommentText('');
    },
    onSaveEdit: (commentIndex: number) => {
      hook.handleSaveEditComment(entryIndex, commentIndex);
    },
    onDeleteClick: (commentIndex: number) => {
      hook.setDeleteCommentTarget({ entryIndex, commentIndex });
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexShrink: 0,
        height: horizontal ? undefined : '100%',
        flexDirection: horizontal ? 'column' : 'row',
        width: horizontal ? '100%' : undefined,
      }}
    >
      {!horizontal && (
        <IconButton
          size="small"
          onClick={() => hook.setExpanded(!hook.expanded)}
          sx={{
            alignSelf: 'flex-start',
            mt: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
          aria-label={hook.expanded ? 'Collapse panel' : 'Expand panel'}
        >
          {hook.expanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      )}

      {(hook.expanded || horizontal) && (
        <Paper
          elevation={0}
          sx={{
            width: panelWidth,
            minWidth: panelWidth,
            ml: 0.5,
            p: compact ? 1 : 2,
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'auto',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0.5 : 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Hand Histories
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={hook.openAddModal}
                disabled={hook.saving || hook.savingAll}
              >
                Add
              </Button>
              {!horizontal && (
                <IconButton
                  size="small"
                  onClick={() => hook.setExpanded(false)}
                  aria-label="Close panel"
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5, mb: compact ? 1 : 2 }}>
            {hook.localValues.map((entry, i) => (
              <HandHistoryEntryCard
                key={i}
                entry={entry}
                index={i}
                expanded={!!hook.expandedItems[i]}
                commentText={hook.commentTexts[String(i)] ?? ''}
                commentSaving={hook.savingIndex === i}
                editingCommentIndex={
                  hook.editingComment?.entryIndex === i ? hook.editingComment.commentIndex : null
                }
                editingCommentText={hook.editingCommentText}
                expandedComments={hook.expandedComments}
                spoilerExpanded={hook.expandedComments.has(`spoiler-${i}`)}
                onToggle={() => hook.toggleItem(i)}
                onEdit={() => hook.openEditModal(i)}
                onDelete={() => hook.handleDelete(i)}
                onToggleSpoiler={() => hook.toggleSpoiler(i)}
                commentKey={hook.commentKey}
                onCommentTextChange={(v) => hook.setCommentText(i, v)}
                onAddComment={() => hook.handleAddComment(i)}
                onEditingCommentTextChange={hook.setEditingCommentText}
                commentActions={commentActionsForEntry(i)}
                userName={userName ?? null}
                saving={hook.saving || hook.savingAll}
              />
            ))}
          </Box>
        </Paper>
      )}

      <HandHistoryPanelModal
        open={hook.modalOpen}
        mode={hook.modalMode}
        title={hook.modalTitle}
        content={hook.modalContent}
        spoiler={hook.modalSpoiler}
        onClose={hook.handleRequestClose}
        onTitleChange={hook.setModalTitle}
        onContentChange={hook.setModalContent}
        onSpoilerChange={hook.setModalSpoiler}
        onSave={hook.handleModalSave}
        saving={hook.saving || hook.savingAll || hook.savingIndex !== null}
      />

      <ConfirmDialog
        open={hook.discardConfirmOpen}
        onClose={hook.closeDiscardConfirm}
        onConfirm={hook.handleDiscardConfirm}
        {...hook.discardConfirmOptions}
      />

      <DeleteCommentConfirmDialog
        open={hook.deleteCommentTarget !== null}
        onClose={() => hook.setDeleteCommentTarget(null)}
        onConfirm={() => {
          if (hook.deleteCommentTarget) {
            hook.handleDeleteComment(
              hook.deleteCommentTarget.entryIndex,
              hook.deleteCommentTarget.commentIndex
            );
          }
        }}
        confirming={hook.savingIndex !== null}
      />
    </Box>
  );
}
