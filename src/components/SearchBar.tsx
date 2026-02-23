import { useState, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import type { PlayerListItem } from '../types';

interface SearchBarProps {
  players: PlayerListItem[];
  onSelect: (player: PlayerListItem) => void;
  onNoMatchCreate?: (username: string) => void;
  selectedId?: string | null;
}

export function SearchBar({ players, onSelect, onNoMatchCreate, selectedId }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players.filter((p) => p.username.toLowerCase().includes(q));
  }, [players, query]);

  const handleSelect = (p: PlayerListItem) => {
    onSelect(p);
    setQuery('');
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search players..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab' || e.key === 'Enter') {
            if (filtered.length === 1) {
              e.preventDefault();
              handleSelect(filtered[0]);
            } else if (filtered.length === 0 && query.trim() && onNoMatchCreate) {
              e.preventDefault();
              onNoMatchCreate(query.trim());
              setQuery('');
              setOpen(false);
            }
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      {open && filtered.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            maxHeight: 200,
            overflow: 'auto',
            mt: 0.5,
          }}
        >
          <List dense disablePadding>
            {filtered.slice(0, 15).map((p) => (
              <ListItemButton
                key={p._id}
                selected={p._id === selectedId}
                onClick={() => handleSelect(p)}
              >
                {p.username}
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}
