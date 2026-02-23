import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { StakeNote } from '../types';
import { STAKE_VALUES } from '../types';

interface StakeNotesDisplayProps {
  stakeNotes: StakeNote[];
}

export function StakeNotesDisplay({ stakeNotes }: StakeNotesDisplayProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!stakeNotes || stakeNotes.length === 0) return null;

  const byStake = STAKE_VALUES.slice().reverse();
  const notesWithStake = stakeNotes.filter((sn) => sn.stake != null);
  const notesNullStake = stakeNotes.filter((sn) => sn.stake == null);

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNote = (
    key: string,
    label: string,
    labelColor: string,
    text: string
  ) => (
    <Box key={key} sx={{ mb: 1 }}>
      <Box
        component="button"
        onClick={() => toggle(key)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          p: 0,
          textAlign: 'left',
          width: '100%',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: labelColor }}
        >
          {label}
        </Typography>
        <IconButton size="small" sx={{ p: 0, ml: -0.5 }}>
          {expanded[key] ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Collapse in={expanded[key]}>
        <Box
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            pl: 0.5,
            pt: 0.25,
          }}
        >
          {text}
        </Box>
      </Collapse>
    </Box>
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
      >
        Stake notes
      </Typography>
      {byStake.map((stake) => {
        const sn = notesWithStake.find((n) => n.stake === stake);
        if (!sn || !sn.text.trim()) return null;
        return renderNote(
          `stake-${stake}`,
          String(stake),
          'primary.main',
          sn.text
        );
      })}
      {notesNullStake.map((sn, i) =>
        sn.text.trim()
          ? renderNote(`null-${i}`, 'General', 'text.secondary', sn.text)
          : null
      )}
    </Box>
  );
}
