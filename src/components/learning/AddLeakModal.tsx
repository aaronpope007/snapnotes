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
import type { Leak, LeakCreate, LeakCategory } from '../../types/learning';
import { LEAK_CATEGORY_LABELS } from '../../constants/learningColors';
import { LEAK_PRESETS } from '../../constants/leakPresets';

const LEAK_CATEGORIES: LeakCategory[] = [
  'preflop',
  'cbet',
  'river-sizing',
  'sizing',
  '3bet-defense',
  'bluff-frequency',
  'range-construction',
  'positional',
  'mental-game',
  'exploitative-adjustment',
  'study-process',
  'other',
];

interface AddLeakModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: LeakCategory;
  initialLinkedHandIds?: string[];
  editLeak?: Leak | null;
  saving: boolean;
  onSubmit: (payload: LeakCreate & { linkedHandIds: string[] }) => Promise<void>;
}

export function AddLeakModal({
  open,
  onClose,
  userId,
  initialTitle = '',
  initialDescription = '',
  initialCategory = 'other',
  initialLinkedHandIds = [],
  editLeak,
  saving,
  onSubmit,
}: AddLeakModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<LeakCategory>(initialCategory);
  const [linkedHands, setLinkedHands] = useState<HandToReview[]>([]);
  const [handOptions, setHandOptions] = useState<HandToReview[]>([]);
  const [loadingHands, setLoadingHands] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editLeak?.title ?? initialTitle);
      setDescription(editLeak?.description ?? initialDescription);
      setCategory((editLeak?.category as LeakCategory) ?? initialCategory);
    }
  }, [open, editLeak, initialTitle, initialDescription, initialCategory]);

  useEffect(() => {
    if (open && userId?.trim()) {
      setLoadingHands(true);
      fetchHandsToReview(undefined, userId)
        .then((hands) => {
          setHandOptions(hands ?? []);
          if (editLeak?.linkedHandIds?.length || initialLinkedHandIds.length) {
            const ids = new Set(editLeak?.linkedHandIds ?? initialLinkedHandIds);
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
  }, [open, userId, editLeak?.linkedHandIds, initialLinkedHandIds, editLeak?._id]);

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
          {editLeak ? 'Edit leak' : 'Add leak'}
        </DialogTitle>
        <DialogContent>
          {!editLeak && (
            <Autocomplete
              options={LEAK_PRESETS}
              getOptionLabel={(p) => p.title}
              groupBy={(p) => LEAK_CATEGORY_LABELS[p.category] ?? p.category}
              onChange={(_, preset) => {
                if (preset) {
                  setTitle(preset.title);
                  setCategory(preset.category);
                }
              }}
              size="small"
              sx={{ mb: 1 }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Pick from common leaks..." />
              )}
            />
          )}
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
              onChange={(e) => setCategory(e.target.value as LeakCategory)}
            >
              {LEAK_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {LEAK_CATEGORY_LABELS[c] ?? c}
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
            {saving ? 'Saving...' : editLeak ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
