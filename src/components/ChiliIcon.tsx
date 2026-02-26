import Box from '@mui/material/Box';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { CHILI_COLOR } from '../constants/ratings';

interface ChiliIconProps {
  size?: number;
  filled?: boolean;
  /** Inline mode for text context (e.g. ratings summary) */
  inline?: boolean;
}

/** Flame icon for spicy rating - color directly with CHILI_COLOR */
export function ChiliIcon({ size = 14, filled = true, inline }: ChiliIconProps) {
  const color = filled ? CHILI_COLOR : 'rgba(255, 255, 255, 0.35)';
  const svg = (
    <LocalFireDepartmentIcon
      sx={{
        fontSize: size,
        color,
      }}
    />
  );
  if (inline) {
    return (
      <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', mr: 0.25 }}>
        {svg}
      </Box>
    );
  }
  return svg;
}
