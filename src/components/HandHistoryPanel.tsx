import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Paper from '@mui/material/Paper';
import { RichNoteRenderer } from './RichNoteRenderer';
import { HandHistoryFormContent } from './HandHistoryFormContent';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useUserName } from '../context/UserNameContext';
import type { HandHistoryEntry, HandHistoryComment } from '../types';

const PANEL_WIDTH = 340;

interface HandHistoryPanelProps {
  handHistories: HandHistoryEntry[];
  onUpdateHandHistories: (handHistories: HandHistoryEntry[]) => Promise<void>;
  saving?: boolean;
}

export function HandHistoryPanel({
  handHistories,
  onUpdateHandHistories,
  saving = false,
}: HandHistoryPanelProps) {
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
  const [editingComment, setEditingComment] = useState<{ entryIndex: number; commentIndex: number } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{ entryIndex: number; commentIndex: number } | null>(null);
  const userName = useUserName();
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

  const closeModal = () => {
    setModalOpen(false);
  };

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
        title: modalTitle.trim() || 'Hand',
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
        title: modalTitle.trim() || 'Hand',
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

  const commentKey = (entryIndex: number, commentIndex: number) => `${entryIndex}-${commentIndex}`;

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
    const comments = [...(entry.comments ?? []), { text, addedBy: userName, addedAt: new Date().toISOString() }];
    setSavingIndex(entryIndex);
    try {
      await onUpdateHandHistories(updateEntryComments(entryIndex, comments));
      setCommentTexts((prev) => ({ ...prev, [String(entryIndex)]: '' }));
    } finally {
      setSavingIndex(null);
    }
  };

  const handleSaveEditComment = (entryIndex: number, commentIndex: number) => {
    if (!editingCommentText.trim() || !userName) return;
    const entry = localValues[entryIndex];
    const comments = [...(entry.comments ?? [])];
    const existing = comments[commentIndex];
    if (!existing) return;
    comments[commentIndex] = { ...existing, text: editingCommentText.trim(), editedBy: userName, editedAt: new Date().toISOString() };
    setEditingComment(null);
    setEditingCommentText('');
    onUpdateHandHistories(updateEntryComments(entryIndex, comments));
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <IconButton
        size="small"
        onClick={() => setExpanded(!expanded)}
        sx={{
          alignSelf: 'flex-start',
          mt: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
      >
        {expanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>

      {expanded && (
        <Paper
          elevation={0}
          sx={{
            width: PANEL_WIDTH,
            minWidth: PANEL_WIDTH,
            ml: 0.5,
            p: 2,
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'auto',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Hand Histories
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={openAddModal}
                disabled={saving || savingAll}
              >
                Add
              </Button>
              <IconButton
                size="small"
                onClick={() => setExpanded(false)}
                aria-label="Close panel"
                sx={{ p: 0.25 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            {localValues.map((entry, i) => (
              <Box
                key={i}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="button"
                  onClick={() => toggleItem(i)}
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
                    bgcolor: expandedItems[i] ? 'action.selected' : 'action.hover',
                  }}
                >
                  <IconButton size="small" sx={{ p: 0 }}>
                    {expandedItems[i] ? (
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
                      color: 'text.primary',
                    }}
                  >
                    {entry.title || `Hand ${i + 1}`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(i);
                    }}
                    disabled={saving || savingAll}
                    sx={{ p: 0.25 }}
                    aria-label="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(i);
                    }}
                    disabled={saving || savingAll}
                    sx={{ p: 0.25 }}
                    aria-label="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Collapse in={expandedItems[i]}>
                  <Box
                    sx={{
                      fontSize: '0.8rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      p: 1,
                      pt: 0,
                      bgcolor: 'background.default',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {entry.content ? (
                      <RichNoteRenderer text={entry.content} />
                    ) : (
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        No content
                      </Typography>
                    )}
                    {(entry.spoilerText ?? '').trim() !== '' && (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          component="button"
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => {
                              const next = new Set(prev);
                              if (next.has(`spoiler-${i}`)) next.delete(`spoiler-${i}`);
                              else next.add(`spoiler-${i}`);
                              return next;
                            })
                          }
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
                          {expandedComments.has(`spoiler-${i}`) ? (
                            <ExpandLessIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <ExpandMoreIcon sx={{ fontSize: 14 }} />
                          )}
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {expandedComments.has(`spoiler-${i}`) ? 'Hide spoiler' : 'Reveal spoiler'}
                          </Typography>
                        </Box>
                        <Collapse in={expandedComments.has(`spoiler-${i}`)}>
                          <Box sx={{ mt: 0.5, p: 0.5, borderRadius: 0.5, bgcolor: 'action.hover' }}>
                            <RichNoteRenderer text={entry.spoilerText ?? ''} />
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mt: 1 }}>
                      Comments ({(entry.comments ?? []).length})
                    </Typography>
                    <Box sx={{ mt: 0.5, mb: 1 }}>
                      {(entry.comments ?? []).map((c, j) => {
                        const key = commentKey(i, j);
                        const expanded = expandedComments.has(key);
                        const isEditing = editingComment?.entryIndex === i && editingComment?.commentIndex === j;
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
                              onClick={() =>
                                setExpandedComments((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(key)) next.delete(key);
                                  else next.add(key);
                                  return next;
                                })
                              }
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
                              {expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
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
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      sx={{ '& .MuiInputBase-input': { resize: 'none' } }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                      <Button size="small" onClick={() => { setEditingComment(null); setEditingCommentText(''); }}>
                                        Cancel
                                      </Button>
                                      <Button size="small" variant="contained" onClick={() => handleSaveEditComment(i, j)} disabled={!editingCommentText.trim() || savingIndex === i}>
                                        Save
                                      </Button>
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <RichNoteRenderer text={c.text} />
                                    <Box sx={{ display: 'flex', gap: 0, mt: 0.25 }}>
                                      <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); setEditingComment({ entryIndex: i, commentIndex: j }); setEditingCommentText(c.text); }} aria-label="Edit comment">
                                        <EditIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                      <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); setDeleteCommentTarget({ entryIndex: i, commentIndex: j }); }} aria-label="Delete comment">
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
                        value={commentTexts[String(i)] ?? ''}
                        onChange={(e) => setCommentTexts((prev) => ({ ...prev, [String(i)]: e.target.value }))}
                        disabled={savingIndex === i}
                        sx={{ '& .MuiInputBase-input': { resize: 'none' } }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddComment(i)}
                        disabled={!(commentTexts[String(i)]?.trim()) || savingIndex === i || !userName}
                      >
                        Add
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Dialog open={modalOpen} onClose={handleRequestClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Typography component="span" variant="h6">
              {modalMode === 'add' ? 'Add hand history' : 'Edit hand history'}
            </Typography>
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              — click a card to insert at cursor
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <HandHistoryFormContent
            title={modalTitle}
            onTitleChange={setModalTitle}
            content={modalContent}
            onContentChange={setModalContent}
            spoilerValue={modalSpoiler}
            onSpoilerChange={setModalSpoiler}
            contentLabel="Content"
            placeholder="Paste hand history… Click a card on the right to insert at cursor"
            cardSize="xs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRequestClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleModalSave}
            disabled={saving || savingAll || savingIndex !== null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={discardConfirmOpen}
        onClose={closeDiscardConfirm}
        onConfirm={handleDiscardConfirm}
        {...discardConfirmOptions}
      />

      <Dialog open={deleteCommentTarget !== null} onClose={() => setDeleteCommentTarget(null)}>
        <DialogTitle>Delete comment?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this comment? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCommentTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteCommentTarget) {
                handleDeleteComment(deleteCommentTarget.entryIndex, deleteCommentTarget.commentIndex);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
