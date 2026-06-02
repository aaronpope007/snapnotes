import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import { useCompactMode } from '../../context/CompactModeContext';
import { GtoDrillFacetFilters } from './GtoDrillFacetFilters';
import {
  isGtoDrillFacetFiltersActive,
  type GtoDrillFacetFilters as GtoDrillFacetFiltersState,
} from '../../utils/gtoDrillFilter';

export type GtoDrillListView = 'active' | 'archived';

interface GtoStudyTabsProps {
  listView: GtoDrillListView;
  onListViewChange: (view: GtoDrillListView) => void;
  filterQuery: string;
  onFilterChange: (value: string) => void;
  facetFilters: GtoDrillFacetFiltersState;
  onFacetFiltersChange: (value: GtoDrillFacetFiltersState) => void;
  facetFilterResetKey: number;
  onClearAllFilters: () => void;
  onLog: () => void;
  onOpenRecent: () => void;
  onNewDrill: () => void;
  drillCount?: number;
  loading?: boolean;
}

export function GtoStudyTabs({
  listView,
  onListViewChange,
  filterQuery,
  onFilterChange,
  facetFilters,
  onFacetFiltersChange,
  facetFilterResetKey,
  onClearAllFilters,
  onLog,
  onOpenRecent,
  onNewDrill,
  drillCount,
  loading = false,
}: GtoStudyTabsProps) {
  const compact = useCompactMode();
  const isFiltered =
    filterQuery.trim() !== '' || isGtoDrillFacetFiltersActive(facetFilters);

  return (
    <Box sx={{ mb: compact ? 1 : 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: compact ? 0.75 : 1,
        }}
      >
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        sx={{ fontWeight: 600, fontSize: compact ? '0.85rem' : undefined, flexShrink: 0 }}
      >
        GTO Study
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={listView}
        onChange={(_, value: GtoDrillListView | null) => {
          if (value) onListViewChange(value);
        }}
        aria-label="Drill list view"
        sx={{ flexShrink: 0 }}
      >
        <ToggleButton value="active" aria-label="Active drills">
          Active
        </ToggleButton>
        <ToggleButton value="archived" aria-label="Archived drills">
          Archived
        </ToggleButton>
      </ToggleButtonGroup>
      <TextField
        size="small"
        placeholder="Filter drills..."
        value={filterQuery}
        onChange={(e) => onFilterChange(e.target.value)}
        sx={{
          flex: '1 1 140px',
          minWidth: 120,
          maxWidth: 220,
          '& .MuiInputBase-root': {
            typography: compact ? 'caption' : 'body2',
          },
        }}
        inputProps={{ 'aria-label': 'Filter drills' }}
        InputProps={{
          endAdornment:
            filterQuery.trim() !== '' ? (
              <InputAdornment position="end" sx={{ ml: -0.5 }}>
                <IconButton edge="end" size="small" onClick={onClearAllFilters} aria-label="Clear filter">
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
        }}
      />
      {drillCount != null && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          title={isFiltered ? 'Drills matching filter' : 'Total drills'}
        >
          {loading
            ? '…'
            : `${drillCount} ${drillCount === 1 ? 'drill' : 'drills'}${
                isFiltered ? ' matching' : ''
              }`}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<HistoryIcon sx={{ fontSize: '1rem !important' }} />}
          onClick={onOpenRecent}
        >
          Recent
        </Button>
        <Button variant="outlined" size="small" onClick={onNewDrill}>
          New Drill
        </Button>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onLog}>
          Log
        </Button>
      </Box>
      </Box>
      <Box sx={{ mt: 0.75 }}>
        <GtoDrillFacetFilters
          key={facetFilterResetKey}
          value={facetFilters}
          onChange={onFacetFiltersChange}
          filtersActive={isFiltered}
          onClearAll={onClearAllFilters}
        />
      </Box>
    </Box>
  );
}
