import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import type { LeakCreate } from '../../types/learning';
import { LEAK_CATEGORY_LABELS } from '../../constants/learningColors';
import { LEAK_PRESETS } from '../../constants/leakPresets';
import type { LeakPreset } from '../../constants/leakPresets';

function groupByCategory(presets: LeakPreset[]): Map<string, LeakPreset[]> {
  const map = new Map<string, LeakPreset[]>();
  for (const p of presets) {
    const label = LEAK_CATEGORY_LABELS[p.category] ?? p.category;
    const list = map.get(label) ?? [];
    list.push(p);
    map.set(label, list);
  }
  return map;
}

interface AddLeakToSelfModalProps {
  open: boolean;
  onClose: () => void;
  handId: string;
  handTitle?: string;
  userId: string | null;
  saving: boolean;
  onSubmit: (payload: LeakCreate & { linkedHandIds?: string[] }) => Promise<void>;
}

export function AddLeakToSelfModal({
  open,
  onClose,
  handId,
  handTitle,
  userId,
  saving,
  onSubmit,
}: AddLeakToSelfModalProps) {
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    if (open) setCustomText('');
  }, [open]);

  const handleAddCustom = async () => {
    if (!customText.trim() || !userId) return;
    await onSubmit({
      title: customText.trim(),
      description: '',
      category: 'other',
      linkedHandIds: [handId],
    });
    setCustomText('');
  };

  const handleAddPreset = async (preset: LeakPreset) => {
    if (!userId) return;
    await onSubmit({
      title: preset.title,
      description: '',
      category: preset.category,
      linkedHandIds: [handId],
    });
  };

  const canAdd = userId?.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add leak to myself</DialogTitle>
      <DialogContent>
        {handTitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Hand: {handTitle}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Custom leak
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom leak..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleAddCustom();
              }
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => void handleAddCustom()}
            disabled={saving || !customText.trim() || !canAdd}
          >
            Add
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Or select from list
        </Typography>
        <List dense disablePadding sx={{ maxHeight: 280, overflowY: 'auto' }}>
          {Array.from(groupByCategory(LEAK_PRESETS).entries()).map(([categoryLabel, items]) => (
            <Box key={categoryLabel}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', px: 1, py: 0.25, fontWeight: 600 }}
              >
                {categoryLabel}
              </Typography>
              {items.map((preset) => (
                <ListItemButton
                  key={preset.title}
                  onClick={() => void handleAddPreset(preset)}
                  disabled={saving || !canAdd}
                  sx={{ py: 0.25, minHeight: 36 }}
                >
                  <ListItemText
                    primary={preset.title}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItemButton>
              ))}
            </Box>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
