import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import {
  GTO_8MAX_POSITIONS,
  GTO_ENDS_AFTER_LABELS,
  GTO_ENDS_AFTER_OPTIONS,
  GTO_FORMAT_LABELS,
  GTO_HAND_START_OPTIONS,
  GTO_HU_POSITIONS,
  GTO_POT_TYPE_LABELS,
  GTO_POT_TYPE_OPTIONS,
  GTO_SOLVER_OPTIONS,
  GTO_STACK_OPTIONS,
  GTO_STREET_OPTIONS,
} from '../../constants/gtoStudy';
import type { GtoDrillFacetFilters } from '../../utils/gtoDrillFilter';
import type { GtoFormat } from '../../types/gtoStudy';

interface GtoDrillFacetFiltersProps {
  value: GtoDrillFacetFilters;
  onChange: (value: GtoDrillFacetFilters) => void;
  filtersActive: boolean;
  onClearAll: () => void;
}

type FacetKey = keyof GtoDrillFacetFilters;

interface FacetGroup {
  key: FacetKey;
  label: string;
  options: { value: string; label: string }[];
}

const FACET_POSITION_OPTIONS = [...new Set([...GTO_8MAX_POSITIONS, ...GTO_HU_POSITIONS])].map(
  (p) => ({ value: p, label: p })
);

const FACET_GROUPS: FacetGroup[] = [
  {
    key: 'format',
    label: 'Format',
    options: (Object.keys(GTO_FORMAT_LABELS) as GtoFormat[]).map((f) => ({
      value: f,
      label: GTO_FORMAT_LABELS[f],
    })),
  },
  {
    key: 'stack',
    label: 'Stacks',
    options: [...new Set([...GTO_STACK_OPTIONS.HU, ...GTO_STACK_OPTIONS['8max']])].map((s) => ({
      value: s,
      label: s,
    })),
  },
  {
    key: 'handStart',
    label: 'Starts',
    options: GTO_HAND_START_OPTIONS.map((h) => ({ value: h, label: h })),
  },
  {
    key: 'street',
    label: 'Street',
    options: GTO_STREET_OPTIONS.map((s) => ({ value: s, label: s })),
  },
  {
    key: 'potType',
    label: 'Pot',
    options: GTO_POT_TYPE_OPTIONS.map((p) => ({
      value: p,
      label: GTO_POT_TYPE_LABELS[p],
    })),
  },
  {
    key: 'heroPosition',
    label: 'Hero',
    options: FACET_POSITION_OPTIONS,
  },
  {
    key: 'villainPosition',
    label: 'Villain',
    options: FACET_POSITION_OPTIONS,
  },
  {
    key: 'endsAfter',
    label: 'Ends',
    options: GTO_ENDS_AFTER_OPTIONS.map((e) => ({
      value: e,
      label: GTO_ENDS_AFTER_LABELS[e],
    })),
  },
  {
    key: 'solver',
    label: 'Solver',
    options: GTO_SOLVER_OPTIONS.map((s) => ({ value: s, label: s })),
  },
];

function toggleFacetValue<T extends string>(
  selected: T[],
  value: T
): T[] {
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}

export function GtoDrillFacetFilters({
  value,
  onChange,
  filtersActive,
  onClearAll,
}: GtoDrillFacetFiltersProps) {
  const patchGroup = (key: FacetKey, next: string[]) => {
    onChange({ ...value, [key]: [...next] });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {FACET_GROUPS.map((group) => (
        <Box
          key={group.key}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.25,
            mb: 0.375,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ minWidth: 44, flexShrink: 0, fontWeight: 600, lineHeight: 1.4 }}
          >
            {group.label}
          </Typography>
          {group.options.map((opt) => {
            const selected = value[group.key] as string[];
            const checked = selected.includes(opt.value);
            return (
              <FormControlLabel
                key={`${group.key}-${opt.value}`}
                control={
                  <Checkbox
                    size="small"
                    checked={checked}
                    onChange={() =>
                      patchGroup(group.key, toggleFacetValue([...selected], opt.value))
                    }
                    sx={{ p: 0.25 }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
                    {opt.label}
                  </Typography>
                }
                sx={{ m: 0, mr: 0.375 }}
              />
            );
          })}
        </Box>
      ))}
      {filtersActive && (
        <Button
          size="small"
          color="inherit"
          onClick={onClearAll}
          sx={{
            mt: 0.25,
            p: 0,
            minWidth: 0,
            textTransform: 'none',
            fontSize: '0.75rem',
            color: 'text.secondary',
          }}
        >
          Clear filters
        </Button>
      )}
    </Box>
  );
}
