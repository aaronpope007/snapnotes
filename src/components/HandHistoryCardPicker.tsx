import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { CardImage } from './CardImage';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const SUITS = ['s', 'h', 'd', 'c'] as const;
const PSB_PERCENTS = [25, 50, 75, 100] as const;

function CardButton({
  rank,
  suit,
  used,
  onInsert,
  onRemove,
  ariaLabel,
}: {
  rank: string;
  suit: string | null;
  used: boolean;
  onInsert: () => void;
  onRemove?: () => void;
  ariaLabel: string;
}) {
  const canRemove = used && onRemove !== undefined;
  const handleClick = () => {
    if (canRemove) onRemove!();
    else if (!used) onInsert();
  };
  return (
    <Box
      component="button"
      type="button"
      disabled={used && !canRemove}
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: canRemove ? 'pointer' : used ? 'default' : 'pointer',
        background: 'none',
        borderRadius: 0.5,
        opacity: used ? 0.4 : 1,
        '&:hover': canRemove ? { bgcolor: 'action.hover' } : used ? {} : { bgcolor: 'action.hover' },
        '&:focus-visible': used && !canRemove ? {} : { outline: '2px solid', outlineColor: 'primary.main' },
      }}
      aria-label={ariaLabel}
    >
      <CardImage rank={rank} suit={suit} size="xxs" />
    </Box>
  );
}

export interface HandHistoryCardPickerProps {
  onInsertCard: (shorthand: string) => void;
  onInsertText: (text: string) => void;
  /** Card shorthands already used in the content (e.g. from backticks). Clicking a used card removes one instance. */
  usedShorthands?: Set<string>;
  /** When provided, clicking a used card removes one instance from content instead of being disabled. */
  onRemoveCard?: (shorthand: string) => void;
}

export function HandHistoryCardPicker({
  onInsertCard,
  onInsertText,
  usedShorthands,
  onRemoveCard,
}: HandHistoryCardPickerProps) {
  const [customPsbPercent, setCustomPsbPercent] = useState<string>('');

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: 220,
        maxHeight: '60vh',
        overflowY: 'auto',
        pl: 1,
        borderLeft: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {RANKS.map((rank) => (
          <Box key={rank} sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.25 }}>
            {SUITS.map((suit) => {
              const shorthand = `${rank.toLowerCase()}${suit}`;
              const used = usedShorthands?.has(shorthand) ?? false;
              const suitName = suit === 's' ? 'spades' : suit === 'h' ? 'hearts' : suit === 'd' ? 'diamonds' : 'clubs';
              return (
                <CardButton
                  key={shorthand}
                  rank={rank}
                  suit={suit}
                  used={used}
                  onInsert={() => onInsertCard(shorthand)}
                  onRemove={onRemoveCard ? () => onRemoveCard(shorthand) : undefined}
                  ariaLabel={
                    used
                      ? onRemoveCard
                        ? `Remove ${rank} of ${suitName} from content`
                        : `${rank} of ${suitName} (already used)`
                      : `Insert ${rank} of ${suitName}`
                  }
                />
              );
            })}
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <CardButton
            rank="?"
            suit={null}
            used={usedShorthands?.has('x') ?? false}
            onInsert={() => onInsertCard('x')}
            onRemove={onRemoveCard ? () => onRemoveCard('x') : undefined}
            ariaLabel={
              usedShorthands?.has('x')
                ? onRemoveCard
                  ? 'Remove unknown card from content'
                  : 'Unknown card (already used)'
                : 'Insert unknown card'
            }
          />
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
        <Button
          size="small"
          variant="outlined"
          onClick={() => onInsertText('overbet pot')}
          sx={{ minWidth: 0, px: 1 }}
          aria-label="Insert overbet pot"
        >
          overbet
        </Button>
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
    </Box>
  );
}
