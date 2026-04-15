import { useState, useEffect, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MuiPopover from '@mui/material/Popover';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PercentIcon from '@mui/icons-material/Percent';
import { formatPlainNumber } from '../utils/plainNumberString';

const STORAGE_STAKE_PRESETS = 'snapnotes-bet-clipboard-stake-presets-v1';
const STORAGE_SELECTED_STAKE_PRESET = 'snapnotes-bet-clipboard-selected-stake-preset-v1';

const STORAGE_SRP_POT_BLINDS = 'snapnotes-bet-clipboard-srp-pot-blinds-v1';
const STORAGE_3B_POT_BLINDS = 'snapnotes-bet-clipboard-3b-pot-blinds-v1';
const STORAGE_4B_POT_BLINDS = 'snapnotes-bet-clipboard-4b-pot-blinds-v1';
const STORAGE_5B_POT_BLINDS = 'snapnotes-bet-clipboard-5b-pot-blinds-v1';

const STORAGE_SIZINGS_BY_STACK = 'snapnotes-bet-clipboard-sizings-by-stack-v1';
const STORAGE_SELECTED_STACK_TAB = 'snapnotes-bet-clipboard-selected-stack-tab-v1';

const DEFAULT_STAKE_PRESET_NAME = 'WPT Gold';

type StackDepth = '50' | '100' | '150' | '200';
const STACK_DEPTHS: { value: StackDepth; label: string }[] = [
  { value: '50', label: '50bb' },
  { value: '100', label: '100bb' },
  { value: '150', label: '150bb' },
  { value: '200', label: '200bb' },
];

interface StakePreset {
  name: string;
  sb: number; // small blind amount (chips)
  bb: number; // big blind amount (chips)
  ante: number; // ante amount (chips)
}

interface BetSizings {
  sbOpenSizes: number[];
  sbVs3Bet: number[];
  sbFourBetSizes: number[];
  bbVsOpen: number[];
  bbThreeBetSizes: number[];
  bbVs4Bet: (number | null)[];
  bbFiveBetTo: (number | null)[];
  cbetSrpPcts: number[];
  cbet3BetPcts: number[];
  cbet4BetPcts: number[];
  cbet5BetPcts: number[];
}

const DEFAULT_SIZINGS: BetSizings = {
  sbOpenSizes: [2, 2.5, 2.75, 3, 4],
  sbVs3Bet: [9, 12, 13.5, 15, 20, 22],
  sbFourBetSizes: [29.3, 36, 37.1, 37.5, 45, 49.5],
  bbVsOpen: [2, 2.5, 2.75, 3, 4],
  bbThreeBetSizes: [11, 11.3, 12.4, 13.5, 20],
  bbVs4Bet: [null, 25, 33.9, 40],
  bbFiveBetTo: [null, 56.3, 76.3, 9999],
  cbetSrpPcts: [25, 40, 68, 100, 148, 342],
  cbet3BetPcts: [25, 40, 72, 100, 141],
  cbet4BetPcts: [10, 20, 25, 33, 40, 50],
  cbet5BetPcts: [15, 30, 37.5, 49.5, 60, 75],
};

function loadSizingsByStack(fallback: Record<StackDepth, BetSizings>): Record<StackDepth, BetSizings> {
  try {
    const raw = localStorage.getItem(STORAGE_SIZINGS_BY_STACK);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed == null) return fallback;
    const rec = parsed as Record<string, unknown>;
    const result: Partial<Record<StackDepth, BetSizings>> = {};
    for (const { value } of STACK_DEPTHS) {
      const v = rec[value];
      if (typeof v !== 'object' || v == null) continue;
      const r = v as Record<string, unknown>;
      const readNums = (key: keyof BetSizings): number[] | null => {
        const arr = r[key as string];
        if (!Array.isArray(arr)) return null;
        const nums = arr
          .map((x) => (typeof x === 'number' ? x : Number(x)))
          .filter((n) => Number.isFinite(n));
        return nums.length ? nums : null;
      };
      const readNumsNullable = (key: keyof BetSizings): (number | null)[] | null => {
        const arr = r[key as string];
        if (!Array.isArray(arr)) return null;
        const out = arr.map((x) => {
          if (x == null) return null;
          const n = typeof x === 'number' ? x : Number(x);
          return Number.isFinite(n) ? n : null;
        });
        return out.length ? out : null;
      };
      const maybe: BetSizings = {
        sbOpenSizes: readNums('sbOpenSizes') ?? DEFAULT_SIZINGS.sbOpenSizes,
        sbVs3Bet: readNums('sbVs3Bet') ?? DEFAULT_SIZINGS.sbVs3Bet,
        sbFourBetSizes: readNums('sbFourBetSizes') ?? DEFAULT_SIZINGS.sbFourBetSizes,
        bbVsOpen: readNums('bbVsOpen') ?? DEFAULT_SIZINGS.bbVsOpen,
        bbThreeBetSizes: readNums('bbThreeBetSizes') ?? DEFAULT_SIZINGS.bbThreeBetSizes,
        bbVs4Bet: readNumsNullable('bbVs4Bet') ?? DEFAULT_SIZINGS.bbVs4Bet,
        bbFiveBetTo: readNumsNullable('bbFiveBetTo') ?? DEFAULT_SIZINGS.bbFiveBetTo,
        cbetSrpPcts: readNums('cbetSrpPcts') ?? DEFAULT_SIZINGS.cbetSrpPcts,
        cbet3BetPcts: readNums('cbet3BetPcts') ?? DEFAULT_SIZINGS.cbet3BetPcts,
        cbet4BetPcts: readNums('cbet4BetPcts') ?? DEFAULT_SIZINGS.cbet4BetPcts,
        cbet5BetPcts: readNums('cbet5BetPcts') ?? DEFAULT_SIZINGS.cbet5BetPcts,
      };
      result[value] = maybe;
    }
    const completed = result as Record<StackDepth, BetSizings>;
    return (completed['50'] && completed['100'] && completed['150'] && completed['200']) ? completed : fallback;
  } catch {
    return fallback;
  }
}

function saveSizingsByStack(value: Record<StackDepth, BetSizings>): void {
  try {
    localStorage.setItem(STORAGE_SIZINGS_BY_STACK, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

const DEFAULT_STAKE_PRESETS: StakePreset[] = [{ name: DEFAULT_STAKE_PRESET_NAME, sb: 0.5, bb: 1, ante: 0.25 }];

function parsePositiveNumberOrNull(s: string): number | null {
  const n = parseOptionalNumber(s);
  if (n == null) return null;
  if (n <= 0) return null;
  return n;
}

function uniqueSorted(nums: number[]): number[] {
  const deduped = [...new Set(nums.filter((n) => Number.isFinite(n)))];
  return deduped.sort((a, b) => a - b);
}

interface ChipNumberListEditorProps {
  label: string;
  values: number[];
  onChange: (next: number[]) => void;
}

function ChipNumberListEditor({ label, values, onChange }: ChipNumberListEditorProps) {
  const [addStr, setAddStr] = useState('');
  const [editAnchorEl, setEditAnchorEl] = useState<HTMLElement | null>(null);
  const [editValueStr, setEditValueStr] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const closeEdit = useCallback(() => {
    setEditAnchorEl(null);
    setEditIdx(null);
    setEditValueStr('');
  }, []);

  const handleAdd = useCallback(() => {
    const n = parsePositiveNumberOrNull(addStr);
    if (n == null) return;
    onChange(uniqueSorted([...values, n]));
    setAddStr('');
  }, [addStr, onChange, values]);

  const handleDelete = useCallback(
    (n: number) => {
      onChange(values.filter((x) => x !== n));
    },
    [onChange, values]
  );

  const openEdit = useCallback(
    (idx: number, anchor: HTMLElement) => {
      setEditIdx(idx);
      setEditAnchorEl(anchor);
      setEditValueStr(formatPlainNumber(values[idx] ?? 0));
    },
    [values]
  );

  const commitEdit = useCallback(() => {
    if (editIdx == null) return;
    const n = parsePositiveNumberOrNull(editValueStr);
    if (n == null) {
      closeEdit();
      return;
    }
    const next = [...values];
    next[editIdx] = n;
    onChange(uniqueSorted(next));
    closeEdit();
  }, [closeEdit, editIdx, editValueStr, onChange, values]);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {values.map((n, idx) => (
          <Chip
            key={`${n}-${idx}`}
            size="small"
            label={formatPlainNumber(n)}
            onClick={(e) => openEdit(idx, e.currentTarget)}
            onDelete={() => handleDelete(n)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
        <TextField
          size="small"
          value={addStr}
          onChange={(e) => setAddStr(e.target.value)}
          placeholder="+"
          inputProps={{ inputMode: 'decimal' }}
          sx={{ width: 72 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button size="small" variant="outlined" onClick={handleAdd}>
          Add
        </Button>
      </Box>

      <MuiPopover
        open={Boolean(editAnchorEl)}
        anchorEl={editAnchorEl}
        onClose={closeEdit}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1 } } }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            value={editValueStr}
            onChange={(e) => setEditValueStr(e.target.value)}
            inputProps={{ inputMode: 'decimal' }}
            sx={{ width: 110 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') closeEdit();
            }}
            autoFocus
          />
          <Button size="small" variant="contained" onClick={commitEdit}>
            Save
          </Button>
        </Stack>
      </MuiPopover>
    </Box>
  );
}

function parseOptionalNumber(s: string): number | null {
  const t = s.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function clampToReasonable(n: number, { min, max }: { min: number; max: number }): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function loadJsonStakePresets(key: string, fallback: StakePreset[]): StakePreset[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    const presets: StakePreset[] = parsed
      .map((x) => {
        if (typeof x !== 'object' || x == null) return null;
        const rec = x as Record<string, unknown>;
        const name = typeof rec.name === 'string' ? rec.name.trim() : '';
        const sb = typeof rec.sb === 'number' ? rec.sb : Number(rec.sb);
        const bb = typeof rec.bb === 'number' ? rec.bb : Number(rec.bb);
        const ante = typeof rec.ante === 'number' ? rec.ante : Number(rec.ante);
        if (!name) return null;
        if (![sb, bb, ante].every((n) => Number.isFinite(n) && n >= 0)) return null;
        const safeSb = clampToReasonable(sb, { min: 0, max: 1_000_000 });
        const safeBb = clampToReasonable(bb, { min: 0.000001, max: 1_000_000 });
        const safeAnte = clampToReasonable(ante, { min: 0, max: 1_000_000 });
        return { name, sb: safeSb, bb: safeBb, ante: safeAnte };
      })
      .filter((p): p is StakePreset => p != null);
    const deduped = new Map<string, StakePreset>();
    for (const p of presets) deduped.set(p.name, p);
    const list = [...deduped.values()].sort((a, b) => a.name.localeCompare(b.name));
    return list.length ? list : fallback;
  } catch {
    return fallback;
  }
}

function saveJsonStakePresets(key: string, values: StakePreset[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // ignore quota
  }
}

function loadOptionalNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function saveOptionalNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore quota
  }
}

interface BetClipboardPopoverProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BetClipboardPopover({ onSuccess, onError }: BetClipboardPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [stackDepth, setStackDepth] = useState<StackDepth>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SELECTED_STACK_TAB);
      if (raw === '50' || raw === '100' || raw === '150' || raw === '200') return raw;
      return '100';
    } catch {
      return '100';
    }
  });

  const defaultByStack = useMemo<Record<StackDepth, BetSizings>>(
    () => ({
      '50': DEFAULT_SIZINGS,
      '100': DEFAULT_SIZINGS,
      '150': DEFAULT_SIZINGS,
      '200': DEFAULT_SIZINGS,
    }),
    []
  );

  const [sizingsByStack, setSizingsByStack] = useState<Record<StackDepth, BetSizings>>(() =>
    loadSizingsByStack(defaultByStack)
  );

  const currentSizings = useMemo(() => sizingsByStack[stackDepth] ?? DEFAULT_SIZINGS, [sizingsByStack, stackDepth]);

  const [editMode, setEditMode] = useState(false);

  const [stakePresets, setStakePresets] = useState<StakePreset[]>(() =>
    loadJsonStakePresets(STORAGE_STAKE_PRESETS, DEFAULT_STAKE_PRESETS)
  );
  const [selectedStakePresetName, setSelectedStakePresetName] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_SELECTED_STAKE_PRESET) || DEFAULT_STAKE_PRESET_NAME;
    } catch {
      return DEFAULT_STAKE_PRESET_NAME;
    }
  });

  const selectedStakePreset = useMemo<StakePreset>(() => {
    const found = stakePresets.find((p) => p.name === selectedStakePresetName);
    return found ?? stakePresets[0] ?? DEFAULT_STAKE_PRESETS[0];
  }, [stakePresets, selectedStakePresetName]);

  const [sbStr, setSbStr] = useState<string>(() => formatPlainNumber(selectedStakePreset.sb));
  const [bbStr, setBbStr] = useState<string>(() => formatPlainNumber(selectedStakePreset.bb));
  const [anteStr, setAnteStr] = useState<string>(() => formatPlainNumber(selectedStakePreset.ante));
  const [stakePresetNameStr, setStakePresetNameStr] = useState<string>(() => selectedStakePreset.name);

  const [srpPotBlindsStr, setSrpPotBlindsStr] = useState<string>(() => {
    const n = loadOptionalNumber(STORAGE_SRP_POT_BLINDS, 6.5);
    return formatPlainNumber(n);
  });
  const [threeBetPotBlindsStr, setThreeBetPotBlindsStr] = useState<string>(() => {
    const n = loadOptionalNumber(STORAGE_3B_POT_BLINDS, 20);
    return formatPlainNumber(n);
  });
  const [fourBetPotBlindsStr, setFourBetPotBlindsStr] = useState<string>(() => {
    const n = loadOptionalNumber(STORAGE_4B_POT_BLINDS, 40);
    return formatPlainNumber(n);
  });
  const [fiveBetPotBlindsStr, setFiveBetPotBlindsStr] = useState<string>(() => {
    const n = loadOptionalNumber(STORAGE_5B_POT_BLINDS, 60);
    return formatPlainNumber(n);
  });

  useEffect(() => {
    saveJsonStakePresets(STORAGE_STAKE_PRESETS, stakePresets);
  }, [stakePresets]);

  useEffect(() => {
    saveSizingsByStack(sizingsByStack);
  }, [sizingsByStack]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SELECTED_STACK_TAB, stackDepth);
    } catch {
      // ignore
    }
  }, [stackDepth]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SELECTED_STAKE_PRESET, selectedStakePresetName);
    } catch {
      // ignore
    }
  }, [selectedStakePresetName]);

  useEffect(() => {
    setSbStr(formatPlainNumber(selectedStakePreset.sb));
    setBbStr(formatPlainNumber(selectedStakePreset.bb));
    setAnteStr(formatPlainNumber(selectedStakePreset.ante));
    setStakePresetNameStr(selectedStakePreset.name);
  }, [selectedStakePreset]);

  const bbNum = useMemo(() => parseOptionalNumber(bbStr), [bbStr]);
  const sbNum = useMemo(() => parseOptionalNumber(sbStr), [sbStr]);
  const anteNum = useMemo(() => parseOptionalNumber(anteStr), [anteStr]);
  const srpPotBlindsNum = useMemo(() => parseOptionalNumber(srpPotBlindsStr), [srpPotBlindsStr]);
  const threeBetPotBlindsNum = useMemo(() => parseOptionalNumber(threeBetPotBlindsStr), [threeBetPotBlindsStr]);
  const fourBetPotBlindsNum = useMemo(() => parseOptionalNumber(fourBetPotBlindsStr), [fourBetPotBlindsStr]);
  const fiveBetPotBlindsNum = useMemo(() => parseOptionalNumber(fiveBetPotBlindsStr), [fiveBetPotBlindsStr]);

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

  const copyBbMultiple = useCallback(
    (multiple: number) => {
      if (bbNum == null || bbNum <= 0) {
        onError('Enter a valid BB amount first.');
        return;
      }
      const value = bbNum * multiple;
      void copyText(formatPlainNumber(value));
    },
    [bbNum, copyText, onError]
  );

  const handleCopyBbThreeBetSize = useCallback(
    (threeBetSizeBb: number) => {
      copyBbMultiple(threeBetSizeBb);
      // Auto-set 3-bet pot (in blinds) as 2x 3-bet size + 0.5 (antes).
      const nextPotBlinds = 2 * threeBetSizeBb + 0.5;
      setThreeBetPotBlindsStr(formatPlainNumber(nextPotBlinds));
    },
    [copyBbMultiple]
  );

  const handleCopySbFourBetSize = useCallback(
    (fourBetSizeBb: number) => {
      copyBbMultiple(fourBetSizeBb);
      // Auto-set 4-bet pot (in blinds) similar to 3-bet: 2x 4-bet size + 0.5 (antes).
      const nextPotBlinds = 2 * fourBetSizeBb + 0.5;
      setFourBetPotBlindsStr(formatPlainNumber(nextPotBlinds));
    },
    [copyBbMultiple]
  );

  const handleCopyBbFiveBetToSize = useCallback(
    (fiveBetToBb: number) => {
      copyBbMultiple(fiveBetToBb);
      // Auto-set 5-bet pot (in blinds) similar to 3-bet/4-bet helpers.
      const nextPotBlinds = 2 * fiveBetToBb + 0.5;
      setFiveBetPotBlindsStr(formatPlainNumber(nextPotBlinds));
    },
    [copyBbMultiple]
  );

  const setSrpPotFromOpenSize = useCallback(
    (openSizeBb: number) => {
      if (bbNum == null || bbNum <= 0) {
        onError('Enter a valid BB amount first.');
        return;
      }
      if (anteNum == null || anteNum < 0) {
        onError('Enter a valid ante first.');
        return;
      }
      const anteInBlinds = anteNum / bbNum;
      const nextPotBlinds = openSizeBb * 2 + 2 * anteInBlinds;
      setSrpPotBlindsStr(formatPlainNumber(nextPotBlinds));
    },
    [anteNum, bbNum, onError]
  );

  const handleCopySbOpenSize = useCallback(
    (openSizeBb: number) => {
      copyBbMultiple(openSizeBb);
      setSrpPotFromOpenSize(openSizeBb);
    },
    [copyBbMultiple, setSrpPotFromOpenSize]
  );

  const copyPotPctFromBlinds = useCallback(
    (potBlinds: number | null, pct: number) => {
      if (bbNum == null || bbNum <= 0) {
        onError('Enter a valid BB amount first.');
        return;
      }
      if (potBlinds == null || potBlinds <= 0) {
        onError('Enter a valid pot (in blinds) first.');
        return;
      }
      const value = (potBlinds * (pct / 100)) * bbNum;
      void copyText(formatPlainNumber(value));
    },
    [bbNum, copyText, onError]
  );

  const saveOrUpdatePreset = useCallback(() => {
    const name = stakePresetNameStr.trim();
    if (!name) {
      onError('Enter a preset name.');
      return;
    }
    if (bbNum == null || bbNum <= 0) {
      onError('BB must be > 0.');
      return;
    }
    if (sbNum == null || sbNum < 0) {
      onError('SB must be ≥ 0.');
      return;
    }
    if (anteNum == null || anteNum < 0) {
      onError('Ante must be ≥ 0.');
      return;
    }
    const next: StakePreset = { name, sb: sbNum, bb: bbNum, ante: anteNum };
    setStakePresets((prev) => {
      const others = prev.filter((p) => p.name !== name);
      return [...others, next].sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelectedStakePresetName(name);
    onSuccess(`Saved preset "${name}".`);
  }, [anteNum, bbNum, onError, onSuccess, sbNum, stakePresetNameStr]);

  const deletePreset = useCallback(() => {
    const name = selectedStakePreset.name;
    if (name === DEFAULT_STAKE_PRESET_NAME) {
      onError('Cannot delete the default preset.');
      return;
    }
    setStakePresets((prev) => prev.filter((p) => p.name !== name));
    setSelectedStakePresetName(DEFAULT_STAKE_PRESET_NAME);
    onSuccess(`Deleted preset "${name}".`);
  }, [onError, onSuccess, selectedStakePreset.name]);

  const resetCurrentTabSizings = useCallback(() => {
    setSizingsByStack((prev) => ({ ...prev, [stackDepth]: DEFAULT_SIZINGS }));
    onSuccess('Reset sizings to defaults for this tab.');
  }, [onSuccess, stackDepth]);

  const updateCurrentSizings = useCallback(
    (patch: Partial<BetSizings>) => {
      setSizingsByStack((prev) => {
        const cur = prev[stackDepth] ?? DEFAULT_SIZINGS;
        return { ...prev, [stackDepth]: { ...cur, ...patch } };
      });
      onSuccess('Saved.');
    },
    [onSuccess, stackDepth]
  );

  useEffect(() => {
    if (srpPotBlindsNum != null && srpPotBlindsNum > 0) {
      saveOptionalNumber(STORAGE_SRP_POT_BLINDS, srpPotBlindsNum);
    }
  }, [srpPotBlindsNum]);

  useEffect(() => {
    if (threeBetPotBlindsNum != null && threeBetPotBlindsNum > 0) {
      saveOptionalNumber(STORAGE_3B_POT_BLINDS, threeBetPotBlindsNum);
    }
  }, [threeBetPotBlindsNum]);

  useEffect(() => {
    if (fourBetPotBlindsNum != null && fourBetPotBlindsNum > 0) {
      saveOptionalNumber(STORAGE_4B_POT_BLINDS, fourBetPotBlindsNum);
    }
  }, [fourBetPotBlindsNum]);

  useEffect(() => {
    if (fiveBetPotBlindsNum != null && fiveBetPotBlindsNum > 0) {
      saveOptionalNumber(STORAGE_5B_POT_BLINDS, fiveBetPotBlindsNum);
    }
  }, [fiveBetPotBlindsNum]);

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
        slotProps={{ paper: { sx: { p: 1.5, maxWidth: 900, width: 'min(900px, calc(100vw - 24px))' } } }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
          Bet clipboard
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Copies plain numbers only (no “bb” suffix). Bet sizes are converted using your BB amount.
        </Typography>

        <Stack spacing={1.25}>
          <Tabs
            value={stackDepth}
            onChange={(_, v) => {
              if (v === '50' || v === '100' || v === '150' || v === '200') setStackDepth(v);
            }}
            variant="fullWidth"
            sx={{ mb: 0.25 }}
          >
            {STACK_DEPTHS.map((d) => (
              <Tab key={d.value} value={d.value} label={d.label} />
            ))}
          </Tabs>

          <Accordion defaultExpanded={false} disableGutters elevation={0} sx={{ bgcolor: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  Settings
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {`${selectedStakePreset.name} • SB ${formatPlainNumber(selectedStakePreset.sb)} / BB ${formatPlainNumber(
                    selectedStakePreset.bb
                  )} • Ante ${formatPlainNumber(selectedStakePreset.ante)}`}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Stakes preset
                </Typography>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                    <InputLabel id="stake-preset-select-label">Preset</InputLabel>
                    <Select
                      labelId="stake-preset-select-label"
                      label="Preset"
                      value={selectedStakePreset.name}
                      onChange={(e) => setSelectedStakePresetName(String(e.target.value))}
                    >
                      {stakePresets.map((p) => (
                        <MenuItem key={p.name} value={p.name}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button size="small" variant="outlined" onClick={deletePreset} sx={{ mt: 0.25 }}>
                    Delete
                  </Button>
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    label="SB"
                    value={sbStr}
                    onChange={(e) => setSbStr(e.target.value)}
                    inputProps={{ inputMode: 'decimal' }}
                  />
                  <TextField
                    size="small"
                    label="BB"
                    value={bbStr}
                    onChange={(e) => setBbStr(e.target.value)}
                    inputProps={{ inputMode: 'decimal' }}
                  />
                  <TextField
                    size="small"
                    label="Ante"
                    value={anteStr}
                    onChange={(e) => setAnteStr(e.target.value)}
                    inputProps={{ inputMode: 'decimal' }}
                  />
                </Box>
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1 }}>
                  <TextField
                    size="small"
                    label="Preset name"
                    value={stakePresetNameStr}
                    onChange={(e) => setStakePresetNameStr(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button size="small" variant="contained" onClick={saveOrUpdatePreset} sx={{ mt: 0.25 }}>
                    Save
                  </Button>
                </Stack>
                {(sbNum != null || bbNum != null || anteNum != null) && (
                  <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip size="small" label={`SB ${formatPlainNumber(sbNum ?? 0)}`} />
                    <Chip size="small" label={`BB ${formatPlainNumber(bbNum ?? 0)}`} />
                    <Chip size="small" label={`Ante ${formatPlainNumber(anteNum ?? 0)}`} />
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Sizings for {STACK_DEPTHS.find((d) => d.value === stackDepth)?.label ?? `${stackDepth}bb`}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" onClick={resetCurrentTabSizings}>
                      Reset
                    </Button>
                  </Stack>

                  <FormControlLabel
                    control={<Switch checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />}
                    label={<Typography variant="caption">Edit mode</Typography>}
                    sx={{ ml: 0 }}
                  />

                  {editMode && (
                    <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                      <ChipNumberListEditor
                        label="SB open sizes (buttons, bb)"
                        values={currentSizings.sbOpenSizes}
                        onChange={(next) => updateCurrentSizings({ sbOpenSizes: next })}
                      />
                      <ChipNumberListEditor
                        label="BB vs open (text, bb)"
                        values={currentSizings.bbVsOpen}
                        onChange={(next) => updateCurrentSizings({ bbVsOpen: next })}
                      />
                      <ChipNumberListEditor
                        label="BB 3-bet sizes (buttons, bb)"
                        values={currentSizings.bbThreeBetSizes}
                        onChange={(next) => updateCurrentSizings({ bbThreeBetSizes: next })}
                      />
                      <ChipNumberListEditor
                        label="SB vs 3-bet (text, bb)"
                        values={currentSizings.sbVs3Bet}
                        onChange={(next) => updateCurrentSizings({ sbVs3Bet: next })}
                      />
                      <ChipNumberListEditor
                        label="SB 4-bet sizes (buttons, bb)"
                        values={currentSizings.sbFourBetSizes}
                        onChange={(next) => updateCurrentSizings({ sbFourBetSizes: next })}
                      />
                      <ChipNumberListEditor
                        label="C-bet SRP (buttons, %)"
                        values={currentSizings.cbetSrpPcts}
                        onChange={(next) => updateCurrentSizings({ cbetSrpPcts: next })}
                      />
                      <ChipNumberListEditor
                        label="C-bet 3-bet pots (buttons, %)"
                        values={currentSizings.cbet3BetPcts}
                        onChange={(next) => updateCurrentSizings({ cbet3BetPcts: next })}
                      />
                      <ChipNumberListEditor
                        label="C-bet 4-bet pots (buttons, %)"
                        values={currentSizings.cbet4BetPcts}
                        onChange={(next) => updateCurrentSizings({ cbet4BetPcts: next })}
                      />
                      <ChipNumberListEditor
                        label="C-bet 5-bet pots (buttons, %)"
                        values={currentSizings.cbet5BetPcts}
                        onChange={(next) => updateCurrentSizings({ cbet5BetPcts: next })}
                      />
                    </Stack>
                  )}
                </Stack>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Divider />

          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'stretch' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                SB
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Open size
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
                {currentSizings.sbOpenSizes.map((m) => (
                  <Button key={m} size="small" variant="outlined" onClick={() => handleCopySbOpenSize(m)}>
                    {`${formatPlainNumber(m)}bb`}
                  </Button>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, mb: 0.25 }}>
                vs 3-bet
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5 }}>
                {currentSizings.sbVs3Bet.map((n) => (
                  <Box key={n} sx={{ textAlign: 'center', fontSize: 12, color: 'text.secondary' }}>
                    {formatPlainNumber(n)}
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, mb: 0.25 }}>
                4-bet size
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5 }}>
                {currentSizings.sbFourBetSizes.map((m) => (
                  <Button key={m} size="small" variant="outlined" onClick={() => handleCopySbFourBetSize(m)}>
                    {formatPlainNumber(m)}
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                BB
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                vs open
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
                {currentSizings.bbVsOpen.map((n) => (
                  <Box key={n} sx={{ textAlign: 'center', fontSize: 12, color: 'text.secondary' }}>
                    {formatPlainNumber(n)}
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, mb: 0.25 }}>
                3-bet size
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
                {currentSizings.bbThreeBetSizes.map((m) => (
                  <Button key={m} size="small" variant="outlined" onClick={() => handleCopyBbThreeBetSize(m)}>
                    {`${formatPlainNumber(m)}bb`}
                  </Button>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, mb: 0.25 }}>
                vs 4-bet
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
                {currentSizings.bbVs4Bet.map((n, idx) =>
                  n == null ? (
                    <Box key={`dash-${idx}`} sx={{ textAlign: 'center', fontSize: 12, color: 'text.secondary' }}>
                      —
                    </Box>
                  ) : (
                    <Box key={n} sx={{ textAlign: 'center', fontSize: 12, color: 'text.secondary' }}>
                      {formatPlainNumber(n)}
                    </Box>
                  )
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, mb: 0.25 }}>
                5-bet to
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
                {currentSizings.bbFiveBetTo.map((n, idx) =>
                  n == null ? (
                    <Box key={`blank-${idx}`} />
                  ) : (
                    <Button key={n} size="small" variant="outlined" onClick={() => handleCopyBbFiveBetToSize(n)}>
                      {formatPlainNumber(n)}
                    </Button>
                  )
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'stretch' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={1.25}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    C-bet (single-raised pots)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                    Pot is in blinds (default 6.5). Clicking a % copies pot × % × BB.
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                    <TextField
                      size="small"
                      label="SRP pot (blinds)"
                      value={srpPotBlindsStr}
                      onChange={(e) => setSrpPotBlindsStr(e.target.value)}
                      inputProps={{ inputMode: 'decimal' }}
                      sx={{ maxWidth: 170 }}
                    />
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentSizings.cbetSrpPcts.map((pct) => (
                      <Button
                        key={pct}
                        size="small"
                        variant="outlined"
                        onClick={() => copyPotPctFromBlinds(srpPotBlindsNum, pct)}
                      >
                        {`${pct}%`}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    C-bet (4-bet pots)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                    Clicking a % copies pot × % × BB. SB 4-bet sizes auto-fill the pot.
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                    <TextField
                      size="small"
                      label="4B pot (blinds)"
                      value={fourBetPotBlindsStr}
                      onChange={(e) => setFourBetPotBlindsStr(e.target.value)}
                      inputProps={{ inputMode: 'decimal' }}
                      sx={{ maxWidth: 170 }}
                    />
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentSizings.cbet4BetPcts.map((pct) => (
                      <Button
                        key={pct}
                        size="small"
                        variant="outlined"
                        onClick={() => copyPotPctFromBlinds(fourBetPotBlindsNum, pct)}
                      >
                        {`${pct}%`}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={1.25}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    C-bet (3-bet pots)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                    Pot is in blinds (default 20). Clicking a % copies pot × % × BB.
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                    <TextField
                      size="small"
                      label="3B pot (blinds)"
                      value={threeBetPotBlindsStr}
                      onChange={(e) => setThreeBetPotBlindsStr(e.target.value)}
                      inputProps={{ inputMode: 'decimal' }}
                      sx={{ maxWidth: 170 }}
                    />
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentSizings.cbet3BetPcts.map((pct) => (
                      <Button
                        key={pct}
                        size="small"
                        variant="outlined"
                        onClick={() => copyPotPctFromBlinds(threeBetPotBlindsNum, pct)}
                      >
                        {`${pct}%`}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    C-bet (5-bet pots)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                    Clicking a % copies pot × % × BB. BB 5-bet-to sizes auto-fill the pot.
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                    <TextField
                      size="small"
                      label="5B pot (blinds)"
                      value={fiveBetPotBlindsStr}
                      onChange={(e) => setFiveBetPotBlindsStr(e.target.value)}
                      inputProps={{ inputMode: 'decimal' }}
                      sx={{ maxWidth: 170 }}
                    />
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentSizings.cbet5BetPcts.map((pct) => (
                      <Button
                        key={pct}
                        size="small"
                        variant="outlined"
                        onClick={() => copyPotPctFromBlinds(fiveBetPotBlindsNum, pct)}
                      >
                        {`${pct}%`}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Stack>

      </Popover>
    </>
  );
}
