import { useState, useCallback, useMemo } from 'react';
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
  inputRef?: React.Ref<HTMLInputElement>;
}

export function SearchBar({ players, onSelect, onNoMatchCreate, inputRef }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [highlightedOption, setHighlightedOption] = useState<PlayerListItem | null>(null);

  const exactMatch = useMemo(() => {
    const v = inputValue.trim().toLowerCase();
    if (!v) return null;
    return players.find((p) => p.username.toLowerCase() === v) ?? null;
  }, [players, inputValue]);

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

  const filtered = useMemo(
    () => filterPlayers(players, inputValue),
    [players, inputValue]
  );

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
        // When "freeSolo" is enabled, Enter should create unless the input is an exact match.
        if (onNoMatchCreate) {
          const v = inputValue.trim();
          if (!v) return;
          if (exactMatch) {
            e.preventDefault();
            e.stopPropagation();
            selectPlayer(exactMatch);
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          void onNoMatchCreate(v);
          setInputValue('');
          setHighlightedOption(null);
          return;
        }

        // Default behavior when we aren't creating new players.
        const toSelect = highlightedOption ?? (filtered.length === 1 ? filtered[0] : null);
        if (toSelect) {
          e.preventDefault();
          e.stopPropagation();
          selectPlayer(toSelect);
        }
      }
    },
    [exactMatch, filtered, highlightedOption, inputValue, onNoMatchCreate, selectPlayer]
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
      filterOptions={() => filtered}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search players..."
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
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
