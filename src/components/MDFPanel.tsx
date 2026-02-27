import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import ClearIcon from '@mui/icons-material/Clear';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

/** MDF = Pot / (Pot + Bet). Returns 0-100 percentage or null if invalid. */
function calcMDF(pot: number, bet: number): number | null {
  if (pot <= 0 || bet < 0 || !Number.isFinite(pot) || !Number.isFinite(bet)) return null;
  return (100 * pot) / (pot + bet);
}

const BET_SIZES_PCT = [25, 33, 50, 67, 75, 100, 120, 150, 250, 500] as const;

interface MDFPanelProps {
  compact?: boolean;
}

export function MDFPanel({ compact }: MDFPanelProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pot, setPot] = useState('');
  const [bet, setBet] = useState('');

  useEffect(() => {
    if (anchorEl) {
      setPot('');
      setBet('');
    }
  }, [anchorEl]);

  const potNum = parseFloat(pot) || 0;
  const betNum = parseFloat(bet) || 0;
  const computedMDF = calcMDF(potNum, betNum);

  return (
    <>
      <Button
        variant={anchorEl ? 'contained' : 'outlined'}
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Minimum Defense Frequency"
        aria-controls={anchorEl ? 'mdf-popover' : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        sx={{ minWidth: 44, px: 1 }}
      >
        MDF
      </Button>
      <Popover
        id="mdf-popover"
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Minimum Defense Frequency
          </Typography>
          <IconButton
            size="small"
            onClick={() => { setPot(''); setBet(''); }}
            aria-label="Clear MDF inputs"
            sx={{ p: 0.25 }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Pot"
            type="number"
            value={pot}
            onChange={(e) => setPot(e.target.value)}
            autoFocus
            inputProps={{ min: 0, step: 1, autoComplete: 'off' }}
            sx={{ width: 90 }}
          />
          <TextField
            size="small"
            label="Facing bet"
            type="number"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            inputProps={{ min: 0, step: 1, autoComplete: 'off' }}
            sx={{ width: 90 }}
          />
        </Box>

        {computedMDF !== null && potNum > 0 && (
          <Paper variant="outlined" sx={{ p: 1, mb: 1.5, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary">MDF</Typography>
            <Typography variant="h6">{computedMDF.toFixed(1)}%</Typography>
          </Paper>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Common bet sizes
        </Typography>
        <Table size="small" sx={{ '& td, & th': { py: 0.4, px: 0.75, fontSize: '0.75rem' } }}>
          <TableHead>
            <TableRow>
              <TableCell>Bet %</TableCell>
              <TableCell align="right">MDF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {BET_SIZES_PCT.map((pct) => {
              const mdf = calcMDF(1, pct / 100);
              return (
                <TableRow key={pct}>
                  <TableCell>{pct}% pot</TableCell>
                  <TableCell align="right">{mdf !== null ? `${mdf.toFixed(1)}%` : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Popover>
    </>
  );
}
