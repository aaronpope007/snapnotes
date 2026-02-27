import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Autocomplete from '@mui/material/Autocomplete';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { fetchPlayers } from '../../api/players';
import type { PlayerListItem } from '../../types';
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

interface AddLeakToPlayerModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  saving: boolean;
  onSubmit: (payload: LeakCreate & { linkedHandIds?: string[] }) => Promise<void>;
}

export function AddLeakToPlayerModal({
  open,
  onClose,
  userId,
  saving,
  onSubmit,
}: AddLeakToPlayerModalProps) {
  const [player, setPlayer] = useState<PlayerListItem | null>(null);
  const [customText, setCustomText] = useState('');
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    if (open) {
      setPlayer(null);
      setCustomText('');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setLoadingPlayers(true);
      fetchPlayers()
        .then((list) => setPlayers(list ?? []))
        .catch(() => setPlayers([]))
        .finally(() => setLoadingPlayers(false));
    }
  }, [open]);

  const handleAddCustom = async () => {
    if (!customText.trim() || !player || !userId) return;
    await onSubmit({
      title: customText.trim(),
      description: '',
      category: 'other',
      linkedHandIds: [],
      playerId: player._id,
      playerUsername: player.username,
    });
    setCustomText('');
  };

  const handleAddPreset = async (preset: LeakPreset) => {
    if (!player || !userId) return;
    await onSubmit({
      title: preset.title,
      description: '',
      category: preset.category,
      linkedHandIds: [],
      playerId: player._id,
      playerUsername: player.username,
    });
  };

  const canAdd = player && userId?.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add leak to player</DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Select player (who created the hand)
        </Typography>
        <Autocomplete
          options={players}
          getOptionLabel={(p) => p.username}
          value={player}
          onChange={(_, v) => setPlayer(v)}
          loading={loadingPlayers}
          size="small"
          sx={{ mb: 1.5 }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search player..." />
          )}
        />

        <Divider sx={{ my: 1.5 }} />

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
