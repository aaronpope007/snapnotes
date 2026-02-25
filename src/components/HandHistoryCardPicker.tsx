import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { CardImage } from './CardImage';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const SUITS = ['s', 'h', 'd', 'c'] as const;
const ALL_CARDS = RANKS.flatMap((r) => SUITS.map((s) => ({ rank: r, suit: s })));
const PSB_PERCENTS = [10, 25, 33, 50, 70, 75, 100, 120] as const;

export interface HandHistoryCardPickerProps {
  onInsertCard: (shorthand: string) => void;
  onInsertText: (text: string) => void;
}

export function HandHistoryCardPicker({ onInsertCard, onInsertText }: HandHistoryCardPickerProps) {
  const [customPsbPercent, setCustomPsbPercent] = useState<string>('');

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.25,
          mt: 1,
        }}
      >
        {ALL_CARDS.map(({ rank, suit }) => (
          <Box
            key={`${rank}${suit}`}
            component="button"
            type="button"
            onClick={() => onInsertCard(`${rank.toLowerCase()}${suit}`)}
            sx={{
              display: 'inline-flex',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              background: 'none',
              borderRadius: 0.5,
              '&:hover': { bgcolor: 'action.hover' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
            }}
            aria-label={`Insert ${rank} of ${suit}`}
          >
            <CardImage rank={rank} suit={suit} size="xs" />
          </Box>
        ))}
        <Box
          component="button"
          type="button"
          onClick={() => onInsertCard('x')}
          sx={{
            display: 'inline-flex',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            background: 'none',
            borderRadius: 0.5,
            '&:hover': { bgcolor: 'action.hover' },
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
          }}
          aria-label="Insert unknown card"
        >
          <CardImage rank="?" suit={null} size="xs" />
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.5,
          mt: 1,
        }}
      >
        {PSB_PERCENTS.map((pct) => (
          <Button
            key={pct}
            size="small"
            variant="outlined"
            onClick={() => onInsertText(`${pct}% PSB`)}
            sx={{ minWidth: 0, px: 1 }}
            aria-label={`Insert ${pct}% PSB`}
          >
            b{pct}
          </Button>
        ))}
        <TextField
          size="small"
          placeholder="%"
          type="number"
          value={customPsbPercent}
          onChange={(e) =>
            setCustomPsbPercent(e.target.value.replace(/\D/g, '').slice(0, 3))
          }
          inputProps={{ min: 0, max: 999, 'aria-label': 'Custom PSB percentage' }}
          sx={{
            width: 56,
            '& .MuiInputBase-input': {
              py: 0.5,
              fontSize: '0.8rem',
              MozAppearance: 'textfield',
              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            },
          }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            const num = customPsbPercent.trim();
            if (num) onInsertText(`${num}% PSB`);
          }}
          disabled={!customPsbPercent.trim()}
          sx={{ minWidth: 0, px: 1 }}
          aria-label="Insert custom % PSB"
        >
          bx
        </Button>
      </Box>
    </>
  );
}
