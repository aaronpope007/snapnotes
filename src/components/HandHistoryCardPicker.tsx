import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import { CardImage } from './CardImage';
import { MDFPanel } from './MDFPanel';
import { FoldEquityPanel } from './FoldEquityPanel';
import { useCalculatorVisibility } from '../context/CalculatorVisibilityContext';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const SUITS = ['s', 'h', 'd', 'c'] as const;
const DEFAULT_BET_SIZES = [25, 50, 75, 100];

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
  /** Count of unknown-card (`x`) tokens in content. Used to show up to 4 ? cards as used. */
  usedUnknownCardCount?: number;
  /** When provided, clicking a used card removes one instance from content instead of being disabled. */
  onRemoveCard?: (shorthand: string) => void;
}

const UNKNOWN_CARD_SLOTS = 4;
const BET_SIZES_STORAGE_KEY = 'snapnotes.betSizes';

function loadBetSizes(): number[] {
  try {
    const raw = localStorage.getItem(BET_SIZES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_BET_SIZES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 4) return [...DEFAULT_BET_SIZES];
    const nums = parsed.map((v: unknown) => Number(v));
    if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 999)) return [...DEFAULT_BET_SIZES];
    return nums;
  } catch {
    return [...DEFAULT_BET_SIZES];
  }
}

export function HandHistoryCardPicker({
  onInsertCard,
  onInsertText,
  usedShorthands,
  usedUnknownCardCount = 0,
  onRemoveCard,
}: HandHistoryCardPickerProps) {
  const calcVisibility = useCalculatorVisibility();
  const [customPsbPercent, setCustomPsbPercent] = useState<string>('');
  const [betSizes, setBetSizes] = useState<number[]>(loadBetSizes);
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);
  const [editValues, setEditValues] = useState<string[]>(() => DEFAULT_BET_SIZES.map(String));

  const openEdit = (e: React.MouseEvent<HTMLElement>) => {
    setEditValues(betSizes.map(String));
    setEditAnchor(e.currentTarget);
  };

  const closeEdit = () => {
    setEditAnchor(null);
  };

  const applyEdit = () => {
    const next = editValues.map((v) => {
      const n = parseInt(v.replace(/\D/g, ''), 10);
      return Number.isNaN(n) || n < 0 ? 0 : Math.min(999, n);
    });
    setBetSizes(next);
    try {
      localStorage.setItem(BET_SIZES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota or disabled localStorage
    }
    closeEdit();
  };

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
          {Array.from({ length: UNKNOWN_CARD_SLOTS }).map((_, i) => {
            const used = usedUnknownCardCount > i;
            return (
              <CardButton
                key={i}
                rank="?"
                suit={null}
                used={used}
                onInsert={() => onInsertCard('x')}
                onRemove={onRemoveCard ? () => onRemoveCard('x') : undefined}
                ariaLabel={
                  used
                    ? onRemoveCard
                      ? `Remove unknown card ${i + 1} from content`
                      : `Unknown card ${i + 1} (already used)`
                    : `Insert unknown card ${i + 1}`
                }
              />
            );
          })}
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
        {calcVisibility.showMDF && <MDFPanel compact />}
        {calcVisibility.showFE && <FoldEquityPanel compact />}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {betSizes.map((pct, i) => (
            <Button
              key={i}
              size="small"
              variant="outlined"
              onClick={() => onInsertText(`${pct}% PSB`)}
              sx={{ minWidth: 0, px: 1 }}
              aria-label={`Insert ${pct}% PSB`}
            >
              b{pct}
            </Button>
          ))}
          <IconButton
            size="small"
            onClick={openEdit}
            sx={{ p: 0.25 }}
            aria-label="Edit bet sizes"
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const num = customPsbPercent.trim();
              if (num) {
                e.preventDefault();
                onInsertText(`${num}% PSB`);
              }
            }
          }}
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

      <Popover
        open={Boolean(editAnchor)}
        anchorEl={editAnchor}
        onClose={closeEdit}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, minWidth: 160 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            Bet sizes (%)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {editValues.map((v, i) => (
              <TextField
                key={i}
                size="small"
                label={`Size ${i + 1}`}
                type="number"
                value={v}
                onChange={(e) => {
                  const next = [...editValues];
                  next[i] = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setEditValues(next);
                }}
                inputProps={{ min: 0, max: 999, 'aria-label': `Bet size ${i + 1} percent` }}
                sx={{
                  '& .MuiInputBase-input': {
                    py: 0.5,
                    fontSize: '0.8rem',
                  },
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1.5 }}>
            <Button size="small" onClick={closeEdit}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={applyEdit}>
              Done
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
