import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useHandsToReview } from '../hooks/useHandsToReview';
import { HandReviewFilters } from './HandReviewFilters';
import { HandReviewCard } from './HandReviewCard';
import { AddHandModal } from './AddHandModal';
import { EditHandModal } from './EditHandModal';
import { DeleteHandConfirmDialog } from './DeleteHandConfirmDialog';
import { DeleteCommentConfirmDialog } from './DeleteCommentConfirmDialog';
import { ConfirmDialog } from './ConfirmDialog';

interface HandsToReviewViewProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function HandsToReviewView({ onSuccess, onError }: HandsToReviewViewProps) {
  const userName = useUserName();
  const hook = useHandsToReview({
    userName: userName ?? null,
    onSuccess,
    onError,
  });

  const commentActions = {
    setCommentText: hook.setCommentText,
    onAddComment: hook.handleAddComment,
    onToggleExpanded: hook.toggleExpandedComment,
    onShowInitialComment: hook.handleShowInitialComment,
    onEditingTextChange: hook.setEditingCommentText,
    onStartEdit: hook.handleStartEditComment,
    onCancelEdit: hook.handleCancelEditComment,
    onSaveEdit: hook.handleSaveEditComment,
    onTogglePrivate: hook.handleToggleCommentPrivate,
    onDeleteClick: (handId: string, commentIndex: number) =>
      hook.setDeleteCommentTarget({ handId, commentIndex }),
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      <HandReviewFilters
        filter={hook.filter}
        onFilterChange={hook.setFilter}
        filterForMe={hook.filterForMe}
        onFilterForMeChange={hook.setFilterForMe}
        forMeCount={hook.forMeCount}
        sortBy={hook.sortBy}
        onSortByChange={hook.setSortBy}
        sortOrder={hook.sortOrder}
        onSortOrderChange={hook.setSortOrder}
        onAddClick={() => hook.setAddModalOpen(true)}
        onRefresh={() => void hook.loadHands()}
      />

      {hook.forMeCount > 0 && !hook.filterForMe && (
        <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
          You have {hook.forMeCount} hand{hook.forMeCount !== 1 ? 's' : ''} tagged for you to review.
        </Typography>
      )}
      {hook.loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : hook.hands.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {hook.filterForMe
            ? 'No hands tagged for you to review.'
            : 'No hands to review. Add one to get started.'}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {hook.hands.map((hand) => (
            <HandReviewCard
              key={hand._id}
              hand={hand}
              expanded={hook.expandedId === hand._id}
              userName={userName ?? ''}
              commentText={hook.commentTexts[hand._id] ?? ''}
              commentSaving={hook.commentSaving === hand._id}
              editingComment={hook.editingComment}
              editingCommentText={hook.editingCommentText}
              expandedComments={hook.expandedComments}
              revealedPrivateComments={hook.revealedPrivateComments}
              ratingSaving={hook.ratingSaving === hand._id}
              revealedSpoilerIds={hook.revealedSpoilerIds}
              hoverStarRating={hook.hoverStarRating[hand._id] ?? null}
              hoverSpicyRating={hook.hoverSpicyRating[hand._id] ?? null}
              actions={{
                onToggleExpand: (id) =>
                  hook.setExpandedId(hook.expandedId === id ? null : id),
                onEdit: hook.openEditModal,
                onArchive: hook.handleArchive,
                onDelete: hook.handleDelete,
                onRate: hook.handleRate,
                onMarkReviewed: hook.handleMarkReviewed,
                setHoverStarRating: hook.setHoverStarRating,
                setHoverSpicyRating: hook.setHoverSpicyRating,
                setRevealedSpoiler: hook.setRevealedSpoiler,
                commentActions,
              }}
            />
          ))}
        </Box>
      )}

      <AddHandModal
        open={hook.addModalOpen}
        onClose={hook.closeAddModal}
        title={hook.addTitle}
        handText={hook.addHandText}
        spoilerText={hook.addSpoilerText}
        initialComment={hook.addInitialComment}
        initialCommentPrivate={hook.addInitialCommentPrivate}
        taggedReviewers={hook.addTaggedReviewers}
        reviewerOptions={hook.reviewersList}
        saving={hook.addSaving}
        onTitleChange={hook.setAddTitle}
        onHandTextChange={hook.setAddHandText}
        onSpoilerTextChange={hook.setAddSpoilerText}
        onInitialCommentChange={hook.setAddInitialComment}
        onInitialCommentPrivateChange={hook.setAddInitialCommentPrivate}
        onTaggedReviewersChange={hook.setAddTaggedReviewers}
        onSubmit={hook.handleAddHand}
      />

      <EditHandModal
        open={hook.editHand !== null}
        onClose={hook.closeEditModal}
        title={hook.editTitle}
        handText={hook.editHandText}
        spoilerText={hook.editSpoilerText}
        taggedReviewers={hook.editTaggedReviewers}
        reviewerOptions={hook.reviewersList}
        saving={hook.editSaving}
        onTitleChange={hook.setEditTitle}
        onHandTextChange={hook.setEditHandText}
        onSpoilerTextChange={hook.setEditSpoilerText}
        onTaggedReviewersChange={hook.setEditTaggedReviewers}
        onSave={hook.handleEditSave}
        onDelete={() => hook.setDeleteHandConfirmOpen(true)}
      />

      <DeleteHandConfirmDialog
        open={hook.deleteHandConfirmOpen}
        onClose={() => hook.setDeleteHandConfirmOpen(false)}
        onConfirm={hook.handleConfirmDeleteHandFromModal}
      />

      <DeleteCommentConfirmDialog
        open={hook.deleteCommentTarget !== null}
        onClose={() => hook.setDeleteCommentTarget(null)}
        onConfirm={hook.handleConfirmDeleteComment}
        confirming={hook.commentSaving !== null}
      />

      <ConfirmDialog
        open={hook.discardConfirmOpen}
        onClose={hook.closeDiscardConfirm}
        onConfirm={hook.handleDiscardConfirm}
        {...hook.discardConfirmOptions}
      />
    </Box>
  );
}
