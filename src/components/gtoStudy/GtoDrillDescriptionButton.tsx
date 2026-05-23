import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';

interface GtoDrillDescriptionButtonProps {
  description?: string;
}

/** Notes icon + popover; renders nothing when description is empty. */
export function GtoDrillDescriptionButton({ description }: GtoDrillDescriptionButtonProps) {
  const text = description?.trim() ?? '';
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!text) return null;

  return (
    <>
      <Tooltip title="View description">
        <IconButton
          size="small"
          aria-label="View drill description"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          sx={{ p: 0.2, flexShrink: 0, color: 'text.secondary' }}
        >
          <StickyNote2OutlinedIcon sx={{ fontSize: '0.95rem' }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            p: 1.5,
            maxWidth: 300,
            maxHeight: 200,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </Typography>
      </Popover>
    </>
  );
}
