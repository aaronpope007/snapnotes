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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { ExploitsDisplay } from './ExploitsDisplay';
import { StakesSection } from './StakesSection';
import { NotesSection } from './NotesSection';
import { useUserName } from '../context/UserNameContext';
import { useCompactMode } from '../context/CompactModeContext';
import {
  PLAYER_TYPE_KEYS,
  getPlayerTypeColor,
  getPlayerTypeLabel,
} from '../constants/playerTypes';
import type { Player, PlayerListItem, PlayerTypeKey, NoteEntry } from '../types';

interface PlayerCardProps {
  player: Player;
  players: PlayerListItem[];
  onUpdate: (id: string, updates: Partial<Player>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMergeClick: () => void;
  onClose: () => void;
  horizontal?: boolean;
}

export function PlayerCard({ player, players, onUpdate, onDelete, onMergeClick, onClose, horizontal = false }: PlayerCardProps) {
  const userName = useUserName();
  const compact = useCompactMode();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(player.username);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const accentColor = getPlayerTypeColor(player.playerType);

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

  const handleTypeChange = async (newType: PlayerTypeKey) => {
    setSaving(true);
    try {
      await onUpdate(player._id, { playerType: newType });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStakes = async (stakesSeenAt: number[]) => {
    setSaving(true);
    try {
      await onUpdate(player._id, { stakesSeenAt });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFormats = async (formats: string[]) => {
    setSaving(true);
    try {
      await onUpdate(player._id, { formats });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGameTypes = async (gameTypes: string[]) => {
    setSaving(true);
    try {
      await onUpdate(player._id, { gameTypes });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrigin = async (origin: string) => {
    setSaving(true);
    try {
      await onUpdate(player._id, { origin });
    } finally {
      setSaving(false);
    }
  };

  const handleAppendNote = async (text: string, addedBy: string) => {
    const currentNotes = player.notes || [];
    const newEntry: NoteEntry = {
      text,
      addedBy,
      addedAt: new Date().toISOString(),
    };
    const updated = [...currentNotes, newEntry];
    setSaving(true);
    try {
      await onUpdate(player._id, { notes: updated });
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = async (index: number, text: string, editedBy: string) => {
    const currentNotes = player.notes || [];
    const entry = currentNotes[index];
    if (!entry) return;
    const updated = currentNotes.map((e, i) =>
      i === index
        ? { ...e, text, editedBy, editedAt: new Date().toISOString() }
        : e
    );
    setSaving(true);
    try {
      await onUpdate(player._id, { notes: updated });
    } finally {
      setSaving(false);
    }
  };

  const handleAddExploit = async (text: string) => {
    const current = player.exploits || [];
    const next = [...current, text];
    setSaving(true);
    try {
      await onUpdate(player._id, { exploits: next });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExploit = async (index: number) => {
    const current = player.exploits || [];
    const next = current.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await onUpdate(player._id, { exploits: next });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (index: number) => {
    const current = player.notes || [];
    const next = current.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await onUpdate(player._id, { notes: next });
    } finally {
      setSaving(false);
    }
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
      <CardContent
        sx={[
          compact ? { p: 1.25, '&:last-child': { pb: 1.25 } } : {},
          horizontal ? { display: 'flex', flexDirection: 'column', gap: 0 } : {},
        ]}
      >
        {horizontal ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: compact ? 0.5 : 0.75 }}>
              <IconButton size="small" onClick={onClose} aria-label="Back to player list">
                <ArrowBackIcon />
              </IconButton>
            <Box sx={{ flex: 1 }}>
              {editingName ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TextField
                    size="small"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    sx={{ minWidth: 120 }}
                  />
                  <Button size="small" onClick={handleSaveName} disabled={saving}>
                    Save
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant={compact ? 'subtitle1' : 'h6'} sx={compact ? { fontSize: '0.85rem' } : undefined}>
                    {player.username}
                  </Typography>
                  <IconButton size="small" onClick={() => setEditingName(true)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: compact ? 0.5 : 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={player.playerType}
                  onChange={(e) => handleTypeChange(e.target.value as PlayerTypeKey)}
                  disabled={saving}
                >
                  {PLAYER_TYPE_KEYS.map((key) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: 1,
                            bgcolor: getPlayerTypeColor(key),
                          }}
                        />
                        {getPlayerTypeLabel(key)}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <StakesSection
                gameTypes={player.gameTypes || []}
                stakesSeenAt={player.stakesSeenAt || []}
                formats={player.formats || []}
                origin={player.origin || 'WPT Gold'}
                onUpdateGameTypes={handleUpdateGameTypes}
                onUpdateStakes={handleUpdateStakes}
                onUpdateFormats={handleUpdateFormats}
                onUpdateOrigin={handleUpdateOrigin}
                saving={saving}
                inline={true}
              />
              <ExploitsDisplay
                exploits={player.exploits || []}
                onAddExploit={handleAddExploit}
                onDeleteExploit={handleDeleteExploit}
                saving={saving}
                inline={true}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                <Button
                  size="small"
                  startIcon={<MergeTypeIcon />}
                  onClick={onMergeClick}
                  disabled={saving || players.length < 2}
                >
                  Merge
                </Button>
                <Button
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteOpen(true)}
                  disabled={saving}
                >
                  Delete
                </Button>
              </Box>
            </Box>
            <NotesSection
              key={player._id}
              notes={player.notes || []}
              onAppendNote={handleAppendNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              userName={userName}
              saving={saving}
            />
          </>
        ) : (
        <>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0.5 : 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
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
              <Typography variant={compact ? 'subtitle1' : 'h6'} sx={compact ? { fontSize: '0.85rem' } : undefined}>{player.username}</Typography>
              <IconButton size="small" onClick={() => setEditingName(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          )}
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close player card"
            sx={{ ml: 0.5, flexShrink: 0 }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: compact ? 1 : 2 }}>
          <Select
            value={player.playerType}
            onChange={(e) => handleTypeChange(e.target.value as PlayerTypeKey)}
            disabled={saving}
          >
            {PLAYER_TYPE_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: getPlayerTypeColor(key),
                    }}
                  />
                  {getPlayerTypeLabel(key)}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <StakesSection
          gameTypes={player.gameTypes || []}
          stakesSeenAt={player.stakesSeenAt || []}
          formats={player.formats || []}
          origin={player.origin || 'WPT Gold'}
          onUpdateGameTypes={handleUpdateGameTypes}
          onUpdateStakes={handleUpdateStakes}
          onUpdateFormats={handleUpdateFormats}
          onUpdateOrigin={handleUpdateOrigin}
          saving={saving}
        />

        <ExploitsDisplay
          exploits={player.exploits || []}
          onAddExploit={handleAddExploit}
          onDeleteExploit={handleDeleteExploit}
          saving={saving}
        />
        <NotesSection
          key={player._id}
          notes={player.notes || []}
          onAppendNote={handleAppendNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          userName={userName}
          saving={saving}
        />

        <Box sx={{ mt: compact ? 1 : 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<MergeTypeIcon />}
            onClick={onMergeClick}
            disabled={saving || players.length < 2}
          >
            Merge into another player
          </Button>
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
        </>
        )}
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
