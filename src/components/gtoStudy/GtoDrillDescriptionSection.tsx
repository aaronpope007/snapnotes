import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { GTO_DRILL_DESCRIPTION_MAX } from '../../constants/gtoStudy';

interface GtoDrillDescriptionSectionProps {
  value: string;
  onChange: (value: string) => void;
  /** Changes when the form resets (e.g. modal open / drill id). */
  resetKey: string;
}

export function GtoDrillDescriptionSection({
  value,
  onChange,
  resetKey,
}: GtoDrillDescriptionSectionProps) {
  const trimmed = value.trim();
  const hasText = trimmed.length > 0;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  const preview =
    trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;

  return (
    <Box sx={{ mt: 0.5 }}>
      {!expanded && !hasText && (
        <Button
          size="small"
          color="inherit"
          onClick={() => setExpanded(true)}
          sx={{
            textTransform: 'none',
            color: 'text.secondary',
            fontSize: '0.8125rem',
            p: 0,
            minWidth: 0,
            justifyContent: 'flex-start',
          }}
        >
          Add description (optional)
        </Button>
      )}

      {!expanded && hasText && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.25,
            minWidth: 0,
          }}
        >
          <IconButton
            size="small"
            aria-label="Expand description"
            onClick={() => setExpanded(true)}
            sx={{ p: 0.25, mt: -0.25 }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            color="inherit"
            onClick={() => setExpanded(true)}
            sx={{
              flex: 1,
              minWidth: 0,
              textTransform: 'none',
              color: 'text.secondary',
              fontSize: '0.8125rem',
              p: 0,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            <Typography
              component="span"
              variant="caption"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              <Box component="span" sx={{ color: 'text.disabled', mr: 0.5 }}>
                Description
              </Box>
              {preview}
            </Typography>
          </Button>
        </Box>
      )}

      <Collapse in={expanded}>
        <Box sx={{ pt: hasText || expanded ? 0.5 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Description (optional)
            </Typography>
            <IconButton
              size="small"
              aria-label="Collapse description"
              onClick={() => setExpanded(false)}
              sx={{ p: 0.25 }}
            >
              <ExpandLessIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            size="small"
            placeholder="Notes about this drill, Lucid setup, etc."
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, GTO_DRILL_DESCRIPTION_MAX))}
            helperText={`${value.length}/${GTO_DRILL_DESCRIPTION_MAX}`}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
