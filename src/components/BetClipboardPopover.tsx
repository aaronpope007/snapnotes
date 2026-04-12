import { useState, useEffect, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import PercentIcon from '@mui/icons-material/Percent';
import { formatPlainNumber } from '../utils/plainNumberString';

const STORAGE_PCTS = 'snapnotes-bet-clipboard-pcts';
const STORAGE_AMOUNTS = 'snapnotes-bet-clipboard-amount-presets';

const DEFAULT_PCTS = [10, 25, 33, 40, 50, 66, 75];

function loadJsonNumbers(key: string, fallback: number[]): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    const nums = parsed
      .map((x) => (typeof x === 'number' ? x : Number(x)))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 1000);
    return nums.length ? [...new Set(nums)].sort((a, b) => a - b) : fallback;
  } catch {
    return fallback;
  }
}

function saveJsonNumbers(key: string, values: number[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // ignore quota
  }
}

function parseOptionalNumber(s: string): number | null {
  const t = s.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

interface BetClipboardPopoverProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BetClipboardPopover({ onSuccess, onError }: BetClipboardPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [mode, setMode] = useState<'amount' | 'pot'>('amount');
  const [amountStr, setAmountStr] = useState('');
  const [potStr, setPotStr] = useState('');
  const [pctPresets, setPctPresets] = useState<number[]>(() => loadJsonNumbers(STORAGE_PCTS, DEFAULT_PCTS));
  const [amountPresets, setAmountPresets] = useState<number[]>(() => loadJsonNumbers(STORAGE_AMOUNTS, []));
  const [newPctStr, setNewPctStr] = useState('');
  const [newAmountPresetStr, setNewAmountPresetStr] = useState('');

  useEffect(() => {
    saveJsonNumbers(STORAGE_PCTS, pctPresets);
  }, [pctPresets]);

  useEffect(() => {
    saveJsonNumbers(STORAGE_AMOUNTS, amountPresets);
  }, [amountPresets]);

  const potNum = useMemo(() => parseOptionalNumber(potStr), [potStr]);

  const copyText = useCallback(
    async (text: string) => {
      if (!text) {
        onError('Nothing to copy.');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        onSuccess(`Copied ${text}.`);
      } catch {
        onError('Could not copy to clipboard.');
      }
    },
    [onSuccess, onError]
  );

  const handleCopyAmount = useCallback(() => {
    const n = parseOptionalNumber(amountStr);
    if (n == null) {
      onError('Enter a number.');
      return;
    }
    void copyText(formatPlainNumber(n));
  }, [amountStr, copyText, onError]);

  const handlePctClick = useCallback(
    (pct: number) => {
      if (potNum == null) {
        onError('Enter pot as a number.');
        return;
      }
      const value = (potNum * pct) / 100;
      void copyText(formatPlainNumber(value));
    },
    [potNum, copyText, onError]
  );

  const addPctPreset = useCallback(() => {
    const n = parseOptionalNumber(newPctStr);
    if (n == null || n <= 0 || n > 1000) {
      onError('Enter a percentage between 0 and 1000.');
      return;
    }
    setPctPresets((prev) => [...new Set([...prev, n])].sort((a, b) => a - b));
    setNewPctStr('');
  }, [newPctStr, onError]);

  const addAmountPreset = useCallback(() => {
    const n = parseOptionalNumber(newAmountPresetStr);
    if (n == null || n <= 0) {
      onError('Enter a positive number.');
      return;
    }
    setAmountPresets((prev) => [...new Set([...prev, n])].sort((a, b) => a - b));
    setNewAmountPresetStr('');
  }, [newAmountPresetStr, onError]);

  return (
    <>
      <IconButton
        size="medium"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Bet clipboard"
        title="Copy bet sizes (numbers only)"
        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.75rem' } }}
      >
        <PercentIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 1.5, maxWidth: 320, width: 'min(320px, calc(100vw - 24px))' } } }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Bet clipboard
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Plain numbers only (no $ or bb). Pot 120 and 10% copies 12.
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          fullWidth
          onChange={(_, v) => v != null && setMode(v)}
          sx={{ mb: 1.5 }}
        >
          <ToggleButton value="amount">Amount</ToggleButton>
          <ToggleButton value="pot">Pot %</ToggleButton>
        </ToggleButtonGroup>

        {mode === 'amount' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              label="Amount"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="12"
              fullWidth
              inputProps={{ inputMode: 'decimal' }}
            />
            <Button variant="contained" size="small" onClick={handleCopyAmount}>
              Copy amount
            </Button>
            {amountPresets.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Saved amounts (click to copy, × to remove)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {amountPresets.map((a) => (
                    <Chip
                      key={a}
                      size="small"
                      label={formatPlainNumber(a)}
                      onClick={() => void copyText(formatPlainNumber(a))}
                      onDelete={() => setAmountPresets((p) => p.filter((x) => x !== a))}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Add saved amount"
                value={newAmountPresetStr}
                onChange={(e) => setNewAmountPresetStr(e.target.value)}
                placeholder="25"
                sx={{ flex: 1 }}
                inputProps={{ inputMode: 'decimal' }}
              />
              <Button size="small" variant="outlined" onClick={addAmountPreset} sx={{ mt: 0.5 }}>
                Add
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              label="Pot"
              value={potStr}
              onChange={(e) => setPotStr(e.target.value)}
              placeholder="120"
              fullWidth
              inputProps={{ inputMode: 'decimal' }}
            />
            <Typography variant="caption" color="text.secondary">
              Tap a % to copy pot × % (hover to preview amount).
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {pctPresets.map((pct) => {
                const computed =
                  potNum != null ? (potNum * pct) / 100 : null;
                const title =
                  computed != null
                    ? `Copy ${formatPlainNumber(computed)}`
                    : 'Enter pot first';
                return (
                  <Button
                    key={pct}
                    size="small"
                    variant="outlined"
                    disabled={potNum == null}
                    title={title}
                    onClick={() => handlePctClick(pct)}
                    sx={{ minWidth: 52 }}
                  >
                    {`${formatPlainNumber(pct)}%`}
                  </Button>
                );
              })}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Add % preset"
                value={newPctStr}
                onChange={(e) => setNewPctStr(e.target.value)}
                placeholder="68"
                sx={{ flex: 1 }}
                inputProps={{ inputMode: 'decimal' }}
              />
              <Button size="small" variant="outlined" onClick={addPctPreset} sx={{ mt: 0.5 }}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {pctPresets.map((pct) => (
                <Chip
                  key={pct}
                  size="small"
                  label={`${formatPlainNumber(pct)}%`}
                  onDelete={() => setPctPresets((p) => p.filter((x) => x !== pct))}
                />
              ))}
            </Box>
          </Box>
        )}
      </Popover>
    </>
  );
}
