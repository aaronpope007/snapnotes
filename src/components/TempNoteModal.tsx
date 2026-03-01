import { useState } from 'react';
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
import type { PlayerListItem } from '../types';

interface TempNoteModalProps {
  open: boolean;
  onClose: () => void;
  players: PlayerListItem[];
  userName: string | null;
  onCopySuccess?: () => void;
  onCopyError?: (msg: string) => void;
  onAppendToPlayer?: (playerId: string, noteText: string) => Promise<void>;
}

export function TempNoteModal({
  open,
  onClose,
  players,
  userName,
  onCopySuccess,
  onCopyError,
  onAppendToPlayer,
}: TempNoteModalProps) {
  const [text, setText] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerListItem | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [appending, setAppending] = useState(false);

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
  };

  const handleAppendToPlayerClick = async () => {
    if (!selectedPlayer || !text.trim() || !onAppendToPlayer) return;
    setAppending(true);
    try {
      await onAppendToPlayer(selectedPlayer._id, text.trim());
      setText('');
      setSelectedPlayer(null);
      setPlayerSearch('');
    } finally {
      setAppending(false);
    }
  };

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
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                filterOptions={(opts, { inputValue }) => filterPlayers(opts, inputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search player..."
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        const filtered = filterPlayers(players, playerSearch);
                        if (filtered.length === 1) {
                          e.preventDefault();
                          setSelectedPlayer(filtered[0]);
                          setPlayerSearch(filtered[0].username);
                        }
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
                disabled={!selectedPlayer || !text.trim() || appending}
                sx={{ flexShrink: 0 }}
              >
                {appending ? 'Appending...' : 'Append'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} disabled={!text.trim()}>
          Clear
        </Button>
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
