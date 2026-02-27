import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { fetchHandsToReview } from '../../api/handsToReview';
import type { HandToReview } from '../../types';
import type { Edge, EdgeCreate, EdgeCategory } from '../../types/learning';
import { EDGE_CATEGORY_LABELS } from '../../constants/learningColors';

const EDGE_CATEGORIES: EdgeCategory[] = [
  'pool-tendency',
  'solver-deviation',
  'live-read',
  'sizing-exploit',
  'positional-edge',
  'meta-adjustment',
  'other',
];

interface AddEdgeModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: EdgeCategory;
  initialLinkedHandIds?: string[];
  editEdge?: Edge | null;
  saving: boolean;
  onSubmit: (payload: EdgeCreate & { linkedHandIds?: string[] }) => Promise<void>;
}

export function AddEdgeModal({
  open,
  onClose,
  userId,
  initialTitle = '',
  initialDescription = '',
  initialCategory = 'other',
  initialLinkedHandIds = [],
  editEdge,
  saving,
  onSubmit,
}: AddEdgeModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<EdgeCategory>(initialCategory);
  const [linkedHands, setLinkedHands] = useState<HandToReview[]>([]);
  const [handOptions, setHandOptions] = useState<HandToReview[]>([]);
  const [loadingHands, setLoadingHands] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editEdge?.title ?? initialTitle);
      setDescription(editEdge?.description ?? initialDescription);
      setCategory((editEdge?.category as EdgeCategory) ?? initialCategory);
    }
  }, [open, editEdge, initialTitle, initialDescription, initialCategory]);

  useEffect(() => {
    if (open && userId?.trim()) {
      setLoadingHands(true);
      fetchHandsToReview(undefined, userId)
        .then((hands) => {
          setHandOptions(hands ?? []);
          if (editEdge?.linkedHandIds?.length || initialLinkedHandIds.length) {
            const ids = new Set(editEdge?.linkedHandIds ?? initialLinkedHandIds);
            const selected = (hands ?? []).filter((h) => ids.has(h._id));
            setLinkedHands(selected);
          } else {
            setLinkedHands([]);
          }
        })
        .catch(() => setHandOptions([]))
        .finally(() => setLoadingHands(false));
    } else {
      setHandOptions([]);
      setLinkedHands([]);
    }
  }, [open, userId, editEdge?.linkedHandIds, initialLinkedHandIds, editEdge?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      linkedHandIds: linkedHands.map((h) => h._id) ?? [],
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editEdge ? 'Edit edge' : 'Add edge'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            minRows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
          />
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as EdgeCategory)}
            >
              {EDGE_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {EDGE_CATEGORY_LABELS[c] ?? c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Link hands from review
            </Typography>
            <Autocomplete
              multiple
              options={handOptions}
              getOptionLabel={(h) => h.title || 'Untitled'}
              value={linkedHands}
              onChange={(_, v) => setLinkedHands(v)}
              loading={loadingHands}
              size="small"
              renderInput={(params) => (
                <TextField {...params} placeholder="Search hands..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((h, i) => {
                  const { key, ...chipProps } = getTagProps({ index: i });
                  return (
                    <Chip
                      key={key}
                      label={h.title || 'Untitled'}
                      size="small"
                      {...chipProps}
                    />
                  );
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : editEdge ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
