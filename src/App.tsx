import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SchoolIcon from '@mui/icons-material/School';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import PersonIcon from '@mui/icons-material/Person';
import EditNoteIcon from '@mui/icons-material/EditNote';
import TuneIcon from '@mui/icons-material/Tune';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SearchBar } from './components/SearchBar';
import { PlayerCard } from './components/PlayerCard';
import { HandHistoryPanel } from './components/HandHistoryPanel';
import { HandsToReviewView } from './components/HandsToReviewView';
import { LearningPage } from './pages/LearningPage';
import { AddPlayerModal } from './components/AddPlayerModal';
import { ImportModal } from './components/ImportModal';
import { MergePlayerDialog } from './components/MergePlayerDialog';
import { RestoreBackupConfirmDialog } from './components/RestoreBackupConfirmDialog';
import { ChangeNameDialog } from './components/ChangeNameDialog';
import { ImprovementNotesDialog } from './components/ImprovementNotesDialog';
import { DefaultStakesDialog } from './components/DefaultStakesDialog';
import { MDFPanel } from './components/MDFPanel';
import { FoldEquityPanel } from './components/FoldEquityPanel';
import { GeoPanel } from './components/GeoPanel';
import { useCompactMode, useSetCompactMode } from './context/CompactModeContext';
import { useHorizontalMode, useSetHorizontalMode } from './context/HorizontalModeContext';
import { useCalculatorVisibility, useSetCalculatorVisibility } from './context/CalculatorVisibilityContext';
import { useLearningVisibility, useSetLearningVisibility } from './context/LearningVisibilityContext';
import { useDarkMode, useSetDarkMode } from './context/DarkModeContext';
import { useUserCredentials } from './context/UserNameContext';
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

/** Interpolate background color: 1 = reddest, 99–100 = passive grey. */
function getRngButtonBgColor(value: number | null): string | undefined {
  if (value === null) return undefined;
  const t = Math.max(0, Math.min(1, (value - 1) / 98)); // 1→0, 99→1
  const [r1, g1, b1] = [0xb7, 0x1c, 0x1c]; // red
  const [r2, g2, b2] = [0x42, 0x42, 0x42]; // passive grey
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export default function App() {
  const compact = useCompactMode();
  const setCompact = useSetCompactMode();
  const horizontal = useHorizontalMode();
  const setHorizontal = useSetHorizontalMode();
  const calcVisibility = useCalculatorVisibility();
  const setCalcVisibility = useSetCalculatorVisibility();
  const learningVisible = useLearningVisibility();
  const setLearningVisible = useSetLearningVisibility();

  useEffect(() => {
    if (!learningVisible) setShowLearning(false);
  }, [learningVisible]);
  const darkMode = useDarkMode();
  const setDarkMode = useSetDarkMode();
  const { getAuthHeader } = useUserCredentials();
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialUsername, setAddInitialUsername] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);
  const [showHandsToReview, setShowHandsToReview] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restorePayload, setRestorePayload] = useState<BackupPayload | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const settingsOpen = Boolean(settingsAnchorEl);
  const [changeNameOpen, setChangeNameOpen] = useState(false);
  const [improvementNotesOpen, setImprovementNotesOpen] = useState(false);
  const [defaultStakesDialogOpen, setDefaultStakesDialogOpen] = useState(false);
  const [rngValue, setRngValue] = useState<number | null>(null);
  const handleRngClick = () => setRngValue(Math.floor(Math.random() * 100) + 1);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success' });
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error' });

  const loadPlayers = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchPlayers();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      setPlayers([]);
      if (!opts?.silent) showError(getApiErrorMessage(err, 'Failed to load players'));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Daily background refresh when app stays open (catches updates from other users)
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    const interval = setInterval(() => {
      void loadPlayers({ silent: true });
      const id = selectedRef.current?._id;
      if (id) {
        fetchPlayer(id).then(setSelected).catch(() => {});
      }
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPlayers]);

  const handleSelectPlayer = async (p: PlayerListItem) => {
    try {
      setShowHandsToReview(false);
      setShowLearning(false);
      const full = await fetchPlayer(p._id);
      setSelected(full);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to load player'));
    }
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      const updated = await updatePlayer(id, updates, getAuthHeader());
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
      const created = await createPlayer(player, getAuthHeader());
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
      const result = await importPlayers(toImport, getAuthHeader());
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

  const menuAndInput = (
    <>
      <Menu
        id="settings-menu"
        anchorEl={settingsAnchorEl}
        open={settingsOpen}
        onClose={() => setSettingsAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { setSettingsAnchorEl(null); setChangeNameOpen(true); }}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Change my name
        </MenuItem>
        <MenuItem onClick={() => { setSettingsAnchorEl(null); setImprovementNotesOpen(true); }}>
          <EditNoteIcon fontSize="small" sx={{ mr: 1 }} />
          Improvement notes
        </MenuItem>
        <MenuItem onClick={() => { setSettingsAnchorEl(null); setDefaultStakesDialogOpen(true); }}>
          <TuneIcon fontSize="small" sx={{ mr: 1 }} />
          Default stakes for new players
        </MenuItem>
        <MenuItem onClick={() => { setSettingsAnchorEl(null); setImportOpen(true); }}>
          <ImportExportIcon fontSize="small" sx={{ mr: 1 }} />
          Import
        </MenuItem>
        <MenuItem onClick={() => { setSettingsAnchorEl(null); handleExportBackup(); }}>
          <SaveIcon fontSize="small" sx={{ mr: 1 }} />
          Export backup
        </MenuItem>
        <MenuItem onClick={() => { setSettingsAnchorEl(null); backupFileInputRef.current?.click(); }}>
          <RestoreIcon fontSize="small" sx={{ mr: 1 }} />
          Restore backup
        </MenuItem>
        <MenuItem onClick={() => { setSettingsAnchorEl(null); void handleRefresh(); }} disabled={loading}>
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          Refresh
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Dark mode</Box>
          <Switch size="small" checked={darkMode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDarkMode(e.target.checked)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewCompactIcon fontSize="small" />
            Compact mode
          </Box>
          <Switch size="small" checked={compact} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompact(e.target.checked)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewAgendaIcon fontSize="small" />
            Horizontal layout
          </Box>
          <Switch size="small" checked={horizontal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHorizontal(e.target.checked)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>MDF</Box>
          <Switch size="small" checked={calcVisibility.showMDF} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcVisibility({ showMDF: e.target.checked })} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>FE%</Box>
          <Switch size="small" checked={calcVisibility.showFE} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcVisibility({ showFE: e.target.checked })} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>GEO</Box>
          <Switch size="small" checked={calcVisibility.showGEO} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcVisibility({ showGEO: e.target.checked })} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>RNG</Box>
          <Switch size="small" checked={calcVisibility.showRNG} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalcVisibility({ showRNG: e.target.checked })} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ fontSize: 18 }} />
            Learning (Leaks)
          </Box>
          <Switch size="small" checked={learningVisible} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLearningVisible(e.target.checked)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
      </Menu>
      <input ref={backupFileInputRef} type="file" accept=".json" hidden onChange={handleRestoreFileChange} />
    </>
  );

  const leftSidebar = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 1 : 1.5,
        flexShrink: 1,
        minWidth: horizontal ? (compact ? 260 : 320) : undefined,
        width: horizontal ? (compact ? 480 : 520) : undefined,
        maxWidth: horizontal ? '100%' : undefined,
        alignSelf: 'flex-start',
        position: horizontal ? 'sticky' : undefined,
        top: horizontal ? (compact ? 1 : 2) : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'nowrap', minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <Box sx={{ width: 200, flexShrink: 0 }}>
          <SearchBar
            players={players}
            onSelect={handleSelectPlayer}
            onNoMatchCreate={(username) => {
              setAddInitialUsername(username);
              setAddOpen(true);
            }}
            selectedId={selected?._id}
          />
        </Box>
        {calcVisibility.showMDF && <MDFPanel compact={compact} />}
        {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
        {calcVisibility.showGEO && <GeoPanel compact={compact} />}
        {calcVisibility.showRNG && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleRngClick}
            aria-label="Random number 1-100"
            sx={{
              minWidth: 44,
              px: 1,
              ...(getRngButtonBgColor(rngValue) && {
                backgroundColor: getRngButtonBgColor(rngValue),
                '&:hover': { backgroundColor: getRngButtonBgColor(rngValue) },
              }),
            }}
          >
            {rngValue ?? 'RNG'}
          </Button>
        )}
        <IconButton
          size="small"
          onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
          aria-label="Settings"
          aria-controls={settingsOpen ? 'settings-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={settingsOpen ? 'true' : undefined}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>
      {!selected && (
        <>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
            >
              Add Player
            </Button>
            <Button
              variant={showHandsToReview ? 'contained' : 'outlined'}
              size="small"
              startIcon={<RateReviewIcon />}
              onClick={() => {
                setShowHandsToReview(!showHandsToReview);
                setShowLearning(false);
              }}
            >
              Hands to Review
            </Button>
            {learningVisible && (
              <Button
                variant={showLearning ? 'contained' : 'outlined'}
                size="small"
                startIcon={<SchoolIcon />}
                onClick={() => {
                  setShowLearning(!showLearning);
                  setShowHandsToReview(false);
                }}
              >
                Learning
              </Button>
            )}
          </Box>
          {recentPlayers.length > 0 && (
            <Paper variant="outlined" sx={{ p: compact ? 0.5 : 1, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: compact ? 0.5 : 1, fontWeight: 600, fontSize: compact ? '0.65rem' : undefined }}>
                Recent players
              </Typography>
              <List dense disablePadding>
                {recentPlayers.map((p: PlayerListItem) => (
                  <ListItemButton
                    key={p._id}
                    onClick={() => handleSelectPlayer(p)}
                    selected={false}
                    sx={{
                      borderRadius: 0.5,
                      py: compact ? 0.2 : 0.5,
                      minHeight: compact ? 28 : undefined,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant={compact ? 'caption' : 'body2'} sx={{ mr: 0.5, fontSize: compact ? '0.7rem' : undefined }}>
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
                      <Typography variant="caption" color="text.secondary" sx={compact ? { fontSize: '0.6rem' } : undefined}>
                        {new Date(p.updatedAt ?? p.createdAt ?? '').toLocaleDateString()}
                      </Typography>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        width: '100%',
        maxWidth: horizontal ? 'none' : 900,
        margin: '0 auto',
        overflowX: 'hidden',
      }}
    >
      {menuAndInput}
      <Box
        sx={{
          maxWidth: horizontal ? 'none' : 900,
          width: '100%',
          margin: '0 auto',
          px: compact ? 1 : 2,
          pt: compact ? 1 : 2,
          pb: compact ? 1 : 2,
          display: horizontal ? 'flex' : 'block',
          flexDirection: horizontal ? 'row' : undefined,
          gap: horizontal ? 2 : undefined,
          alignItems: horizontal ? 'flex-start' : undefined,
        }}
      >
        {horizontal && !selected && leftSidebar}
        <Box sx={{ flex: horizontal ? 1 : undefined, minWidth: horizontal ? 0 : undefined, display: 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
          {!horizontal && (
            <Box sx={{ mb: compact ? 1 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5, flexWrap: 'nowrap', overflowX: 'auto', minWidth: 0 }}>
                <Box sx={{ width: 200, flexShrink: 0 }}>
                  <SearchBar
                    players={players}
                    onSelect={handleSelectPlayer}
                    onNoMatchCreate={(username) => {
                      setAddInitialUsername(username);
                      setAddOpen(true);
                    }}
                    selectedId={selected?._id}
                  />
                </Box>
                {calcVisibility.showMDF && <MDFPanel compact={compact} />}
                {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
                {calcVisibility.showGEO && <GeoPanel compact={compact} />}
                {calcVisibility.showRNG && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRngClick}
                    aria-label="Random number 1-100"
                    sx={{
                      minWidth: 44,
                      px: 1,
                      ...(getRngButtonBgColor(rngValue) && {
                        backgroundColor: getRngButtonBgColor(rngValue),
                        '&:hover': { backgroundColor: getRngButtonBgColor(rngValue) },
                      }),
                    }}
                  >
                    {rngValue ?? 'RNG'}
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                  aria-label="Settings"
                  aria-controls={settingsOpen ? 'settings-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={settingsOpen ? 'true' : undefined}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
            >
              Add Player
            </Button>
            <Button
              variant={showHandsToReview ? 'contained' : 'outlined'}
              size="small"
              startIcon={<RateReviewIcon />}
              onClick={() => {
                setShowHandsToReview(!showHandsToReview);
                setShowLearning(false);
              }}
            >
              Hands to Review
            </Button>
            {learningVisible && (
              <Button
                variant={showLearning ? 'contained' : 'outlined'}
                size="small"
                startIcon={<SchoolIcon />}
                onClick={() => {
                  setShowLearning(!showLearning);
                  setShowHandsToReview(false);
                }}
              >
                Learning
              </Button>
            )}
          </Box>
        </Box>
        )}

        {learningVisible && showLearning ? (
          <Box>
            <Button
              variant="text"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowLearning(false)}
              sx={{ mb: 1 }}
            >
              {selected ? `Back to ${selected.username}` : 'Back to Players'}
            </Button>
            <ErrorBoundary>
              <LearningPage
                onBack={() => setShowLearning(false)}
                onSuccess={showSuccess}
                onError={showError}
              />
            </ErrorBoundary>
          </Box>
        ) : showHandsToReview ? (
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
          <Box sx={{ py: compact ? 2 : 4, textAlign: 'center', color: 'text.secondary' }}>
            Loading...
          </Box>
        ) : selected ? (
          <>
            {horizontal && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexShrink: 0, flexWrap: 'nowrap', overflowX: 'auto', minWidth: 0 }}>
                <Box sx={{ width: 200, flexShrink: 0 }}>
                  <SearchBar
                    players={players}
                    onSelect={handleSelectPlayer}
                    onNoMatchCreate={(username) => {
                      setAddInitialUsername(username);
                      setAddOpen(true);
                    }}
                    selectedId={selected?._id}
                  />
                </Box>
                {calcVisibility.showMDF && <MDFPanel compact={compact} />}
                {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
                {calcVisibility.showGEO && <GeoPanel compact={compact} />}
                {calcVisibility.showRNG && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRngClick}
                    aria-label="Random number 1-100"
                    sx={{
                      minWidth: 44,
                      px: 1,
                      ...(getRngButtonBgColor(rngValue) && {
                        backgroundColor: getRngButtonBgColor(rngValue),
                        '&:hover': { backgroundColor: getRngButtonBgColor(rngValue) },
                      }),
                    }}
                  >
                    {rngValue ?? 'RNG'}
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                  aria-label="Settings"
                  aria-controls={settingsOpen ? 'settings-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={settingsOpen ? 'true' : undefined}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                flexDirection: horizontal ? 'column' : 'row',
                alignItems: horizontal ? 'stretch' : 'flex-start',
                gap: horizontal ? 1 : compact ? 0 : 0,
                flex: horizontal ? 1 : undefined,
                minHeight: horizontal ? 0 : undefined,
              }}
            >
            <ErrorBoundary>
              <Box
                sx={{
                  flex: horizontal ? undefined : compact ? '0 0 280px' : '0 0 400px',
                  maxWidth: horizontal ? '100%' : compact ? 280 : 400,
                  width: horizontal ? '100%' : undefined,
                }}
              >
                <PlayerCard
                  player={selected}
                  players={players}
                  onUpdate={handleUpdatePlayer}
                  onDelete={handleDeletePlayer}
                  onMergeClick={() => setMergeDialogOpen(true)}
                  onClose={() => setSelected(null)}
                  horizontal={horizontal}
                />
              </Box>
            </ErrorBoundary>
            <Box sx={{ flex: horizontal ? undefined : 1, minWidth: horizontal ? undefined : 0 }}>
              <HandHistoryPanel
                handHistories={selected.handHistories ?? []}
                onUpdateHandHistories={async (handHistories) =>
                  handleUpdatePlayer(selected._id, { handHistories })
                }
                horizontal={horizontal}
              />
            </Box>
          </Box>
          </>
        ) : !horizontal ? (
          <Box>
            <Typography variant={compact ? 'caption' : 'body2'} color="text.secondary" sx={{ mb: compact ? 0.5 : 1 }}>
              Search for a player or add a new one.
            </Typography>
            {recentPlayers.length > 0 && (
              <Paper variant="outlined" sx={{ p: compact ? 0.5 : 1, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: compact ? 0.5 : 1, fontWeight: 600, fontSize: compact ? '0.65rem' : undefined }}>
                  Recent players
                </Typography>
                <List dense disablePadding>
                  {recentPlayers.map((p: PlayerListItem) => (
                    <ListItemButton
                      key={p._id}
                      onClick={() => handleSelectPlayer(p)}
                      sx={{
                        borderRadius: 0.5,
                        py: compact ? 0.2 : 0.5,
                        minHeight: compact ? 28 : undefined,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant={compact ? 'caption' : 'body2'} sx={{ mr: 0.5, fontSize: compact ? '0.7rem' : undefined }}>
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
                        <Typography variant="caption" color="text.secondary" sx={compact ? { fontSize: '0.6rem' } : undefined}>
                          {new Date(p.updatedAt ?? p.createdAt ?? '').toLocaleDateString()}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        ) : null}
        </Box>
      </Box>

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

      <ChangeNameDialog
        open={changeNameOpen}
        onClose={() => setChangeNameOpen(false)}
        onSuccess={showSuccess}
      />

      <ImprovementNotesDialog
        open={improvementNotesOpen}
        onClose={() => setImprovementNotesOpen(false)}
        onOpenChangeName={() => {
          setImprovementNotesOpen(false);
          setChangeNameOpen(true);
        }}
        onSuccess={showSuccess}
        onError={showError}
      />

      <DefaultStakesDialog
        open={defaultStakesDialogOpen}
        onClose={() => setDefaultStakesDialogOpen(false)}
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
