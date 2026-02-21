import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { NoteEditor } from './NoteEditor';
import {
  STAKE_VALUES,
  PLAYER_TYPES,
  PLAYER_TYPE_COLORS,
  type Player,
  type PlayerType,
} from '../types';

interface PlayerCardProps {
  player: Player;
  onUpdate: (id: string, updates: Partial<Player>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function PlayerCard({ player, onUpdate, onDelete, onClose }: PlayerCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(player.username);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const accentColor = PLAYER_TYPE_COLORS[player.playerType];

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === player.username) {
      setEditingName(false);
      setNameValue(player.username);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(player._id, { username: trimmed });
      setEditingName(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = async (newType: PlayerType) => {
    setSaving(true);
    try {
      await onUpdate(player._id, { playerType: newType });
    } finally {
      setSaving(false);
    }
  };

  const handleStakeToggle = async (stake: number) => {
    const current = player.stakesSeenAt || [];
    const next = current.includes(stake)
      ? current.filter((s) => s !== stake)
      : [...current, stake].sort((a, b) => a - b);
    setSaving(true);
    try {
      await onUpdate(player._id, { stakesSeenAt: next });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    await onUpdate(player._id, { notes });
  };

  const handleAppendNotes = async (text: string) => {
    const merged = player.notes ? `${player.notes}\n${text}` : text;
    await onUpdate(player._id, { notes: merged });
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      await onDelete(player._id);
      setDeleteOpen(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderColor: accentColor,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          {editingName ? (
            <>
              <TextField
                size="small"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <Button size="small" onClick={handleSaveName} disabled={saving}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6">{player.username}</Typography>
              <IconButton size="small" onClick={() => setEditingName(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={player.playerType}
            onChange={(e) => handleTypeChange(e.target.value as PlayerType)}
            disabled={saving}
          >
            {PLAYER_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: PLAYER_TYPE_COLORS[t],
                    }}
                  />
                  {t}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Stakes seen at
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {STAKE_VALUES.map((s) => (
            <FormControlLabel
              key={s}
              control={
                <Checkbox
                  size="small"
                  checked={(player.stakesSeenAt || []).includes(s)}
                  onChange={() => handleStakeToggle(s)}
                  disabled={saving}
                />
              }
              label={s}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Notes
        </Typography>
        <NoteEditor
          notes={player.notes || ''}
          onSave={handleSaveNotes}
          onAppend={handleAppendNotes}
        />

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
            disabled={saving}
          >
            Delete Player
          </Button>
        </Box>
      </CardContent>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete player?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {player.username}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
