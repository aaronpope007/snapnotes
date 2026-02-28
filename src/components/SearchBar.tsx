import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import type { PlayerListItem } from '../types';

interface SearchBarProps {
  players: PlayerListItem[];
  onSelect: (player: PlayerListItem) => void;
  onNoMatchCreate?: (username: string) => void;
  selectedId?: string | null;
}

export function SearchBar({ players, onSelect, onNoMatchCreate }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (_: React.SyntheticEvent, value: PlayerListItem | string | null) => {
    if (typeof value === 'string') {
      if (value.trim() && onNoMatchCreate) onNoMatchCreate(value.trim());
    } else if (value) {
      onSelect(value);
    }
    setInputValue('');
  };

  return (
    <Autocomplete
      options={players}
      getOptionLabel={(p) => (typeof p === 'string' ? p : p.username)}
      inputValue={inputValue}
      onInputChange={(_, v) => setInputValue(v)}
      onChange={handleChange}
      freeSolo={!!onNoMatchCreate}
      size="small"
      forcePopupIcon={false}
      filterOptions={(opts, { inputValue: q }) => {
        if (!q.trim()) return [];
        const lower = q.toLowerCase();
        return opts.filter((p) => p.username.toLowerCase().includes(lower)).slice(0, 15);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search players..."
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
