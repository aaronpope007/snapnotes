import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  LEAK_MAP,
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

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/=/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[-]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SUB_HEADER_LABELS: Record<string, string> = {
  CHECK_RAISE: 'Check-Raising',
  DONKING: 'Donking',
  DEFENDING: 'Defending',
};

export function LeaksSection({ leaks, onUpdateLeaks, saving = false }: LeaksSectionProps) {
  const compact = useCompactMode();
  const [phase, setPhase] = useState<'preflop' | 'postflop' | null>(null);
  const [postflopPosition, setPostflopPosition] = useState<'ip' | 'oop'>('ip');
  const [role, setRole] = useState<'PFR' | 'PFR_LEAD' | 'VS_PFR'>('PFR');

  const toggleLeak = async (id: string) => {
    const next = leaks.includes(id)
      ? leaks.filter((l) => l !== id)
      : [...leaks, id];
    await onUpdateLeaks(next);
  };

  const handleRemoveLeak = async (storedId: string) => {
    await onUpdateLeaks(leaks.filter((l) => l !== storedId));
  };

  const isLeakSelected = (id: string) => leaks.includes(id);

  const renderLeakButton = (label: string, def: LeakDefinition | undefined) => {
    const id = def?.id ?? slugify(label);
    const color = def?.color ?? 'passive';
    const selected = isLeakSelected(id);
    const hex = LEAK_COLORS[color];
    return (
      <Button
        key={id}
        variant={selected ? 'contained' : 'outlined'}
        onClick={() => toggleLeak(id)}
        disabled={saving}
        sx={{
          minHeight: 44,
          minWidth: 'auto',
          px: 1.5,
          py: 1,
          fontSize: compact ? '0.75rem' : '0.875rem',
          textTransform: 'none',
          borderColor: hex,
          color: selected ? '#fff' : hex,
          bgcolor: selected ? hex : undefined,
          '&:hover': {
            borderColor: hex,
            bgcolor: selected ? hex : `${hex}15`,
          },
        }}
      >
        {label}
      </Button>
    );
  };

  const renderLeakGroup = (labels: string[]) => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {labels.map((label) => {
          const id = slugify(label);
          const def = getLeakById(id);
          return renderLeakButton(label, def);
        })}
      </Box>
    );
  };

  const renderGrid = () => {
    if (phase === 'preflop') {
      const labels = role === 'PFR' ? [...LEAK_MAP.PREFLOP.PFR] : [...LEAK_MAP.PREFLOP.VS_PFR];
      return renderLeakGroup(labels);
    }

    if (phase === 'postflop' && postflopPosition === 'ip') {
      const labels = role === 'PFR_LEAD' ? [...LEAK_MAP.POSTFLOP_IP.PFR_LEAD] : [...LEAK_MAP.POSTFLOP_IP.VS_PFR];
      return renderLeakGroup(labels);
    }

    if (phase === 'postflop' && postflopPosition === 'oop') {
      if (role === 'PFR_LEAD') {
        return renderLeakGroup([...LEAK_MAP.POSTFLOP_OOP.PFR_LEAD]);
      }
      const vsPfr = LEAK_MAP.POSTFLOP_OOP.VS_PFR;
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(['CHECK_RAISE', 'DONKING', 'DEFENDING'] as const).map((key) => (
            <Box key={key}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}
              >
                {SUB_HEADER_LABELS[key]}
              </Typography>
              {renderLeakGroup([...vsPfr[key]])}
            </Box>
          ))}
        </Box>
      );
    }

    return null;
  };

  const selectedForDisplay = leaks
    .map((storedId) => ({ storedId, def: getLeakById(storedId) }))
    .filter((x): x is { storedId: string; def: LeakDefinition } => Boolean(x.def));
  const preflopSelected = selectedForDisplay.filter((x) => x.def.category === 'preflop');
  const postflopSelected = selectedForDisplay.filter((x) => x.def.category === 'postflop');

  const renderSelectedChips = (items: { storedId: string; def: LeakDefinition }[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {items.map(({ storedId, def }) => (
        <Chip
          key={storedId}
          label={def.label}
          size="small"
          onDelete={() => handleRemoveLeak(storedId)}
          disabled={saving}
          sx={{
            bgcolor: `${LEAK_COLORS[def.color]}30`,
            color: LEAK_COLORS[def.color],
            borderLeft: `3px solid ${LEAK_COLORS[def.color]}`,
            '& .MuiChip-deleteIcon': { color: LEAK_COLORS[def.color] },
          }}
        />
      ))}
    </Box>
  );

  const showPositionToggle = phase === 'postflop';
  const showRoleToggle = phase !== null;

  return (
    <Accordion
      disableGutters
      sx={{
        mb: compact ? 1 : 2,
        '&:before': { display: 'none' },
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Leaks
          </Typography>
          {selectedForDisplay.length > 0 && (
            <Chip
              size="small"
              label={selectedForDisplay.length}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          {selectedForDisplay.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
              {selectedForDisplay.slice(0, 3).map(({ storedId, def }) => (
                <Chip
                  key={storedId}
                  label={def.label}
                  size="small"
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleRemoveLeak(storedId);
                  }}
                  disabled={saving}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    '& .MuiChip-label': { px: 0.5 },
                    bgcolor: `${LEAK_COLORS[def.color]}30`,
                    color: LEAK_COLORS[def.color],
                    borderLeft: `2px solid ${LEAK_COLORS[def.color]}`,
                    '& .MuiChip-deleteIcon': { fontSize: 14, color: LEAK_COLORS[def.color] },
                  }}
                />
              ))}
              {selectedForDisplay.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  +{selectedForDisplay.length - 3}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {selectedForDisplay.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
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

        {/* Phase toggle */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          <Button
            size="small"
            variant={phase === 'preflop' ? 'contained' : 'outlined'}
            onClick={() => {
              setPhase((p) => (p === 'preflop' ? null : 'preflop'));
              setRole('PFR');
            }}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Preflop
          </Button>
          <Button
            size="small"
            variant={phase === 'postflop' ? 'contained' : 'outlined'}
            onClick={() => {
              setPhase((p) => (p === 'postflop' ? null : 'postflop'));
              setRole('PFR_LEAD');
            }}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Postflop
          </Button>
        </Box>

        <Collapse in={phase !== null}>
          <Box sx={{ pl: 0.5 }}>
            {showPositionToggle && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                <Button
                  size="small"
                  variant={postflopPosition === 'ip' ? 'contained' : 'outlined'}
                  onClick={() => setPostflopPosition('ip')}
                  disabled={saving}
                  sx={{ textTransform: 'none' }}
                >
                  IP
                </Button>
                <Button
                  size="small"
                  variant={postflopPosition === 'oop' ? 'contained' : 'outlined'}
                  onClick={() => setPostflopPosition('oop')}
                  disabled={saving}
                  sx={{ textTransform: 'none' }}
                >
                  OOP
                </Button>
              </Box>
            )}

            {showRoleToggle && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                <Button
                  size="small"
                  variant={role === 'PFR' || role === 'PFR_LEAD' ? 'contained' : 'outlined'}
                  onClick={() => setRole(phase === 'preflop' ? 'PFR' : 'PFR_LEAD')}
                  disabled={saving}
                  sx={{ textTransform: 'none' }}
                >
                  {phase === 'preflop' ? 'PFR' : 'PFR Lead'}
                </Button>
                <Button
                  size="small"
                  variant={role === 'VS_PFR' ? 'contained' : 'outlined'}
                  onClick={() => setRole('VS_PFR')}
                  disabled={saving}
                  sx={{ textTransform: 'none' }}
                >
                  vs PFR
                </Button>
              </Box>
            )}

            {renderGrid()}
          </Box>
        </Collapse>
      </AccordionDetails>
    </Accordion>
  );
}
