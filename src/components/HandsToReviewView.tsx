import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { RichNoteRenderer } from './RichNoteRenderer';
import { HandHistoryFormContent } from './HandHistoryFormContent';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useUserName } from '../context/UserNameContext';
import {
  fetchHandsToReview,
  createHandToReview,
  updateHandToReview,
  addHandComment,
  deleteHandComment,
  deleteHandToReview,
} from '../api/handsToReview';
import type { HandToReview, HandToReviewStatus } from '../types';

interface HandsToReviewViewProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function HandsToReviewView({ onSuccess, onError }: HandsToReviewViewProps) {
  const userName = useUserName();
  const [hands, setHands] = useState<HandToReview[]>([]);
  const [filter, setFilter] = useState<'all' | HandToReviewStatus>('open');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addHandText, setAddHandText] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [editHand, setEditHand] = useState<HandToReview | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHandText, setEditHandText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [commentSaving, setCommentSaving] = useState<string | null>(null);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{
    handId: string;
    commentIndex: number;
  } | null>(null);
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
    addTitle.trim() !== '' || addHandText.trim() !== '';

  const isEditModalDirty = () =>
    editHand !== null &&
    (editTitle !== (editHand.title ?? '') ||
      editHandText !== (editHand.handText ?? ''));

  const closeAddModal = () => {
    if (isAddModalDirty()) {
      openDiscardConfirm(() => {
        setAddModalOpen(false);
        setAddTitle('');
        setAddHandText('');
      });
    } else {
      setAddModalOpen(false);
      setAddTitle('');
      setAddHandText('');
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
        createdBy: userName || 'Anonymous',
      });
      setHands((prev) => [created, ...prev]);
      setAddModalOpen(false);
      setAddTitle('');
      setAddHandText('');
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
      setHands((prev) =>
        prev.map((h) => (h._id === hand._id ? updated : h))
      );
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
  };

  const handleEditSave = async () => {
    if (!editHand || !editHandText.trim()) return;
    setEditSaving(true);
    try {
      const updated = await updateHandToReview(editHand._id, {
        title: editTitle.trim() || 'Untitled hand',
        handText: editHandText.trim(),
      });
      setHands((prev) =>
        prev.map((h) => (h._id === editHand._id ? updated : h))
      );
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
      setHands((prev) =>
        prev.map((h) => (h._id === id ? updated : h))
      );
      setCommentTexts((prev) => ({ ...prev, [id]: '' }));
      onSuccess?.('Comment added');
    } catch {
      onError?.('Failed to add comment');
    } finally {
      setCommentSaving(null);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deleteCommentTarget) return;
    const { handId, commentIndex } = deleteCommentTarget;
    setCommentSaving(handId);
    try {
      const updated = await deleteHandComment(handId, commentIndex);
      setHands((prev) =>
        prev.map((h) => (h._id === handId ? updated : h))
      );
      setDeleteCommentTarget(null);
      onSuccess?.('Comment deleted');
    } catch {
      onError?.('Failed to delete comment');
    } finally {
      setCommentSaving(null);
    }
  };

  const displayHands = hands;

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Hands to Review
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => v != null && setFilter(v)}
            size="small"
          >
            <ToggleButton value="open">Open</ToggleButton>
            <ToggleButton value="archived">Archived</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Hand
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : displayHands.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hands to review. Add one to get started.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {displayHands.map((hand) => {
            const expanded = expandedId === hand._id;
            return (
              <Paper
                key={hand._id}
                variant="outlined"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : hand._id)
                  }
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    width: '100%',
                    p: 1,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    bgcolor: expanded ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
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
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    {hand.title || 'Untitled hand'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    {hand.status === 'archived' ? 'Archived' : 'Open'}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(hand);
                    }}
                    sx={{ p: 0.25 }}
                    aria-label="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(hand);
                    }}
                    sx={{ p: 0.25 }}
                    aria-label={hand.status === 'archived' ? 'Unarchive' : 'Archive'}
                  >
                    {hand.status === 'archived' ? (
                      <UnarchiveIcon fontSize="small" />
                    ) : (
                      <ArchiveIcon fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(hand._id);
                    }}
                    sx={{ p: 0.25 }}
                    aria-label="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Collapse in={expanded}>
                  <Box
                    sx={{
                      p: 1.5,
                      pt: 0,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      by {hand.createdBy} • {new Date(hand.createdAt).toLocaleDateString()}
                    </Typography>
                    <Box
                      sx={{
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        mb: 1.5,
                      }}
                    >
                      {hand.handText ? (
                        <RichNoteRenderer text={hand.handText} />
                      ) : (
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          No hand text
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Comments ({hand.comments?.length ?? 0})
                    </Typography>
                    <Box sx={{ mt: 0.5, mb: 1 }}>
                      {(hand.comments ?? []).map((c, i) => (
                        <Box
                          key={i}
                          sx={{
                            py: 0.5,
                            px: 1,
                            mb: 0.5,
                            bgcolor: 'background.paper',
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 0.5,
                            '&:hover .comment-delete-btn': {
                              opacity: 1,
                            },
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              {c.addedBy} • {new Date(c.addedAt).toLocaleString()}
                            </Typography>
                            <Box sx={{ mt: 0.25 }}>
                              <RichNoteRenderer text={c.text} />
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            className="comment-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCommentTarget({ handId: hand._id, commentIndex: i });
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
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Add a comment..."
                        value={commentTexts[hand._id] ?? ''}
                        onChange={(e) =>
                          setCommentTexts((prev) => ({
                            ...prev,
                            [hand._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(hand._id);
                          }
                        }}
                        disabled={commentSaving === hand._id}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddComment(hand._id)}
                        disabled={
                          !(commentTexts[hand._id]?.trim()) ||
                          commentSaving === hand._id
                        }
                      >
                        Add
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Box>
      )}

      <Dialog open={addModalOpen} onClose={closeAddModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          <Typography component="span" variant="h6">
            Add hand for review
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            — click a card to insert at cursor
          </Typography>
        </DialogTitle>
        <DialogContent>
          <HandHistoryFormContent
            title={addTitle}
            onTitleChange={setAddTitle}
            content={addHandText}
            onContentChange={setAddHandText}
            contentLabel="Hand text"
            placeholder="Paste hand history... Click a card on the right to insert at cursor"
            contentRequired
            cardSize="xs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddHand}
            disabled={addSaving || !addHandText.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editHand !== null}
        onClose={closeEditModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Typography component="span" variant="h6">
            Edit hand
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            — click a card to insert at cursor
          </Typography>
        </DialogTitle>
        <DialogContent>
          <HandHistoryFormContent
            title={editTitle}
            onTitleChange={setEditTitle}
            content={editHandText}
            onContentChange={setEditHandText}
            contentLabel="Hand text"
            placeholder="Paste hand history... Click a card on the right to insert at cursor"
            contentRequired
            cardSize="xs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editSaving || !editHandText.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteCommentTarget !== null}
        onClose={() => setDeleteCommentTarget(null)}
      >
        <DialogTitle>Delete comment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this comment? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCommentTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteComment}
            disabled={
              commentSaving === (deleteCommentTarget?.handId ?? null)
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={discardConfirmOpen}
        onClose={closeDiscardConfirm}
        onConfirm={handleDiscardConfirm}
        {...discardConfirmOptions}
      />
    </Box>
  );
}
