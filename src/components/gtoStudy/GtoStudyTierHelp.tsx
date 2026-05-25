import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { GTO_STUDY_TIERS } from '../../constants/gtoStudyTiers';

interface GtoStudyTierHelpProps {
  size?: 'small' | 'medium';
  ariaLabel?: string;
}

export function GtoStudyTierHelp({
  size = 'small',
  ariaLabel = 'Study tier descriptions',
}: GtoStudyTierHelpProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size={size}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={ariaLabel}
        sx={{ color: 'text.secondary', p: 0.25 }}
      >
        <HelpOutlineIcon fontSize="inherit" />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { maxWidth: 320, p: 1.5 } } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Study tiers
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Assign each drill to the tier that matches its spot. Works across any solver (Lucid, GTO
          Wizard, etc.).
        </Typography>
        {GTO_STUDY_TIERS.map((t) => (
          <Box key={t.tier} sx={{ mb: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
              {t.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t.description}
            </Typography>
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Leave unassigned if unsure; the dashboard may suggest a tier from the drill name until you
          set one.
        </Typography>
      </Popover>
    </>
  );
}
