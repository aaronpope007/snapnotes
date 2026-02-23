import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SearchBar } from './components/SearchBar';
import { PlayerCard } from './components/PlayerCard';
import { HandHistoryPanel } from './components/HandHistoryPanel';
import { AddPlayerModal } from './components/AddPlayerModal';
import { ImportModal } from './components/ImportModal';
import {
  fetchPlayers,
  fetchPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  importPlayers,
} from './api/players';
import type { Player, PlayerListItem, PlayerCreate, ImportPlayer } from './types';

export default function App() {
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialUsername, setAddInitialUsername] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success' });
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error' });

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlayers();
      setPlayers(Array.isArray(data) ? data : []);
    } catch {
      setPlayers([]);
      showError('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleSelectPlayer = async (p: PlayerListItem) => {
    try {
      const full = await fetchPlayer(p._id);
      setSelected(full);
    } catch {
      showError('Failed to load player');
    }
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      const updated = await updatePlayer(id, updates);
      setPlayers((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                username: updated.username,
                playerType: updated.playerType,
                stakesSeenAt: updated.stakesSeenAt,
              }
            : p
        )
      );
      if (selected?._id === id) setSelected(updated);
      showSuccess('Player updated');
    } catch {
      showError('Failed to update player');
      throw new Error('Update failed');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      await deletePlayer(id);
      setPlayers((prev) => prev.filter((p) => p._id !== id));
      if (selected?._id === id) setSelected(null);
      showSuccess('Player deleted');
    } catch {
      showError('Failed to delete player');
      throw new Error('Delete failed');
    }
  };

  const handleAddPlayer = async (player: PlayerCreate) => {
    try {
      const created = await createPlayer(player);
      setPlayers((prev) =>
        [...prev, { _id: created._id, username: created.username, playerType: created.playerType, stakesSeenAt: created.stakesSeenAt }].sort(
          (a, b) => a.username.localeCompare(b.username)
        )
      );
      setSelected(created);
      showSuccess('Player added');
    } catch {
      showError('Failed to add player');
      throw new Error('Add failed');
    }
  };

  const handleImport = async (toImport: ImportPlayer[]) => {
    const result = await importPlayers(toImport);
    await loadPlayers();
    showSuccess(`Imported: ${result.created} new, ${result.updated} updated`);
    return result;
  };

  const existingUsernames = new Set(players.map((p) => p.username.toLowerCase()));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        width: '100%',
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      <Container maxWidth={false} sx={{ py: 2, px: 2, maxWidth: 900 }}>
        <Box sx={{ mb: 2 }}>
          <SearchBar
            players={players}
            onSelect={handleSelectPlayer}
            onNoMatchCreate={(username) => {
              setAddInitialUsername(username);
              setAddOpen(true);
            }}
            selectedId={selected?._id}
          />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
            >
              Add Player
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ImportExportIcon />}
              onClick={() => setImportOpen(true)}
            >
              Import
            </Button>
          </Box>
        </Box>

        {loading && !players.length ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            Loading...
          </Box>
        ) : selected ? (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            <ErrorBoundary>
              <Box sx={{ flex: '0 0 400px', maxWidth: 400 }}>
                <PlayerCard
                  player={selected}
                  onUpdate={handleUpdatePlayer}
                  onDelete={handleDeletePlayer}
                  onClose={() => setSelected(null)}
                />
              </Box>
            </ErrorBoundary>
            <HandHistoryPanel
              handHistories={selected.handHistories ?? ''}
              exploitHandExamples={selected.exploitHandExamples ?? []}
              exploits={selected.exploits ?? []}
              onUpdateHandHistories={async (value) =>
                handleUpdatePlayer(selected._id, { handHistories: value })
              }
              onUpdateExploitHandExample={async (index, value) => {
                const next = [...(selected.exploitHandExamples ?? [])];
                while (next.length <= index) next.push('');
                next[index] = value;
                await handleUpdatePlayer(selected._id, { exploitHandExamples: next });
              }}
            />
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            Search for a player or add a new one.
          </Box>
        )}
      </Container>

      <AddPlayerModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddInitialUsername('');
        }}
        onSubmit={handleAddPlayer}
        initialUsername={addInitialUsername}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        existingUsernames={existingUsernames}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
