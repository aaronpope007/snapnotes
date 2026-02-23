import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { StakeNote } from '../types';
import { STAKE_VALUES } from '../types';

interface StakeNotesDisplayProps {
  stakeNotes: StakeNote[];
}

export function StakeNotesDisplay({ stakeNotes }: StakeNotesDisplayProps) {
  if (!stakeNotes || stakeNotes.length === 0) return null;

  const byStake = STAKE_VALUES.slice().reverse();
  const notesWithStake = stakeNotes.filter((sn) => sn.stake != null);
  const notesNullStake = stakeNotes.filter((sn) => sn.stake == null);

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
        return (
          <Box key={stake} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              {stake}
            </Typography>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                pl: 0.5,
              }}
            >
              {sn.text}
            </Box>
          </Box>
        );
      })}
      {notesNullStake.map((sn, i) =>
        sn.text.trim() ? (
          <Box key={`null-${i}`} sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              General
            </Typography>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                pl: 0.5,
              }}
            >
              {sn.text}
            </Box>
          </Box>
        ) : null
      )}
    </Box>
  );
}
