import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

/**
 * Break-even fold equity: FE = (S - E*(P+2*S)) / (P + S - E*(P+2*S))
 * Where P = pot before shove, S = shove total, E = equity when called (0-1)
 * Returns 0-100 percentage or null if invalid.
 */
function calcFoldEquity(pot: number, callAmount: number, shoveTotal: number, equityPct: number): number | null {
  if (pot < 0 || callAmount < 0 || shoveTotal <= 0 || !Number.isFinite(pot) || !Number.isFinite(callAmount) || !Number.isFinite(shoveTotal) || !Number.isFinite(equityPct)) return null;
  const E = Math.max(0, Math.min(100, equityPct)) / 100;
  const P = pot;
  const S = shoveTotal;
  const num = S - E * (P + 2 * S);
  const denom = P + S - E * (P + 2 * S);
  if (denom <= 0) return null;
  const fe = (100 * num) / denom;
  if (fe < 0 || fe > 100) return null;
  return fe;
}

interface FoldEquityPanelProps {
  compact?: boolean;
}

export function FoldEquityPanel({ compact }: FoldEquityPanelProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pot, setPot] = useState('100');
  const [callAmount, setCallAmount] = useState('0');
  const [shoveTotal, setShoveTotal] = useState('200');
  const [equityPct, setEquityPct] = useState('36');

  const potNum = parseFloat(pot) || 0;
  const callNum = parseFloat(callAmount) || 0;
  const shoveNum = parseFloat(shoveTotal) || 0;
  const equityNum = parseFloat(equityPct) || 0;
  const feResult = calcFoldEquity(potNum, callNum, shoveNum, equityNum);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Fold Equity Calculator"
        aria-controls={anchorEl ? 'fe-popover' : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        sx={{ minWidth: 44, px: 1 }}
      >
        FE%
      </Button>
      <Popover
        id="fe-popover"
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
              minWidth: 280,
              maxWidth: 340,
            },
          },
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          Fold equity calculator
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          If you shove, how often does Villain need to fold? Fill in the first four values (no need for $ or %).
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            label="Pot size before you shove"
            type="number"
            value={pot}
            onChange={(e) => setPot(e.target.value)}
            autoFocus
            inputProps={{ min: 0, step: 1 }}
            fullWidth
          />
          <TextField
            size="small"
            label="How much do you have to call?"
            type="number"
            value={callAmount}
            onChange={(e) => setCallAmount(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
            fullWidth
          />
          <TextField
            size="small"
            label="How much are you shoving total?"
            type="number"
            value={shoveTotal}
            onChange={(e) => setShoveTotal(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
            fullWidth
          />
          <TextField
            size="small"
            label="Estimated % equity when called? (0–100)"
            type="number"
            value={equityPct}
            onChange={(e) => setEquityPct(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 1 }}
            fullWidth
          />
        </Box>

        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            We break even if Villain folds this percentage:
          </Typography>
          <Typography variant="h6">
            {feResult !== null ? `${Math.round(feResult)}%` : '—'}
          </Typography>
        </Paper>
      </Popover>
    </>
  );
}
