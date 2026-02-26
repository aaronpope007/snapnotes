import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import RateReviewIcon from '@mui/icons-material/RateReview';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SearchBar } from './components/SearchBar';
import { PlayerCard } from './components/PlayerCard';
import { HandHistoryPanel } from './components/HandHistoryPanel';
import { HandsToReviewView } from './components/HandsToReviewView';
import { AddPlayerModal } from './components/AddPlayerModal';
import { ImportModal } from './components/ImportModal';
import { MergePlayerDialog } from './components/MergePlayerDialog';
import { RestoreBackupConfirmDialog } from './components/RestoreBackupConfirmDialog';
import {
  fetchPlayers,
  fetchPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  importPlayers,
  mergePlayers,
} from './api/players';
import { exportBackup, restoreBackup, type BackupPayload } from './api/backup';
import { getApiErrorMessage } from './utils/apiError';
import { getPlayerTypeColor, getPlayerTypeLabel } from './constants/playerTypes';
import type { Player, PlayerListItem, PlayerCreate, ImportPlayer } from './types';

export default function App() {
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialUsername, setAddInitialUsername] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);
  const [showHandsToReview, setShowHandsToReview] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restorePayload, setRestorePayload] = useState<BackupPayload | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
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
    } catch (err) {
      setPlayers([]);
      showError(getApiErrorMessage(err, 'Failed to load players'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleSelectPlayer = async (p: PlayerListItem) => {
    try {
      setShowHandsToReview(false);
      const full = await fetchPlayer(p._id);
      setSelected(full);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to load player'));
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
                gameTypes: updated.gameTypes ?? p.gameTypes,
                stakesSeenAt: updated.stakesSeenAt,
                formats: updated.formats,
                origin: updated.origin,
                updatedAt: updated.updatedAt,
              }
            : p
        )
      );
      if (selected?._id === id) setSelected(updated);
      showSuccess('Player updated');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to update player'));
      throw new Error('Update failed');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      await deletePlayer(id);
      setPlayers((prev) => prev.filter((p) => p._id !== id));
      if (selected?._id === id) setSelected(null);
      showSuccess('Player deleted');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to delete player'));
      throw new Error('Delete failed');
    }
  };

  const handleAddPlayer = async (player: PlayerCreate) => {
    try {
      const created = await createPlayer(player);
      setPlayers((prev) =>
        [...prev, { _id: created._id, username: created.username, playerType: created.playerType, gameTypes: created.gameTypes ?? [], stakesSeenAt: created.stakesSeenAt ?? [], formats: created.formats ?? [], origin: created.origin ?? 'WPT Gold', updatedAt: created.updatedAt, createdAt: created.createdAt }].sort(
          (a, b) => a.username.localeCompare(b.username)
        )
      );
      setSelected(created);
      showSuccess('Player added');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to add player'));
      throw new Error('Add failed');
    }
  };

  const handleImport = async (toImport: ImportPlayer[]) => {
    try {
      const result = await importPlayers(toImport);
      await loadPlayers();
      showSuccess(`Imported: ${result.created} new, ${result.updated} updated`);
      return result;
    } catch (err) {
      showError(getApiErrorMessage(err, 'Import failed'));
      throw new Error('Import failed');
    }
  };

  const handleExportBackup = async () => {
    try {
      const payload = await exportBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapnotes-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Backup exported');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to export backup'));
    }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result as string) as BackupPayload;
        if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file');
        setRestorePayload({
          exportedAt: payload.exportedAt ?? '',
          players: Array.isArray(payload.players) ? payload.players : [],
          handsToReview: Array.isArray(payload.handsToReview) ? payload.handsToReview : [],
        });
        setRestoreDialogOpen(true);
      } catch {
        showError('Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restorePayload) return;
    setRestoreLoading(true);
    try {
      await restoreBackup(restorePayload);
      setRestoreDialogOpen(false);
      setRestorePayload(null);
      await loadPlayers();
      setSelected(null);
      showSuccess('Backup restored');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to restore backup'));
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await loadPlayers();
    if (selected) {
      try {
        const full = await fetchPlayer(selected._id);
        setSelected(full);
      } catch {
        // keep current selected on refresh failure
      }
    }
  }, [loadPlayers, selected]);

  const handleMergeConfirm = async (targetId: string) => {
    if (!selected) return;
    setMergeLoading(true);
    try {
      const merged = await mergePlayers(selected._id, targetId);
      await loadPlayers();
      setSelected(merged);
      setMergeDialogOpen(false);
      showSuccess('Players merged');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to merge players'));
    } finally {
      setMergeLoading(false);
    }
  };

  const existingUsernames = new Set(players.map((p) => p.username.toLowerCase()));

  const recentPlayers = useMemo(() => {
    return [...players]
      .filter((p) => p.updatedAt ?? p.createdAt)
      .sort((a, b) => {
        const aTs = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const bTs = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return bTs - aTs;
      })
      .slice(0, 10);
  }, [players]);

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
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => void handleRefresh()} aria-label="Refresh" disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
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
            <Button variant="outlined" size="small" onClick={handleExportBackup}>
              Export backup
            </Button>
            <Button
              variant="outlined"
              size="small"
              component="label"
            >
              Restore backup
              <input
                ref={backupFileInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={handleRestoreFileChange}
              />
            </Button>
            <Button
              variant={showHandsToReview ? 'contained' : 'outlined'}
              size="small"
              startIcon={<RateReviewIcon />}
              onClick={() => setShowHandsToReview(!showHandsToReview)}
            >
              Hands to Review
            </Button>
          </Box>
        </Box>

        {showHandsToReview ? (
          <Box>
            <Button
              variant="text"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowHandsToReview(false)}
              sx={{ mb: 1 }}
            >
              {selected ? `Back to ${selected.username}` : 'Back to Players'}
            </Button>
            <ErrorBoundary>
              <HandsToReviewView
                onSuccess={showSuccess}
                onError={showError}
              />
            </ErrorBoundary>
          </Box>
        ) : loading && !players.length ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            Loading...
          </Box>
        ) : selected ? (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            <ErrorBoundary>
              <Box sx={{ flex: '0 0 400px', maxWidth: 400 }}>
                <PlayerCard
                  player={selected}
                  players={players}
                  onUpdate={handleUpdatePlayer}
                  onDelete={handleDeletePlayer}
                  onMergeClick={() => setMergeDialogOpen(true)}
                  onClose={() => setSelected(null)}
                />
              </Box>
            </ErrorBoundary>
            <HandHistoryPanel
              handHistories={selected.handHistories ?? []}
              onUpdateHandHistories={async (handHistories) =>
                handleUpdatePlayer(selected._id, { handHistories })
              }
            />
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Search for a player or add a new one.
            </Typography>
            {recentPlayers.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  Recent players
                </Typography>
                <List dense disablePadding>
                  {recentPlayers.map((p) => (
                    <ListItemButton
                      key={p._id}
                      onClick={() => handleSelectPlayer(p)}
                      sx={{
                        borderRadius: 0.5,
                        py: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                          {p.username}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: '0.7rem',
                            bgcolor: getPlayerTypeColor(p.playerType),
                            color: 'rgba(0,0,0,0.7)',
                          }}
                        >
                          {getPlayerTypeLabel(p.playerType)}
                        </Box>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(p.updatedAt ?? p.createdAt ?? '').toLocaleDateString()}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
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

      {selected && (
        <MergePlayerDialog
          open={mergeDialogOpen}
          onClose={() => setMergeDialogOpen(false)}
          sourcePlayer={selected}
          players={players}
          onConfirm={handleMergeConfirm}
          loading={mergeLoading}
        />
      )}

      <RestoreBackupConfirmDialog
        open={restoreDialogOpen}
        onClose={() => { setRestoreDialogOpen(false); setRestorePayload(null); }}
        onConfirm={handleConfirmRestore}
        playerCount={restorePayload?.players?.length ?? 0}
        handsToReviewCount={restorePayload?.handsToReview?.length ?? 0}
        loading={restoreLoading}
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
