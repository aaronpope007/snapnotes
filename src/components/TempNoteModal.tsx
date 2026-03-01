import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RateReviewIcon from '@mui/icons-material/RateReview';
import type { PlayerListItem } from '../types';

interface TempNoteModalProps {
  open: boolean;
  onClose: () => void;
  players: PlayerListItem[];
  userName: string | null;
  onCopySuccess?: () => void;
  onCopyError?: (msg: string) => void;
  onAppendToPlayer?: (playerId: string, noteText: string) => Promise<void>;
  onAddHandForReview?: (handText: string, title?: string) => Promise<void>;
  onAppendAndAddHand?: (playerId: string, noteText: string, title?: string) => Promise<void>;
}

export function TempNoteModal({
  open,
  onClose,
  players,
  userName,
  onCopySuccess,
  onCopyError,
  onAppendToPlayer,
  onAddHandForReview,
  onAppendAndAddHand,
}: TempNoteModalProps) {
  const [text, setText] = useState('');
  const [handTitle, setHandTitle] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerListItem | null>(null);
  const [highlightedOption, setHighlightedOption] = useState<PlayerListItem | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [appending, setAppending] = useState(false);
  const [appendAndAddSaving, setAppendAndAddSaving] = useState(false);
  const [addHandSaving, setAddHandSaving] = useState(false);

  const filterPlayers = (opts: PlayerListItem[], inputValue: string) => {
    if (!inputValue.trim()) return [];
    const lower = inputValue.toLowerCase();
    return opts
      .filter((p) => p.username.toLowerCase().includes(lower))
      .slice(0, 15);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(text || '').then(
      () => onCopySuccess?.(),
      () => onCopyError?.('Failed to copy')
    );
  };

  const handleClear = () => {
    setText('');
    setHandTitle('');
  };

  const filteredPlayers = filterPlayers(players, playerSearch);
  const toSelect = highlightedOption ?? (filteredPlayers.length === 1 ? filteredPlayers[0] : null);

  const handleAppendToPlayerClick = useCallback(
    async (player?: PlayerListItem) => {
      const p = player ?? selectedPlayer;
      if (!p || !text.trim() || !onAppendToPlayer) return;
      setAppending(true);
      try {
        await onAppendToPlayer(p._id, text.trim());
        setText('');
        setSelectedPlayer(null);
        setPlayerSearch('');
      } finally {
        setAppending(false);
      }
    },
    [selectedPlayer, text, onAppendToPlayer]
  );

  const handleAddHandForReview = useCallback(async () => {
    if (!text.trim() || !onAddHandForReview) return;
    setAddHandSaving(true);
    try {
      await onAddHandForReview(text.trim(), handTitle.trim() || undefined);
      setText('');
      setHandTitle('');
    } finally {
      setAddHandSaving(false);
    }
  }, [text, handTitle, onAddHandForReview]);

  const handleAppendAndAddHand = useCallback(
    async (player?: PlayerListItem) => {
      const p = player ?? selectedPlayer;
      if (!p || !text.trim() || !onAppendAndAddHand) return;
      setAppendAndAddSaving(true);
      try {
        await onAppendAndAddHand(p._id, text.trim(), handTitle.trim() || undefined);
        setText('');
        setHandTitle('');
        setSelectedPlayer(null);
        setPlayerSearch('');
      } finally {
        setAppendAndAddSaving(false);
      }
    },
    [selectedPlayer, text, handTitle, onAppendAndAddHand]
  );

  const appendBusy = appending || appendAndAddSaving;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Temp note</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          minRows={8}
          maxRows={16}
          placeholder="Type notes here... Paste into player notes or hand history. Nothing is saved."
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          sx={{ mt: 0.5 }}
        />
        {(onAddHandForReview || onAppendAndAddHand) && userName && (
          <TextField
            fullWidth
            size="small"
            label="Hand title (optional)"
            placeholder="Title for hand for review"
            value={handTitle}
            onChange={(e) => setHandTitle(e.target.value)}
            sx={{ mt: 2 }}
          />
        )}
        {onAppendToPlayer && userName && (
          <Box sx={{ mt: 2 }}>
            <Box
              component="span"
              sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}
            >
              Append to player
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Autocomplete
                options={players}
                getOptionLabel={(p) => p.username}
                value={selectedPlayer}
                onChange={(_, v) => {
                  setSelectedPlayer(v);
                  setPlayerSearch(v?.username ?? '');
                }}
                inputValue={playerSearch}
                onInputChange={(_, v) => setPlayerSearch(v)}
                onHighlightChange={(_, option) => setHighlightedOption(option)}
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                filterOptions={(opts, { inputValue }) => filterPlayers(opts, inputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search player..."
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        if (toSelect) {
                          e.preventDefault();
                          setSelectedPlayer(toSelect);
                          setPlayerSearch(toSelect.username);
                        }
                      } else if (e.key === 'Enter' && toSelect && text.trim()) {
                        e.preventDefault();
                        void handleAppendToPlayerClick(toSelect);
                      }
                    }}
                  />
                )}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => void handleAppendToPlayerClick()}
                disabled={!selectedPlayer || !text.trim() || appendBusy}
                sx={{ flexShrink: 0 }}
              >
                {appending ? 'Appending...' : 'Append'}
              </Button>
              {onAppendAndAddHand && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RateReviewIcon />}
                  onClick={() => void handleAppendAndAddHand()}
                  disabled={!selectedPlayer || !text.trim() || appendBusy}
                  sx={{ flexShrink: 0 }}
                >
                  {appendAndAddSaving ? 'Appending & adding...' : 'Append & add hand'}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} disabled={!text.trim()}>
          Clear
        </Button>
        {onAddHandForReview && userName && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RateReviewIcon />}
            onClick={() => void handleAddHandForReview()}
            disabled={!text.trim() || addHandSaving}
          >
            {addHandSaving ? 'Adding...' : 'Add hand for review'}
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyAll}
        >
          Copy all
        </Button>
      </DialogActions>
    </Dialog>
  );
}
