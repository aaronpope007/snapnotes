import { useState, useEffect, useCallback } from 'react';
import { useConfirm } from './useConfirm';
import { avgRating, commentKey } from '../utils/handReviewUtils';
import {
  fetchHandsToReview,
  createHandToReview,
  updateHandToReview,
  addHandComment,
  updateHandComment,
  deleteHandComment,
  deleteHandToReview,
  rateHand,
} from '../api/handsToReview';
import type { HandToReview, HandToReviewStatus } from '../types';
import { normalizeStarRating } from '../utils/handReviewUtils';
import { DEFAULT_HAND_TITLE } from '../../shared/constants';

export interface UseHandsToReviewOptions {
  userName: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function useHandsToReview({
  userName,
  onSuccess,
  onError,
}: UseHandsToReviewOptions) {
  const [hands, setHands] = useState<HandToReview[]>([]);
  const [filter, setFilter] = useState<'all' | HandToReviewStatus>('open');
  const [sortBy, setSortBy] = useState<'star' | 'spicy'>('star');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addHandText, setAddHandText] = useState('');
  const [addSpoilerText, setAddSpoilerText] = useState('');
  const [addInitialComment, setAddInitialComment] = useState('');
  const [addInitialCommentPrivate, setAddInitialCommentPrivate] = useState(true);
  const [addSaving, setAddSaving] = useState(false);
  const [editHand, setEditHand] = useState<HandToReview | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHandText, setEditHandText] = useState('');
  const [editSpoilerText, setEditSpoilerText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [revealedSpoilerIds, setRevealedSpoilerIds] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [commentSaving, setCommentSaving] = useState<string | null>(null);
  const [ratingSaving, setRatingSaving] = useState<string | null>(null);
  const [hoverStarRating, setHoverStarRatingState] = useState<Record<string, number | null>>({});
  const [hoverSpicyRating, setHoverSpicyRatingState] = useState<Record<string, number | null>>({});
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{
    handId: string;
    commentIndex: number;
  } | null>(null);
  const [editingComment, setEditingComment] = useState<{
    handId: string;
    commentIndex: number;
  } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [revealedPrivateComments, setRevealedPrivateComments] = useState<Set<string>>(new Set());
  const [deleteHandConfirmOpen, setDeleteHandConfirmOpen] = useState(false);

  const {
    confirmOpen: discardConfirmOpen,
    openConfirm: openDiscardConfirm,
    closeConfirm: closeDiscardConfirm,
    handleConfirm: handleDiscardConfirm,
    confirmOptions: discardConfirmOptions,
  } = useConfirm();

  const loadHands = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : (filter as HandToReviewStatus);
      const data = await fetchHandsToReview(status);
      setHands(data);
    } catch {
      setHands([]);
      onError?.('Failed to load hands to review');
    } finally {
      setLoading(false);
    }
  }, [filter, onError]);

  useEffect(() => {
    loadHands();
  }, [loadHands]);

  const isAddModalDirty = () =>
    addTitle.trim() !== '' ||
    addHandText.trim() !== '' ||
    addSpoilerText.trim() !== '' ||
    addInitialComment.trim() !== '' ||
    !addInitialCommentPrivate;

  const isEditModalDirty = () =>
    editHand !== null &&
    (editTitle !== (editHand.title ?? '') ||
      editHandText !== (editHand.handText ?? '') ||
      editSpoilerText !== (editHand.spoilerText ?? ''));

  const closeAddModal = () => {
    if (isAddModalDirty()) {
      openDiscardConfirm(() => {
        setAddModalOpen(false);
        setAddTitle('');
        setAddHandText('');
        setAddSpoilerText('');
        setAddInitialComment('');
        setAddInitialCommentPrivate(true);
      });
    } else {
      setAddModalOpen(false);
      setAddTitle('');
      setAddHandText('');
      setAddSpoilerText('');
      setAddInitialComment('');
      setAddInitialCommentPrivate(true);
    }
  };

  const closeEditModal = () => {
    if (isEditModalDirty()) {
      openDiscardConfirm(() => setEditHand(null));
    } else {
      setEditHand(null);
    }
  };

  const handleAddHand = async () => {
    if (!addHandText.trim()) return;
    setAddSaving(true);
    try {
      const created = await createHandToReview({
        title: addTitle.trim() || 'Untitled hand',
        handText: addHandText.trim(),
        spoilerText: addSpoilerText.trim() || undefined,
        createdBy: userName || 'Anonymous',
        initialComment:
          addInitialComment.trim() && userName
            ? {
                text: addInitialComment.trim(),
                addedBy: userName,
                authorOnly: addInitialCommentPrivate,
              }
            : undefined,
      });
      setHands((prev) => [created, ...prev]);
      setAddModalOpen(false);
      setAddTitle('');
      setAddHandText('');
      setAddSpoilerText('');
      setAddInitialComment('');
      setAddInitialCommentPrivate(true);
      setExpandedId(created._id);
      onSuccess?.('Hand added for review');
    } catch {
      onError?.('Failed to add hand');
    } finally {
      setAddSaving(false);
    }
  };

  const handleArchive = async (hand: HandToReview) => {
    try {
      const nextStatus = hand.status === 'archived' ? 'open' : 'archived';
      const updated = await updateHandToReview(hand._id, { status: nextStatus });
      setHands((prev) => prev.map((h) => (h._id === hand._id ? updated : h)));
      onSuccess?.(nextStatus === 'archived' ? 'Hand archived' : 'Hand unarchived');
    } catch {
      onError?.('Failed to update hand');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHandToReview(id);
      setHands((prev) => prev.filter((h) => h._id !== id));
      if (expandedId === id) setExpandedId(null);
      if (editHand?._id === id) setEditHand(null);
      onSuccess?.('Hand deleted');
    } catch {
      onError?.('Failed to delete hand');
    }
  };

  const openEditModal = (hand: HandToReview) => {
    setEditHand(hand);
    setEditTitle(hand.title || '');
    setEditHandText(hand.handText || '');
    setEditSpoilerText(hand.spoilerText ?? '');
  };

  const handleEditSave = async () => {
    if (!editHand || !editHandText.trim()) return;
    setEditSaving(true);
    try {
      const updated = await updateHandToReview(editHand._id, {
        title: editTitle.trim() || DEFAULT_HAND_TITLE,
        handText: editHandText.trim(),
        spoilerText: editSpoilerText.trim(),
      });
      setHands((prev) => prev.map((h) => (h._id === editHand._id ? updated : h)));
      setEditHand(null);
      onSuccess?.('Hand updated');
    } catch {
      onError?.('Failed to update hand');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddComment = async (id: string) => {
    const text = commentTexts[id]?.trim();
    if (!text || !userName) return;
    setCommentSaving(id);
    try {
      const updated = await addHandComment(id, { text, addedBy: userName });
      setHands((prev) => prev.map((h) => (h._id === id ? updated : h)));
      setCommentTexts((prev) => ({ ...prev, [id]: '' }));
      onSuccess?.('Comment added');
    } catch {
      onError?.('Failed to add comment');
    } finally {
      setCommentSaving(null);
    }
  };

  const handleRate = async (
    handId: string,
    starRating?: number,
    spicyRating?: number
  ) => {
    if (!userName) return;
    if (starRating == null && spicyRating == null) return;
    setRatingSaving(handId);
    try {
      const updated = await rateHand(handId, {
        starRating,
        spicyRating,
        userName,
      });
      setHands((prev) => prev.map((h) => (h._id === handId ? updated : h)));
      onSuccess?.('Rating updated');
    } catch {
      onError?.('Failed to update rating');
    } finally {
      setRatingSaving(null);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deleteCommentTarget) return;
    const { handId, commentIndex } = deleteCommentTarget;
    setCommentSaving(handId);
    try {
      const updated = await deleteHandComment(handId, commentIndex);
      setHands((prev) => prev.map((h) => (h._id === handId ? updated : h)));
      setDeleteCommentTarget(null);
      onSuccess?.('Comment deleted');
    } catch {
      onError?.('Failed to delete comment');
    } finally {
      setCommentSaving(null);
    }
  };

  const handleStartEditComment = (handId: string, commentIndex: number, text: string) => {
    setEditingComment({ handId, commentIndex });
    setEditingCommentText(text);
    setExpandedComments((prev) => new Set(prev).add(commentKey(handId, commentIndex)));
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditingCommentText('');
  };

  const handleSaveEditComment = async () => {
    if (!editingComment || !editingCommentText.trim() || !userName) return;
    const { handId, commentIndex } = editingComment;
    setCommentSaving(handId);
    try {
      const updated = await updateHandComment(handId, commentIndex, {
        text: editingCommentText.trim(),
        editedBy: userName,
      });
      setHands((prev) => prev.map((h) => (h._id === handId ? updated : h)));
      setEditingComment(null);
      setEditingCommentText('');
      onSuccess?.('Comment updated');
    } catch {
      onError?.('Failed to update comment');
    } finally {
      setCommentSaving(null);
    }
  };

  const handleToggleCommentPrivate = async (
    handId: string,
    commentIndex: number,
    currentAuthorOnly: boolean
  ) => {
    setCommentSaving(handId);
    try {
      const updated = await updateHandComment(handId, commentIndex, {
        authorOnly: !currentAuthorOnly,
      });
      setHands((prev) => prev.map((h) => (h._id === handId ? updated : h)));
      onSuccess?.(
        !currentAuthorOnly ? 'Comment is now private' : 'Comment visible to reviewers'
      );
    } catch {
      onError?.('Failed to update comment visibility');
    } finally {
      setCommentSaving(null);
    }
  };

  const setCommentText = (handId: string, value: string) => {
    setCommentTexts((prev) => ({ ...prev, [handId]: value }));
  };

  const toggleExpandedComment = (key: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleShowInitialComment = (handId: string, commentIndex: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const key = commentKey(handId, commentIndex);
    setRevealedPrivateComments((prev) => new Set(prev).add(key));
    setExpandedComments((prev) => new Set(prev).add(key));
  };

  const setRevealedSpoiler = (handId: string, revealed: boolean) => {
    setRevealedSpoilerIds((prev) => {
      const next = new Set(prev);
      if (revealed) next.add(handId);
      else next.delete(handId);
      return next;
    });
  };

  const setHoverStarRating = (handId: string, value: number | null) => {
    setHoverStarRatingState((prev) => ({ ...prev, [handId]: value }));
  };

  const setHoverSpicyRating = (handId: string, value: number | null) => {
    setHoverSpicyRatingState((prev) => ({ ...prev, [handId]: value }));
  };

  const handleConfirmDeleteHandFromModal = () => {
    if (!editHand) return;
    const id = editHand._id;
    setEditHand(null);
    setDeleteHandConfirmOpen(false);
    void handleDelete(id);
  };

  const displayHands =
    filter === 'all'
      ? [...hands].sort((a, b) => {
          const aVal = sortBy === 'star' ? avgRating(a.starRatings) : avgRating(a.spicyRatings);
          const bVal = sortBy === 'star' ? avgRating(b.starRatings) : avgRating(b.spicyRatings);
          const aNum =
            sortBy === 'star'
              ? (normalizeStarRating(aVal) ?? -Infinity)
              : (aVal ?? -Infinity);
          const bNum =
            sortBy === 'star'
              ? (normalizeStarRating(bVal) ?? -Infinity)
              : (bVal ?? -Infinity);
          return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        })
      : hands;

  return {
    hands: displayHands,
    loading,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    expandedId,
    setExpandedId,
    addModalOpen,
    setAddModalOpen,
    addTitle,
    setAddTitle,
    addHandText,
    setAddHandText,
    addSpoilerText,
    setAddSpoilerText,
    addInitialComment,
    setAddInitialComment,
    addInitialCommentPrivate,
    setAddInitialCommentPrivate,
    addSaving,
    closeAddModal,
    handleAddHand,
    editHand,
    editTitle,
    setEditTitle,
    editHandText,
    setEditHandText,
    editSpoilerText,
    setEditSpoilerText,
    editSaving,
    closeEditModal,
    openEditModal,
    handleEditSave,
    handleArchive,
    handleDelete,
    handleRate,
    commentTexts,
    setCommentText,
    commentSaving,
    handleAddComment,
    editingComment,
    editingCommentText,
    setEditingCommentText,
    handleStartEditComment,
    handleCancelEditComment,
    handleSaveEditComment,
    handleToggleCommentPrivate,
    expandedComments,
    toggleExpandedComment,
    revealedPrivateComments,
    handleShowInitialComment,
    deleteCommentTarget,
    setDeleteCommentTarget,
    handleConfirmDeleteComment,
    revealedSpoilerIds,
    setRevealedSpoiler,
    hoverStarRating,
    hoverSpicyRating,
    setHoverStarRating,
    setHoverSpicyRating,
    ratingSaving,
    deleteHandConfirmOpen,
    setDeleteHandConfirmOpen,
    handleConfirmDeleteHandFromModal,
    discardConfirmOpen,
    closeDiscardConfirm,
    handleDiscardConfirm,
    discardConfirmOptions,
  };
}