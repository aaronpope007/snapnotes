import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import {
  PREFLOP_LEAKS,
  POSTFLOP_LEAKS,
  LEAK_COLORS,
  getLeakById,
  type LeakDefinition,
} from '../constants/leaks';
import { useCompactMode } from '../context/CompactModeContext';

interface LeaksSectionProps {
  leaks: string[];
  onUpdateLeaks: (leaks: string[]) => Promise<void>;
  saving?: boolean;
}

export function LeaksSection({ leaks, onUpdateLeaks, saving = false }: LeaksSectionProps) {
  const compact = useCompactMode();
  const [expandedCategory, setExpandedCategory] = useState<'preflop' | 'postflop' | null>(null);

  const toggleLeak = async (id: string) => {
    const next = leaks.includes(id)
      ? leaks.filter((l) => l !== id)
      : [...leaks, id];
    await onUpdateLeaks(next);
  };

  const handleRemoveLeak = async (id: string) => {
    await onUpdateLeaks(leaks.filter((l) => l !== id));
  };

  const renderLeakButtons = (defs: LeakDefinition[]) => {
    const byColor = { aggro: [] as LeakDefinition[], passive: [] as LeakDefinition[], mixed: [] as LeakDefinition[] };
    for (const d of defs) byColor[d.color].push(d);
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {(['aggro', 'passive', 'mixed'] as const).map((color) => (
          <Box key={color} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {byColor[color].map((d) => {
              const selected = leaks.includes(d.id);
              return (
                <Button
                  key={d.id}
                  size="small"
                  variant={selected ? 'contained' : 'outlined'}
                  onClick={() => toggleLeak(d.id)}
                  disabled={saving}
                  sx={{
                    minWidth: 'auto',
                    px: 1,
                    py: 0.25,
                    fontSize: compact ? '0.7rem' : '0.75rem',
                    borderColor: LEAK_COLORS[color],
                    color: selected ? '#fff' : LEAK_COLORS[color],
                    bgcolor: selected ? LEAK_COLORS[color] : undefined,
                    '&:hover': {
                      borderColor: LEAK_COLORS[color],
                      bgcolor: selected ? LEAK_COLORS[color] : `${LEAK_COLORS[color]}15`,
                    },
                  }}
                >
                  {d.label}
                </Button>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  const selectedLeaks = leaks.map(getLeakById).filter(Boolean) as LeakDefinition[];
  const preflopSelected = selectedLeaks.filter((d) => d.category === 'preflop');
  const postflopSelected = selectedLeaks.filter((d) => d.category === 'postflop');

  const renderSelectedChips = (defs: LeakDefinition[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {defs.map((d) => (
        <Chip
          key={d.id}
          label={d.label}
          size="small"
          onDelete={() => handleRemoveLeak(d.id)}
          disabled={saving}
          sx={{
            bgcolor: `${LEAK_COLORS[d.color]}30`,
            color: LEAK_COLORS[d.color],
            borderLeft: `3px solid ${LEAK_COLORS[d.color]}`,
            '& .MuiChip-deleteIcon': { color: LEAK_COLORS[d.color] },
          }}
        />
      ))}
    </Box>
  );

  return (
    <Box sx={{ mb: compact ? 1 : 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
        Leaks
      </Typography>
      {selectedLeaks.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
          {preflopSelected.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontWeight: 500 }}>
                Preflop
              </Typography>
              {renderSelectedChips(preflopSelected)}
            </Box>
          )}
          {postflopSelected.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontWeight: 500 }}>
                Postflop
              </Typography>
              {renderSelectedChips(postflopSelected)}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant={expandedCategory === 'preflop' ? 'contained' : 'outlined'}
          onClick={() => setExpandedCategory((c) => (c === 'preflop' ? null : 'preflop'))}
          disabled={saving}
        >
          Preflop
        </Button>
        <Button
          size="small"
          variant={expandedCategory === 'postflop' ? 'contained' : 'outlined'}
          onClick={() => setExpandedCategory((c) => (c === 'postflop' ? null : 'postflop'))}
          disabled={saving}
        >
          Postflop
        </Button>
      </Box>
      <Collapse in={expandedCategory === 'preflop'}>
        <Box sx={{ mt: 1, pl: 0.5 }}>{renderLeakButtons(PREFLOP_LEAKS)}</Box>
      </Collapse>
      <Collapse in={expandedCategory === 'postflop'}>
        <Box sx={{ mt: 1, pl: 0.5 }}>{renderLeakButtons(POSTFLOP_LEAKS)}</Box>
      </Collapse>
    </Box>
  );
}
