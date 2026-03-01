import { useState, useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import type { PlayerListItem } from '../types';

function filterPlayers(opts: PlayerListItem[], inputValue: string): PlayerListItem[] {
  if (!inputValue.trim()) return [];
  const lower = inputValue.toLowerCase();
  return opts.filter((p) => p.username.toLowerCase().includes(lower)).slice(0, 15);
}

interface SearchBarProps {
  players: PlayerListItem[];
  onSelect: (player: PlayerListItem) => void;
  onNoMatchCreate?: (username: string) => void;
  selectedId?: string | null;
}

export function SearchBar({ players, onSelect, onNoMatchCreate }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [highlightedOption, setHighlightedOption] = useState<PlayerListItem | null>(null);

  const handleChange = useCallback(
    (_: React.SyntheticEvent, value: PlayerListItem | string | null) => {
      if (typeof value === 'string') {
        if (value.trim() && onNoMatchCreate) onNoMatchCreate(value.trim());
      } else if (value) {
        onSelect(value);
      }
      setInputValue('');
      setHighlightedOption(null);
    },
    [onSelect, onNoMatchCreate]
  );

  const filtered = filterPlayers(players, inputValue);

  const selectPlayer = useCallback(
    (player: PlayerListItem) => {
      onSelect(player);
      setInputValue('');
      setHighlightedOption(null);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        const toSelect = highlightedOption ?? (filtered.length === 1 ? filtered[0] : null);
        if (toSelect) {
          e.preventDefault();
          selectPlayer(toSelect);
        }
      } else if (e.key === 'Enter') {
        const toSelect = highlightedOption ?? (filtered.length === 1 ? filtered[0] : null);
        if (toSelect) {
          e.preventDefault();
          selectPlayer(toSelect);
        }
      }
    },
    [filtered, highlightedOption, selectPlayer]
  );

  return (
    <Autocomplete
      options={players}
      getOptionLabel={(p) => (typeof p === 'string' ? p : p.username)}
      inputValue={inputValue}
      onInputChange={(_, v) => setInputValue(v)}
      onChange={handleChange}
      onHighlightChange={(_, option) => setHighlightedOption(option)}
      freeSolo={!!onNoMatchCreate}
      autoHighlight
      size="small"
      forcePopupIcon={false}
      filterOptions={(opts, { inputValue: q }) => filterPlayers(opts, q)}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search players..."
          onKeyDown={handleKeyDown}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
