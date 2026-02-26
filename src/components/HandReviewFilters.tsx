import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ChiliIcon } from './ChiliIcon';
import { STAR_COLOR } from '../constants/ratings';
import type { HandToReviewStatus } from '../types';

interface HandReviewFiltersProps {
  filter: 'all' | HandToReviewStatus;
  onFilterChange: (v: 'all' | HandToReviewStatus) => void;
  filterForMe: boolean;
  onFilterForMeChange: (v: boolean) => void;
  forMeCount: number;
  sortBy: 'star' | 'spicy';
  onSortByChange: (v: 'star' | 'spicy') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (v: 'asc' | 'desc') => void;
  onAddClick: () => void;
  onRefresh?: () => void;
}

export function HandReviewFilters({
  filter,
  onFilterChange,
  filterForMe,
  onFilterForMeChange,
  forMeCount,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onAddClick,
  onRefresh,
}: HandReviewFiltersProps) {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Hands to Review
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh} aria-label="Refresh hands">
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => v != null && onFilterChange(v)}
            size="small"
          >
            <ToggleButton value="open">Open</ToggleButton>
            <ToggleButton value="archived">Archived</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
          {forMeCount > 0 && (
            <Button
              variant={filterForMe ? 'contained' : 'outlined'}
              size="small"
              color={filterForMe ? 'primary' : 'inherit'}
              onClick={() => onFilterForMeChange(!filterForMe)}
              aria-label={`${forMeCount} hands tagged for you to review`}
            >
              For me (
              <Box component="span" sx={{ color: forMeCount > 0 ? 'error.main' : 'inherit' }}>
                {forMeCount}
              </Box>
              )
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddClick}
          >
            Add Hand
          </Button>
        </Box>
      </Box>

      {filter === 'all' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="sort-by-label">Sort by</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              label="Sort by"
              onChange={(e) => onSortByChange(e.target.value as 'star' | 'spicy')}
            >
              <MenuItem value="star">
                <Box component="span" sx={{ color: STAR_COLOR }}>★</Box> Star level
              </MenuItem>
              <MenuItem value="spicy">
                <ChiliIcon size={14} inline /> Spicy level
              </MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={sortOrder}
            exclusive
            onChange={(_, v) => v != null && onSortOrderChange(v)}
            size="small"
          >
            <ToggleButton value="asc" aria-label="Ascending">Asc</ToggleButton>
            <ToggleButton value="desc" aria-label="Descending">Desc</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </>
  );
}
