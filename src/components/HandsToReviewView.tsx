import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useCompactMode } from '../context/CompactModeContext';
import { useLearningVisibility } from '../context/LearningVisibilityContext';
import { useHandsToReview } from '../hooks/useHandsToReview';
import { HandReviewFilters } from './HandReviewFilters';
import { HandReviewCard } from './HandReviewCard';
import { AddHandModal } from './AddHandModal';
import { EditHandModal } from './EditHandModal';
import { DeleteHandConfirmDialog } from './DeleteHandConfirmDialog';
import { DeleteCommentConfirmDialog } from './DeleteCommentConfirmDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { AddLeakToSelfModal } from './learning/AddLeakToSelfModal';
import { AddLeakForAuthorModal } from './learning/AddLeakForAuthorModal';
import { createLeak } from '../api/learning';
import { getApiErrorMessage } from '../utils/apiError';

interface HandsToReviewViewProps {
  initialHandId?: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function HandsToReviewView({ initialHandId, onSuccess, onError }: HandsToReviewViewProps) {
  const userName = useUserName();
  const compact = useCompactMode();
  const learningVisible = useLearningVisibility();
  const [addLeakHand, setAddLeakHand] = useState<{ _id: string; title?: string } | null>(null);
  const [addLeakForAuthorHand, setAddLeakForAuthorHand] = useState<{
    _id: string;
    title?: string;
    createdBy: string;
  } | null>(null);
  const [leakSaving, setLeakSaving] = useState(false);
  const hook = useHandsToReview({
    userName: userName ?? null,
    initialHandId,
    onSuccess,
    onError,
  });

  const handleCopyLink = (handId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?hand=${handId}`;
    navigator.clipboard.writeText(url).then(
      () => onSuccess?.('Link copied to clipboard'),
      () => onError?.('Failed to copy link')
    );
  };

  const handleAddLeakForAuthor = async (title: string) => {
    if (!addLeakForAuthorHand) return;
    setLeakSaving(true);
    try {
      await createLeak({
        title,
        description: '',
        category: 'other',
        linkedHandIds: [addLeakForAuthorHand._id],
        userId: addLeakForAuthorHand.createdBy,
      });
      setAddLeakForAuthorHand(null);
      onSuccess?.('Leak added for ' + addLeakForAuthorHand.createdBy);
    } catch (err) {
      onError?.(getApiErrorMessage(err, 'Failed to add leak'));
    } finally {
      setLeakSaving(false);
    }
  };

  const handleAddLeakToSelf = async (
    payload: { title: string; description?: string; category?: string; linkedHandIds?: string[] }
  ) => {
    if (!userName) return;
    setLeakSaving(true);
    try {
      await createLeak({
        ...payload,
        userId: userName,
        description: payload.description ?? '',
        category: (payload.category ?? 'other') as import('../types/learning').LeakCategory,
      });
      setAddLeakHand(null);
      onSuccess?.('Leak added');
    } catch (err) {
      onError?.(getApiErrorMessage(err, 'Failed to add leak'));
    } finally {
      setLeakSaving(false);
    }
  };

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
    <Box sx={{ width: '100%', maxWidth: compact ? 360 : 480 }}>
      <HandReviewFilters
        filter={hook.filter}
        onFilterChange={hook.setFilter}
        filterForMe={hook.filterForMe}
        onFilterForMeChange={hook.setFilterForMe}
        forMeCount={hook.forMeCount}
        userName={userName ?? null}
        sortBy={hook.sortBy}
        onSortByChange={hook.setSortBy}
        sortOrder={hook.sortOrder}
        onSortOrderChange={hook.setSortOrder}
        onAddClick={() => hook.setAddModalOpen(true)}
        onRefresh={() => void hook.loadHands()}
      />

      {hook.forMeCount > 0 && !hook.filterForMe && (
        <Typography variant={compact ? 'caption' : 'body2'} color="primary" sx={{ mb: compact ? 0.5 : 1 }}>
          You have {hook.forMeCount} hand{hook.forMeCount !== 1 ? 's' : ''} tagged for you to review.
        </Typography>
      )}
      {hook.loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : hook.hands.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {hook.filter === 'my-open-private'
            ? 'No private open hands. Add a hand and check "Private" to save it here for later (e.g. solver work).'
            : hook.filter === 'my-archived-private'
              ? 'No private archived hands.'
              : hook.filterForMe
                ? 'No hands tagged for you to review.'
                : 'No hands to review. Add one to get started.'}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5 }}>
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
              revealedRationaleIds={hook.revealedRationaleIds}
              hoverStarRating={hook.hoverStarRating[hand._id] ?? null}
              hoverSpicyRating={hook.hoverSpicyRating[hand._id] ?? null}
              actions={{
                onToggleExpand: hook.handleToggleExpand,
                onCopyLink: handleCopyLink,
                onEdit: hook.openEditModal,
                onArchive: hook.handleArchive,
                onDelete: (id) => hook.openDeleteHandConfirm(id),
                onAddLeak: learningVisible && userName ? (hand) => setAddLeakHand(hand) : undefined,
                onAddLeakForAuthor: learningVisible && userName
                  ? (hand) => setAddLeakForAuthorHand({ _id: hand._id, title: hand.title, createdBy: hand.createdBy })
                  : undefined,
                onRate: hook.handleRate,
                onMarkReviewed: hook.handleMarkReviewed,
                setHoverStarRating: hook.setHoverStarRating,
                setHoverSpicyRating: hook.setHoverSpicyRating,
                setRevealedSpoiler: hook.setRevealedSpoiler,
                setRevealedRationale: hook.setRevealedRationale,
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
        rationaleText={hook.addRationale}
        spoilerText={hook.addSpoilerText}
        isPrivate={hook.addIsPrivate}
        initialComment={hook.addInitialComment}
        initialCommentPrivate={hook.addInitialCommentPrivate}
        taggedReviewers={hook.addTaggedReviewers}
        reviewerOptions={hook.reviewersList}
        saving={hook.addSaving}
        onTitleChange={hook.setAddTitle}
        onHandTextChange={hook.setAddHandText}
        onRationaleTextChange={hook.setAddRationale}
        onSpoilerTextChange={hook.setAddSpoilerText}
        onIsPrivateChange={hook.setAddIsPrivate}
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
        rationaleText={hook.editRationale}
        spoilerText={hook.editSpoilerText}
        isPrivate={hook.editIsPrivate}
        taggedReviewers={hook.editTaggedReviewers}
        reviewerOptions={hook.reviewersList}
        saving={hook.editSaving}
        onTitleChange={hook.setEditTitle}
        onHandTextChange={hook.setEditHandText}
        onRationaleTextChange={hook.setEditRationale}
        onSpoilerTextChange={hook.setEditSpoilerText}
        onIsPrivateChange={hook.setEditIsPrivate}
        onTaggedReviewersChange={hook.setEditTaggedReviewers}
        onSave={hook.handleEditSave}
        onDelete={() => hook.openDeleteHandConfirm(hook.editHand!._id)}
      />

      <DeleteHandConfirmDialog
        open={hook.deleteHandConfirmOpen}
        onClose={hook.closeDeleteHandConfirm}
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

      {addLeakHand && (
        <AddLeakToSelfModal
          open={true}
          onClose={() => setAddLeakHand(null)}
          handId={addLeakHand._id}
          handTitle={addLeakHand.title}
          userId={userName ?? null}
          saving={leakSaving}
          onSubmit={handleAddLeakToSelf}
        />
      )}

      {addLeakForAuthorHand && (
        <AddLeakForAuthorModal
          open={true}
          onClose={() => setAddLeakForAuthorHand(null)}
          authorName={addLeakForAuthorHand.createdBy}
          handTitle={addLeakForAuthorHand.title}
          saving={leakSaving}
          onSubmit={handleAddLeakForAuthor}
        />
      )}
    </Box>
  );
}
