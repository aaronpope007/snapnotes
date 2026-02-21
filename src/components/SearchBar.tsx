import { useState, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import type { Player } from '../types';

interface SearchBarProps {
  players: Player[];
  onSelect: (player: Player) => void;
  selectedId?: string | null;
}

export function SearchBar({ players, onSelect, selectedId }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players.filter((p) => p.username.toLowerCase().includes(q));
  }, [players, query]);

  const handleSelect = (p: Player) => {
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
