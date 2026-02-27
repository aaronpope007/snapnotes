import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

/**
 * Geometric bet sizing: S = (Total Chips / Current Pot)^(1/n) - 1
 * Total Chips = effective stack + current pot
 * n = betting rounds remaining (Flop=3, Turn=2, River=1)
 * Returns decimal (e.g. 0.65 for 65% pot) or null if invalid.
 */
export function calculateGeoSize(
  effectiveStack: number,
  currentPot: number,
  streetsRemaining: number
): number | null {
  if (
    streetsRemaining <= 0 ||
    currentPot <= 0 ||
    !Number.isFinite(effectiveStack) ||
    !Number.isFinite(currentPot) ||
    !Number.isFinite(streetsRemaining)
  )
    return null;
  const totalChips = effectiveStack + currentPot;
  const totalGrowthMultiplier = totalChips / currentPot;
  const geoSize = Math.pow(totalGrowthMultiplier, 1 / streetsRemaining) - 1;
  if (!Number.isFinite(geoSize) || geoSize < 0) return null;
  return geoSize;
}

interface GeoPanelProps {
  compact?: boolean;
}

export function GeoPanel({ compact }: GeoPanelProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [effectiveStack, setEffectiveStack] = useState('');
  const [currentPot, setCurrentPot] = useState('');
  const [streetsRemaining, setStreetsRemaining] = useState<number>(3);

  const stackNum = parseFloat(effectiveStack) || 0;
  const potNum = parseFloat(currentPot) || 0;
  const geoSize = calculateGeoSize(stackNum, potNum, streetsRemaining);
  const geoPct = geoSize !== null ? 100 * geoSize : null;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Geometric bet sizing"
        aria-controls={anchorEl ? 'geo-popover' : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        sx={{ minWidth: 44, px: 1 }}
      >
        GEO
      </Button>
      <Popover
        id="geo-popover"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: compact ? 1 : 1.5,
              minWidth: 260,
              maxWidth: 320,
            },
          },
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          Geometric bet sizing
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Consistent % pot per street to jam river. n = streets remaining (Flop=3, Turn=2, River=1).
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
          <TextField
            size="small"
            label="Effective stack"
            type="number"
            value={effectiveStack}
            onChange={(e) => setEffectiveStack(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
          />
          <TextField
            size="small"
            label="Current pot"
            type="number"
            value={currentPot}
            onChange={(e) => setCurrentPot(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Streets remaining</InputLabel>
            <Select
              value={streetsRemaining}
              label="Streets remaining"
              onChange={(e) => setStreetsRemaining(Number(e.target.value))}
            >
              <MenuItem value={3}>3 (Flop — jam River)</MenuItem>
              <MenuItem value={2}>2 (Turn — jam River)</MenuItem>
              <MenuItem value={1}>1 (River — jam now)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {geoPct !== null && potNum > 0 && (
          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary">Geo-size target</Typography>
            <Typography variant="h6">{geoPct.toFixed(1)}% pot</Typography>
          </Paper>
        )}
      </Popover>
    </>
  );
}
