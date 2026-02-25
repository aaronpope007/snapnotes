import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import type { HandHistoryEntry } from '../types';

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
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
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
    setModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setModalMode('edit');
    setModalIndex(index);
    setModalTitle(localValues[index]?.title ?? '');
    setModalContent(localValues[index]?.content ?? '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const isModalDirty = () => {
    if (modalMode === 'add') {
      return modalTitle.trim() !== '' || modalContent.trim() !== '';
    }
    const original = localValues[modalIndex];
    return (
      modalTitle !== (original?.title ?? '') ||
      modalContent !== (original?.content ?? '')
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
      const entry: HandHistoryEntry = {
        title: modalTitle.trim() || 'Hand',
        content: modalContent,
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
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={openAddModal}
              disabled={saving || savingAll}
            >
              Add
            </Button>
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
    </Box>
  );
}
