import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
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
import EditIcon from '@mui/icons-material/Edit';
import EditNoteIcon from '@mui/icons-material/EditNote';
import TuneIcon from '@mui/icons-material/Tune';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SearchBar } from './components/SearchBar';
import { PlayerCard } from './components/PlayerCard';
import { HandHistoryPanel } from './components/HandHistoryPanel';
import { HandsToReviewView } from './components/HandsToReviewView';
import { LearningPage } from './pages/LearningPage';
import { ResultsPage } from './pages/ResultsPage';
import { fetchSessionResults } from './api/results';
import { AddPlayerModal } from './components/AddPlayerModal';
import { ImportModal } from './components/ImportModal';
import { MergePlayerDialog } from './components/MergePlayerDialog';
import { RestoreBackupConfirmDialog } from './components/RestoreBackupConfirmDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useConfirm } from './hooks/useConfirm';
import { ChangeNameDialog } from './components/ChangeNameDialog';
import { ImprovementNotesDialog } from './components/ImprovementNotesDialog';
import { DefaultStakesDialog } from './components/DefaultStakesDialog';
import { MDFPanel } from './components/MDFPanel';
import { FoldEquityPanel } from './components/FoldEquityPanel';
import { GeoPanel } from './components/GeoPanel';
import { RngButton } from './components/RngButton';
import { BetClipboardPopover } from './components/BetClipboardPopover';
import { TopNotificationBar } from './components/TopNotificationBar';
import { TempNoteModal } from './components/TempNoteModal';
import { useCompactMode, useSetCompactMode } from './context/CompactModeContext';
import { useHorizontalMode, useSetHorizontalMode } from './context/HorizontalModeContext';
import { useCalculatorVisibility, useSetCalculatorVisibility } from './context/CalculatorVisibilityContext';
import { useLearningVisibility, useSetLearningVisibility } from './context/LearningVisibilityContext';
import { useResultsVisibility, useSetResultsVisibility } from './context/ResultsVisibilityContext';
import { useLeaksVisibility, useSetLeaksVisibility } from './context/LeaksVisibilityContext';
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
import { createHandToReview, fetchHandsToReview } from './api/handsToReview';
import { fetchReviewers } from './api/reviewers';
import { getApiErrorMessage } from './utils/apiError';
import { toNoteOneLiner } from './utils/noteUtils';
import { getPlayerTypeColor, getPlayerTypeLabel } from './constants/playerTypes';
import {
  getActiveSession,
  setActiveSession,
  clearActiveSession,
  pauseActiveSession,
  resumeActiveSession,
  type ActiveSession,
} from './utils/activeSession';
import { getMostRecentSession } from './utils/sessionUtils';
import { SessionDurationLabel } from './components/SessionDurationLabel';
import type { Player, PlayerListItem, PlayerCreate, ImportPlayer, NoteEntry } from './types';

/** Fixed height for Add Player / Hands to Review / Learning / Results nav buttons. Do not change. */
const NAV_BUTTON_HEIGHT = 38;

export default function App() {
  const compact = useCompactMode();
  const setCompact = useSetCompactMode();
  const horizontal = useHorizontalMode();
  const setHorizontal = useSetHorizontalMode();
  const calcVisibility = useCalculatorVisibility();
  const setCalcVisibility = useSetCalculatorVisibility();
  const learningVisible = useLearningVisibility();
  const setLearningVisible = useSetLearningVisibility();
  const resultsVisible = useResultsVisibility();
  const setResultsVisible = useSetResultsVisibility();
  const leaksVisible = useLeaksVisibility();
  const setLeaksVisible = useSetLeaksVisibility();

  useEffect(() => {
    if (!learningVisible) setShowLearning(false);
  }, [learningVisible]);
  useEffect(() => {
    if (!resultsVisible) setShowResults(false);
  }, [resultsVisible]);
  const darkMode = useDarkMode();
  const setDarkMode = useSetDarkMode();
  const { getAuthHeader, userName } = useUserCredentials();
  const [activeSessionTick, setActiveSessionTick] = useState(0);
  const activeSession = useMemo(() => getActiveSession(), [activeSessionTick]);
  const showSessionInProgress = !!activeSession && activeSession.userId === userName?.trim();
  const [resetSessionTrigger, setResetSessionTrigger] = useState(0);
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialUsername, setAddInitialUsername] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);
  const [showHandsToReview, setShowHandsToReview] = useState(false);
  const [initialHandId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('hand') ?? null;
  });
  const [showLearning, setShowLearning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [requestOpenEndSessionModal, setRequestOpenEndSessionModal] = useState(false);
  const [requestOpenEditSessionModal, setRequestOpenEditSessionModal] = useState(false);
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
  const [tempNoteOpen, setTempNoteOpen] = useState(false);
  const [reviewersList, setReviewersList] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [handsToReviewLoadToast, setHandsToReviewLoadToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [myRecent, setMyRecent] = useState(() => {
    try { return localStorage.getItem('snapnotes_my_recent') === 'true'; } catch { return false; }
  });
  const [myRecentPlayers, setMyRecentPlayers] = useState<PlayerListItem[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('snapnotes_recently_viewed_ids');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch { return []; }
  });
  const searchBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem('snapnotes_my_recent', String(myRecent)); } catch { /* ignore */ }
  }, [myRecent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !e.metaKey && !e.ctrlKey && !e.altKey
      ) {
        e.preventDefault();
        searchBarRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const showSuccess = useCallback((msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success' }), []);
  const showError = useCallback((msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error' }), []);

  const {
    confirmOpen: resetSessionConfirmOpen,
    openConfirm: openResetSessionConfirm,
    closeConfirm: closeResetSessionConfirm,
    handleConfirm: handleResetSessionConfirm,
    confirmOptions: resetSessionConfirmOptions,
  } = useConfirm();

  const [startingSession, setStartingSession] = useState(false);
  const handleStartSession = useCallback(async () => {
    if (!userName?.trim()) return;
    setStartingSession(true);
    try {
      const list = await fetchSessionResults(userName);
      const mostRecent = getMostRecentSession(list);
      const totalHands = list.reduce((sum, s) => sum + (s.hands ?? 0), 0);
      const lastHandsEndedAt = mostRecent?.handsEndedAt ?? (list.length > 0 ? totalHands : 0);
      const session: ActiveSession = {
        startTime: new Date().toISOString(),
        userId: userName.trim(),
        startHandNumber: lastHandsEndedAt,
        pauseIntervals: [],
        pauseStartedAt: null,
      };
      setActiveSession(session);
      setActiveSessionTick((t) => t + 1);
      setShowResults(true);
      showSuccess('Session started. Click End session when done.');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to load sessions'));
    } finally {
      setStartingSession(false);
    }
  }, [userName, showSuccess, showError]);

  const handleResetSession = useCallback(() => {
    clearActiveSession();
    setActiveSessionTick((t) => t + 1);
    setResetSessionTrigger((t) => t + 1);
    showSuccess('Session reset. You can start a new session when ready.');
  }, [showSuccess]);

  const handleToggleSessionPause = useCallback(() => {
    const s = getActiveSession();
    if (!s) return;
    const next: ActiveSession | null = s.pauseStartedAt ? resumeActiveSession(s) : pauseActiveSession(s);
    if (next) {
      setActiveSession(next);
      setActiveSessionTick((t) => t + 1);
    }
  }, []);

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
  }, [showError]);

  const loadMyRecentPlayers = useCallback(async () => {
    if (!myRecent || !userName?.trim()) {
      setMyRecentPlayers([]);
      return;
    }
    try {
      const data = await fetchPlayers({ touchedBy: userName });
      setMyRecentPlayers(Array.isArray(data) ? data : []);
    } catch {
      setMyRecentPlayers([]);
    }
  }, [myRecent, userName]);

  useEffect(() => {
    if (myRecent && userName?.trim()) void loadMyRecentPlayers();
  }, [loadMyRecentPlayers, myRecent, userName, players]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    let cancelled = false;
    fetchReviewers()
      .then((list) => {
        if (cancelled) return;
        setReviewersList(list);
      })
      .catch(() => {
        if (cancelled) return;
        setReviewersList([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userName?.trim()) return;
    let cancelled = false;
    fetchHandsToReview('open', userName)
      .then((hands) => {
        if (cancelled) return;
        const forMeCount = hands.filter(
          (h) =>
            (h.taggedReviewerNames ?? []).includes(userName) &&
            !(h.reviewedBy ?? []).includes(userName) &&
            h.status !== 'archived'
        ).length;
        const message =
          forMeCount === 0
            ? 'Hey, nice job, no hands to review'
            : forMeCount >= 5
              ? `Hey slacker, there are ${forMeCount} hands to review, get to it.`
              : `Hey pal, there are ${forMeCount} hand${forMeCount !== 1 ? 's' : ''} to review.`;
        setHandsToReviewLoadToast({
          open: true,
          message,
          severity: forMeCount === 0 ? 'success' : 'error',
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userName]);

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

  const handleSelectPlayer = useCallback(async (p: PlayerListItem) => {
    try {
      setShowHandsToReview(false);
      setShowLearning(false);
      setShowResults(false);
      const full = await fetchPlayer(p._id);
      setSelected(full);
      setRecentlyViewedIds((prev) => {
        const next = [p._id, ...prev.filter((id) => id !== p._id)].slice(0, 30);
        try { localStorage.setItem('snapnotes_recently_viewed_ids', JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to load player'));
    }
  }, [showError]);

  const handleAddHandFromTempNote = async (
    handText: string,
    title?: string,
    taggedReviewerNames?: string[]
  ) => {
    if (!userName?.trim()) {
      showError('Enter your name to add hands for review');
      return;
    }
    try {
      await createHandToReview({
        handText: handText.trim(),
        title: title?.trim() || undefined,
        taggedReviewerNames:
          taggedReviewerNames?.length ? taggedReviewerNames : undefined,
        createdBy: userName.trim(),
      });
      setTempNoteOpen(false);
      setShowHandsToReview(true);
      setShowLearning(false);
      setShowResults(false);
      setSelected(null);
      showSuccess('Hand added for review');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to add hand for review'));
      throw err;
    }
  };

  const handleAppendAndAddHandFromTempNote = async (
    playerId: string,
    noteText: string,
    title?: string,
    taggedReviewerNames?: string[]
  ) => {
    if (!userName?.trim()) {
      showError('Enter your name to append notes');
      return;
    }
    try {
      await handleAppendTempNoteToPlayer(playerId, noteText);
      await handleAddHandFromTempNote(noteText, title, taggedReviewerNames);
    } catch {
      // Errors shown by individual handlers
    }
  };

  const handleAppendTempNoteToPlayer = async (playerId: string, noteText: string) => {
    if (!userName?.trim()) {
      showError('Enter your name to append notes');
      return;
    }
    try {
      const full = await fetchPlayer(playerId);
      const currentNotes = full.notes ?? [];
      const newEntry: NoteEntry = {
        text: toNoteOneLiner(noteText),
        addedBy: userName.trim(),
        addedAt: new Date().toISOString(),
      };
      const updated = await updatePlayer(
        playerId,
        { notes: [...currentNotes, newEntry] },
        getAuthHeader()
      );
      setPlayers((prev) =>
        prev.map((p) => (p._id === playerId ? { ...p, updatedAt: updated.updatedAt } : p))
      );
      setTempNoteOpen(false);
      setShowHandsToReview(false);
      setShowLearning(false);
      setShowResults(false);
      setSelected(updated);
      showSuccess('Note appended to ' + full.username);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to append note'));
      throw err;
    }
  };

  const handleUpdatePlayer = useCallback(async (id: string, updates: Partial<Player>) => {
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
      setSelected((prev) => (prev?._id === id ? updated : prev));
      showSuccess('Player updated');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to update player'));
      throw new Error('Update failed');
    }
  }, [getAuthHeader, showSuccess, showError]);

  const handleDeletePlayer = useCallback(async (id: string) => {
    try {
      await deletePlayer(id);
      setPlayers((prev) => prev.filter((p) => p._id !== id));
      setSelected((prev) => (prev?._id === id ? null : prev));
      showSuccess('Player deleted');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to delete player'));
      throw new Error('Delete failed');
    }
  }, [showSuccess, showError]);

  const handleAddPlayer = useCallback(async (player: PlayerCreate) => {
    try {
      const created = await createPlayer(player, getAuthHeader());
      setPlayers((prev) =>
        [...prev, { _id: created._id, username: created.username, playerType: created.playerType, gameTypes: created.gameTypes ?? [], stakesSeenAt: created.stakesSeenAt ?? [], formats: created.formats ?? [], origin: created.origin ?? 'WPT Gold', leaks: created.leaks ?? [], updatedAt: created.updatedAt, createdAt: created.createdAt }].sort(
          (a, b) => a.username.localeCompare(b.username)
        )
      );
      setShowHandsToReview(false);
      setShowLearning(false);
      setShowResults(false);
      setSelected(created);
      setRecentlyViewedIds((prev) => {
        const next = [created._id, ...prev.filter((id) => id !== created._id)].slice(0, 30);
        try {
          localStorage.setItem('snapnotes_recently_viewed_ids', JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      showSuccess('Player added');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to add player'));
      throw new Error('Add failed');
    }
  }, [getAuthHeader, showSuccess, showError]);

  const handleImport = useCallback(async (toImport: ImportPlayer[]) => {
    try {
      const result = await importPlayers(toImport, getAuthHeader());
      await loadPlayers();
      showSuccess(`Imported: ${result.created} new, ${result.updated} updated`);
      return result;
    } catch (err) {
      showError(getApiErrorMessage(err, 'Import failed'));
      throw new Error('Import failed');
    }
  }, [getAuthHeader, loadPlayers, showSuccess, showError]);

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

  const handleConfirmRestore = useCallback(async () => {
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
  }, [restorePayload, loadPlayers, showSuccess, showError]);

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

  const handleMergeConfirm = useCallback(async (targetId: string) => {
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
  }, [selected, loadPlayers, showSuccess, showError]);

  const existingUsernames = useMemo(
    () => new Set(players.map((p) => p.username.toLowerCase())),
    [players]
  );

  const handleNoMatchCreate = useCallback((username: string) => {
    setAddInitialUsername(username);
    setAddOpen(true);
  }, []);

  const recentPlayers = useMemo(() => {
    if (myRecent) {
      return [...myRecentPlayers]
        .filter((p) => p.updatedAt ?? p.createdAt)
        .sort((a, b) => {
          const aTs = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
          const bTs = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
          return bTs - aTs;
        })
        .slice(0, 20);
    }
    // Show players in the order they were last opened in this app
    const viewed = recentlyViewedIds
      .map((id) => players.find((p) => p._id === id))
      .filter((p): p is PlayerListItem => p != null)
      .slice(0, 20);
    if (viewed.length > 0) return viewed;
    // Fallback: sort by updatedAt on first use (no viewed history yet)
    return [...players]
      .filter((p) => p.updatedAt ?? p.createdAt)
      .sort((a, b) => {
        const aTs = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const bTs = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return bTs - aTs;
      })
      .slice(0, 20);
  }, [myRecent, myRecentPlayers, players, recentlyViewedIds]);

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
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon sx={{ fontSize: 18 }} />
            Results
          </Box>
          <Switch size="small" checked={resultsVisible} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResultsVisible(e.target.checked)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </MenuItem>
        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Leaks (player tags)
          </Box>
          <Switch size="small" checked={leaksVisible} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLeaksVisible(e.target.checked)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
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
        flexShrink: showResults ? 0 : 1,
        flex: horizontal && showResults ? 1 : undefined,
        minWidth: horizontal ? (showResults ? 0 : (compact ? 260 : 320)) : undefined,
        width: horizontal && !showResults ? '100%' : undefined,
        maxWidth: horizontal ? '100%' : undefined,
        alignSelf: 'flex-start',
        position: horizontal && !showResults ? 'sticky' : undefined,
        top: horizontal && !showResults ? (compact ? 1 : 2) : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap', minWidth: 0, maxWidth: '100%', width: '100%', overflowX: 'auto' }}>
        <Box sx={{ width: 200, flexShrink: 0, minWidth: 0 }}>
          <SearchBar
            players={players}
            onSelect={handleSelectPlayer}
            onNoMatchCreate={handleNoMatchCreate}
            inputRef={searchBarRef}
            selectedId={selected?._id}
          />
        </Box>
        {calcVisibility.showMDF && <MDFPanel compact={compact} />}
        {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
        {calcVisibility.showGEO && <GeoPanel compact={compact} />}
        {calcVisibility.showRNG && <RngButton />}
        <IconButton
          size="medium"
          onClick={() => setTempNoteOpen(true)}
          aria-label="Temp note"
          title="Temp note (scratchpad, nothing saved)"
          sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
        >
          <NoteAddIcon />
        </IconButton>
        <BetClipboardPopover onSuccess={showSuccess} onError={showError} />
        {!showSessionInProgress && userName?.trim() && (
          <Button
            size="small"
            color="success"
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => void handleStartSession()}
            disabled={startingSession}
          >
            {startingSession ? 'Starting…' : 'Start session'}
          </Button>
        )}
        {showSessionInProgress && activeSession && (
          <>
            <Chip
              label={<SessionDurationLabel activeSession={activeSession} />}
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
              aria-label="Session in progress"
            />
            <Button
              size="small"
              variant="outlined"
              color={activeSession.pauseStartedAt ? 'success' : 'inherit'}
              startIcon={activeSession.pauseStartedAt ? <PlayArrowIcon /> : <PauseIcon />}
              onClick={handleToggleSessionPause}
              aria-label={activeSession.pauseStartedAt ? 'Resume session' : 'Pause session'}
            >
              {activeSession.pauseStartedAt ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="small"
              color="error"
              variant="contained"
              onClick={() => {
                setSelected(null);
                setShowHandsToReview(false);
                setShowLearning(false);
                setShowResults(true);
                setRequestOpenEndSessionModal(true);
              }}
            >
              End session
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                setSelected(null);
                setShowHandsToReview(false);
                setShowLearning(false);
                setShowResults(true);
                setRequestOpenEditSessionModal(true);
              }}
            >
              Edit session
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() =>
                openResetSessionConfirm(handleResetSession, {
                  title: 'Reset session?',
                  message:
                    'This will clear your current session without saving. You can start a new session when ready.',
                  confirmText: 'Reset session',
                  confirmDanger: true,
                })
              }
            >
              Reset session
            </Button>
          </>
        )}
        <IconButton
          size="medium"
          onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
          aria-label="Settings"
          aria-controls={settingsOpen ? 'settings-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={settingsOpen ? 'true' : undefined}
          sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
      {!selected && (
        <>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
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
                setShowResults(false);
              }}
              sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
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
                  setShowResults(false);
                }}
                sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Learning
              </Button>
            )}
            {resultsVisible && (
              <Button
                variant={showResults ? 'contained' : 'outlined'}
                size="small"
                startIcon={<BarChartIcon />}
                onClick={() => {
                  setShowResults(!showResults);
                  setShowHandsToReview(false);
                  setShowLearning(false);
                }}
                sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Results
              </Button>
            )}
          </Box>
          {showHandsToReview && (
            <>
              <Button
                variant="text"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => setShowHandsToReview(false)}
                sx={{ alignSelf: 'flex-start', mb: 0.5 }}
              >
                Back to players
              </Button>
              <ErrorBoundary>
                <HandsToReviewView
                  initialHandId={initialHandId}
                  onSuccess={showSuccess}
                  onError={showError}
                />
              </ErrorBoundary>
            </>
          )}
          {learningVisible && showLearning && (
            <>
              <Button
                variant="text"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => setShowLearning(false)}
                sx={{ alignSelf: 'flex-start', mb: 0.5 }}
              >
                Back to players
              </Button>
              <ErrorBoundary>
                <LearningPage
                  onSuccess={showSuccess}
                  onError={showError}
                />
              </ErrorBoundary>
            </>
          )}
          {resultsVisible && showResults && (
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <Button
                variant="text"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => setShowResults(false)}
                sx={{ alignSelf: 'flex-start', mb: 0.5, flexShrink: 0 }}
              >
                Back to players
              </Button>
              <ErrorBoundary>
                <ResultsPage
                  onSuccess={showSuccess}
                  onError={showError}
                  onActiveSessionChange={() => setActiveSessionTick((t) => t + 1)}
                  hasActiveSession={showSessionInProgress}
                  activeSessionForLabel={activeSession ?? null}
                  resetSessionTrigger={resetSessionTrigger}
                  requestOpenEndSessionModal={requestOpenEndSessionModal}
                  onClearRequestOpenEndSessionModal={() => setRequestOpenEndSessionModal(false)}
                  requestOpenEditSessionModal={requestOpenEditSessionModal}
                  onClearRequestOpenEditSessionModal={() => setRequestOpenEditSessionModal(false)}
                />
              </ErrorBoundary>
            </Box>
          )}
          {(!selected && (recentPlayers.length > 0 || myRecent)) && !showHandsToReview && !showLearning && !showResults && (
            <Paper variant="outlined" sx={{ p: compact ? 0.5 : 1, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0.5 : 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: compact ? '0.65rem' : undefined }}>
                  Recent players
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={myRecent}
                      onChange={(e) => setMyRecent(e.target.checked)}
                      disabled={!userName?.trim()}
                    />
                  }
                  label={<Typography variant="caption" color="text.secondary">My recent</Typography>}
                />
              </Box>
              {recentPlayers.length > 0 ? (
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
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {myRecent ? "No players you've edited or added yet." : 'No recent players.'}
                </Typography>
              )}
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
      <TopNotificationBar
        onReviewClick={() => {
          setShowHandsToReview(true);
          setShowLearning(false);
          setShowResults(false);
          setSelected(null);
        }}
      />
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
        <Box sx={{ flex: horizontal && !showResults ? 1 : (horizontal && showResults ? 0 : undefined), minWidth: horizontal ? 0 : undefined, display: horizontal && showResults ? 'none' : 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
          {!horizontal && (
            <Box sx={{ mb: compact ? 1 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, flexWrap: 'nowrap', minWidth: 0, maxWidth: '100%', width: '100%', overflowX: 'auto' }}>
                <Box sx={{ width: 200, flexShrink: 0, minWidth: 0 }}>
                  <SearchBar
                    players={players}
                    onSelect={handleSelectPlayer}
                    onNoMatchCreate={handleNoMatchCreate}
                    inputRef={searchBarRef}
                    selectedId={selected?._id}
                  />
                </Box>
                {calcVisibility.showMDF && <MDFPanel compact={compact} />}
                {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
                {calcVisibility.showGEO && <GeoPanel compact={compact} />}
                {calcVisibility.showRNG && <RngButton />}
                <IconButton
                  size="medium"
                  onClick={() => setTempNoteOpen(true)}
                  aria-label="Temp note"
                  title="Temp note (scratchpad, nothing saved)"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
                >
                  <NoteAddIcon />
                </IconButton>
                <BetClipboardPopover onSuccess={showSuccess} onError={showError} />
                {!showSessionInProgress && userName?.trim() && (
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => void handleStartSession()}
                    disabled={startingSession}
                  >
                    {startingSession ? 'Starting…' : 'Start session'}
                  </Button>
                )}
                {showSessionInProgress && activeSession && (
                  <>
                    <Chip
                      label={<SessionDurationLabel activeSession={activeSession} />}
                      size="small"
                      color="error"
                      sx={{ fontWeight: 600 }}
                      aria-label="Session in progress"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color={activeSession.pauseStartedAt ? 'success' : 'inherit'}
                      startIcon={activeSession.pauseStartedAt ? <PlayArrowIcon /> : <PauseIcon />}
                      onClick={handleToggleSessionPause}
                      aria-label={activeSession.pauseStartedAt ? 'Resume session' : 'Pause session'}
                    >
                      {activeSession.pauseStartedAt ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={() => {
                        setSelected(null);
                        setShowHandsToReview(false);
                        setShowLearning(false);
                        setShowResults(true);
                        setRequestOpenEndSessionModal(true);
                      }}
                    >
                      End session
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelected(null);
                        setShowHandsToReview(false);
                        setShowLearning(false);
                        setShowResults(true);
                        setRequestOpenEditSessionModal(true);
                      }}
                    >
                      Edit session
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() =>
                        openResetSessionConfirm(handleResetSession, {
                          title: 'Reset session?',
                          message:
                            'This will clear your current session without saving. You can start a new session when ready.',
                          confirmText: 'Reset session',
                          confirmDanger: true,
                        })
                      }
                    >
                      Reset session
                    </Button>
                  </>
                )}
                <IconButton
                  size="medium"
                  onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                  aria-label="Settings"
                  aria-controls={settingsOpen ? 'settings-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={settingsOpen ? 'true' : undefined}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
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
                setShowResults(false);
              }}
              sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
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
                  setShowResults(false);
                }}
                sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Learning
              </Button>
            )}
            {resultsVisible && (
              <Button
                variant={showResults ? 'contained' : 'outlined'}
                size="small"
                startIcon={<BarChartIcon />}
                onClick={() => {
                  setShowResults(!showResults);
                  setShowHandsToReview(false);
                  setShowLearning(false);
                }}
                sx={{ height: NAV_BUTTON_HEIGHT, minHeight: NAV_BUTTON_HEIGHT, maxHeight: NAV_BUTTON_HEIGHT, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Results
              </Button>
            )}
          </Box>
        </Box>
        )}

        {learningVisible && showLearning && !horizontal ? (
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
                onSuccess={showSuccess}
                onError={showError}
              />
            </ErrorBoundary>
          </Box>
        ) : learningVisible && showLearning && horizontal ? null : showHandsToReview && !horizontal ? (
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
                initialHandId={initialHandId}
                onSuccess={showSuccess}
                onError={showError}
              />
            </ErrorBoundary>
          </Box>
        ) : showHandsToReview && horizontal ? null : loading && !players.length ? (
          <Box sx={{ py: compact ? 2 : 4, textAlign: 'center', color: 'text.secondary' }}>
            Loading...
          </Box>
        ) : selected ? (
          <>
            {horizontal && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap', minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
                <Box sx={{ width: 200, flexShrink: 0, minWidth: 0 }}>
                  <SearchBar
                    players={players}
                    onSelect={handleSelectPlayer}
                    onNoMatchCreate={handleNoMatchCreate}
                    inputRef={searchBarRef}
                    selectedId={selected?._id}
                  />
                </Box>
                {calcVisibility.showMDF && <MDFPanel compact={compact} />}
                {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
                {calcVisibility.showGEO && <GeoPanel compact={compact} />}
                {calcVisibility.showRNG && <RngButton />}
                <IconButton
                  size="medium"
                  onClick={() => setTempNoteOpen(true)}
                  aria-label="Temp note"
                  title="Temp note (scratchpad, nothing saved)"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
                >
                  <NoteAddIcon />
                </IconButton>
                {!showSessionInProgress && userName?.trim() && (
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => void handleStartSession()}
                    disabled={startingSession}
                  >
                    {startingSession ? 'Starting…' : 'Start session'}
                  </Button>
                )}
                {showSessionInProgress && activeSession && (
                  <>
                    <Chip
                      label={<SessionDurationLabel activeSession={activeSession} />}
                      size="small"
                      color="error"
                      sx={{ fontWeight: 600 }}
                      aria-label="Session in progress"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color={activeSession.pauseStartedAt ? 'success' : 'inherit'}
                      startIcon={activeSession.pauseStartedAt ? <PlayArrowIcon /> : <PauseIcon />}
                      onClick={handleToggleSessionPause}
                      aria-label={activeSession.pauseStartedAt ? 'Resume session' : 'Pause session'}
                    >
                      {activeSession.pauseStartedAt ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={() => {
                        setSelected(null);
                        setShowHandsToReview(false);
                        setShowLearning(false);
                        setShowResults(true);
                        setRequestOpenEndSessionModal(true);
                      }}
                    >
                      End session
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelected(null);
                        setShowHandsToReview(false);
                        setShowLearning(false);
                        setShowResults(true);
                        setRequestOpenEditSessionModal(true);
                      }}
                    >
                      Edit session
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() =>
                        openResetSessionConfirm(handleResetSession, {
                          title: 'Reset session?',
                          message:
                            'This will clear your current session without saving. You can start a new session when ready.',
                          confirmText: 'Reset session',
                          confirmDanger: true,
                        })
                      }
                    >
                      Reset session
                    </Button>
                  </>
                )}
                <IconButton
                  size="medium"
                  onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                  aria-label="Settings"
                  aria-controls={settingsOpen ? 'settings-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={settingsOpen ? 'true' : undefined}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
                >
                  <SettingsIcon />
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
            {(recentPlayers.length > 0 || myRecent) && (
              <Paper variant="outlined" sx={{ p: compact ? 0.5 : 1, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0.5 : 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: compact ? '0.65rem' : undefined }}>
                    Recent players
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={myRecent}
                        onChange={(e) => setMyRecent(e.target.checked)}
                        disabled={!userName?.trim()}
                      />
                    }
                    label={<Typography variant="caption" color="text.secondary">My recent</Typography>}
                  />
                </Box>
                {recentPlayers.length > 0 ? (
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
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {myRecent ? "No players you've edited or added yet." : 'No recent players.'}
                  </Typography>
                )}
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

      <ConfirmDialog
        open={resetSessionConfirmOpen}
        onClose={closeResetSessionConfirm}
        onConfirm={handleResetSessionConfirm}
        {...resetSessionConfirmOptions}
      />

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

      <TempNoteModal
        open={tempNoteOpen}
        onClose={() => setTempNoteOpen(false)}
        players={players}
        userName={userName}
        onCopySuccess={() => showSuccess('Copied to clipboard')}
        onCopyError={showError}
        onAppendToPlayer={handleAppendTempNoteToPlayer}
        onAddHandForReview={handleAddHandFromTempNote}
        onAppendAndAddHand={handleAppendAndAddHandFromTempNote}
        reviewerOptions={reviewersList}
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
      <Snackbar
        open={handsToReviewLoadToast.open}
        autoHideDuration={4000}
        onClose={() => setHandsToReviewLoadToast((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ '& .MuiSnackbar-content': { minWidth: 480, py: 3 } }}
      >
        <Alert
          severity={handsToReviewLoadToast.severity}
          onClose={() => setHandsToReviewLoadToast((s) => ({ ...s, open: false }))}
          sx={{
            py: 3,
            px: 4,
            fontSize: '1.5rem',
            fontWeight: 700,
            '& .MuiAlert-message': { fontSize: '1.5rem', fontWeight: 700 },
            '& .MuiAlert-icon': { fontSize: 32 },
          }}
        >
          {handsToReviewLoadToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
