import { useState, useEffect } from 'react';
import { useConfirm } from './useConfirm';
import type { HandHistoryEntry, HandHistoryComment } from '../types';

const DEFAULT_ENTRY_TITLE = 'Hand';

export interface UseHandHistoryPanelOptions {
  handHistories: HandHistoryEntry[];
  onUpdateHandHistories: (handHistories: HandHistoryEntry[]) => Promise<void>;
  userName: string | null;
  saving?: boolean;
}

export function useHandHistoryPanel({
  handHistories,
  onUpdateHandHistories,
  userName,
  saving = false,
}: UseHandHistoryPanelOptions) {
  const [expanded, setExpanded] = useState(false);
  const [localValues, setLocalValues] = useState<HandHistoryEntry[]>(() =>
    handHistories?.length ? handHistories : []
  );
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalIndex, setModalIndex] = useState<number>(0);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalSpoiler, setModalSpoiler] = useState('');
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<{
    entryIndex: number;
    commentIndex: number;
  } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{
    entryIndex: number;
    commentIndex: number;
  } | null>(null);

  const {
    confirmOpen: discardConfirmOpen,
    openConfirm: openDiscardConfirm,
    closeConfirm: closeDiscardConfirm,
    handleConfirm: handleDiscardConfirm,
    confirmOptions: discardConfirmOptions,
  } = useConfirm();

  useEffect(() => {
    setLocalValues(handHistories?.length ? handHistories : []);
  }, [handHistories]);

  useEffect(() => {
    setExpandedItems({});
  }, [handHistories?.length]);

  const toggleItem = (i: number) => {
    setExpandedItems((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setModalTitle('');
    setModalContent('');
    setModalSpoiler('');
    setModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setModalMode('edit');
    setModalIndex(index);
    setModalTitle(localValues[index]?.title ?? '');
    setModalContent(localValues[index]?.content ?? '');
    setModalSpoiler(localValues[index]?.spoilerText ?? '');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const isModalDirty = () => {
    if (modalMode === 'add') {
      return modalTitle.trim() !== '' || modalContent.trim() !== '' || modalSpoiler.trim() !== '';
    }
    const original = localValues[modalIndex];
    return (
      modalTitle !== (original?.title ?? '') ||
      modalContent !== (original?.content ?? '') ||
      modalSpoiler !== (original?.spoilerText ?? '')
    );
  };

  const handleRequestClose = () => {
    if (isModalDirty()) openDiscardConfirm(closeModal);
    else closeModal();
  };

  const handleModalSave = async () => {
    if (modalMode === 'add') {
      const entry: HandHistoryEntry = {
        title: modalTitle.trim() || DEFAULT_ENTRY_TITLE,
        content: modalContent,
        spoilerText: modalSpoiler.trim() || undefined,
        comments: [],
      };
      const next = [...localValues, entry];
      setLocalValues(next);
      setSavingAll(true);
      try {
        await onUpdateHandHistories(next);
      } finally {
        setSavingAll(false);
      }
    } else {
      const existing = localValues[modalIndex];
      const entry: HandHistoryEntry = {
        title: modalTitle.trim() || DEFAULT_ENTRY_TITLE,
        content: modalContent,
        spoilerText: modalSpoiler.trim() || undefined,
        comments: existing?.comments ?? [],
      };
      const next = [...localValues];
      next[modalIndex] = entry;
      setLocalValues(next);
      setSavingIndex(modalIndex);
      try {
        await onUpdateHandHistories(next);
      } finally {
        setSavingIndex(null);
      }
    }
    closeModal();
  };

  const commentKey = (entryIndex: number, commentIndex: number) =>
    `${entryIndex}-${commentIndex}`;

  const updateEntryComments = (entryIndex: number, comments: HandHistoryComment[]) => {
    const next = [...localValues];
    const entry = { ...next[entryIndex], comments };
    next[entryIndex] = entry;
    setLocalValues(next);
    return next;
  };

  const handleAddComment = async (entryIndex: number) => {
    const text = commentTexts[entryIndex]?.trim();
    if (!text || !userName) return;
    const entry = localValues[entryIndex];
    const comments = [
      ...(entry.comments ?? []),
      { text, addedBy: userName, addedAt: new Date().toISOString() },
    ];
    setSavingIndex(entryIndex);
    try {
      await onUpdateHandHistories(updateEntryComments(entryIndex, comments));
      setCommentTexts((prev) => ({ ...prev, [String(entryIndex)]: '' }));
    } finally {
      setSavingIndex(null);
    }
  };

  const setCommentText = (entryIndex: number, value: string) => {
    setCommentTexts((prev) => ({ ...prev, [String(entryIndex)]: value }));
  };

  const handleSaveEditComment = (entryIndex: number, commentIndex: number) => {
    if (!editingCommentText.trim() || !userName) return;
    const entry = localValues[entryIndex];
    const comments = [...(entry.comments ?? [])];
    const existing = comments[commentIndex];
    if (!existing) return;
    comments[commentIndex] = {
      ...existing,
      text: editingCommentText.trim(),
      editedBy: userName,
      editedAt: new Date().toISOString(),
    };
    setEditingComment(null);
    setEditingCommentText('');
    void onUpdateHandHistories(updateEntryComments(entryIndex, comments));
  };

  const handleDeleteComment = async (entryIndex: number, commentIndex: number) => {
    const entry = localValues[entryIndex];
    const comments = (entry.comments ?? []).filter((_, j) => j !== commentIndex);
    setSavingIndex(entryIndex);
    try {
      await onUpdateHandHistories(updateEntryComments(entryIndex, comments));
      setDeleteCommentTarget(null);
    } finally {
      setSavingIndex(null);
    }
  };

  const toggleExpandedComment = (key: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSpoiler = (entryIndex: number) => {
    const key = `spoiler-${entryIndex}`;
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = async (index: number) => {
    const next = localValues.filter((_, i) => i !== index);
    setLocalValues(next);
    setExpandedItems((prev) => {
      const out: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = parseInt(k, 10);
        if (i < index) out[i] = v;
        else if (i > index) out[i - 1] = v;
      });
      return out;
    });
    setSavingAll(true);
    try {
      await onUpdateHandHistories(next);
    } finally {
      setSavingAll(false);
    }
  };

  return {
    expanded,
    setExpanded,
    localValues,
    expandedItems,
    modalOpen,
    modalMode,
    modalTitle,
    setModalTitle,
    modalContent,
    setModalContent,
    modalSpoiler,
    setModalSpoiler,
    saving,
    savingAll,
    savingIndex,
    openAddModal,
    openEditModal,
    handleRequestClose,
    handleModalSave,
    toggleItem,
    commentTexts,
    setCommentText,
    commentKey,
    expandedComments,
    toggleExpandedComment,
    toggleSpoiler,
    editingComment,
    editingCommentText,
    setEditingCommentText,
    setEditingComment,
    handleAddComment,
    handleSaveEditComment,
    handleDeleteComment,
    deleteCommentTarget,
    setDeleteCommentTarget,
    handleDelete,
    discardConfirmOpen,
    closeDiscardConfirm,
    handleDiscardConfirm,
    discardConfirmOptions,
  };
}
