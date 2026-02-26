import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import { ChiliIcon } from './ChiliIcon';

const MAX = 5;
const STEP = 1; // whole numbers only

interface SpicyRatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export function SpicyRatingInput({
  value,
  onChange,
  size = 'medium',
  disabled = false,
}: SpicyRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value ?? 0;

  const resolveValue = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const raw = pct * MAX;
      const snapped = Math.round(raw / STEP) * STEP;
      return Math.max(0, Math.min(MAX, snapped));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      setHoverValue(resolveValue(e));
    },
    [disabled, resolveValue]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onChange(resolveValue(e));
    },
    [disabled, onChange, resolveValue]
  );

  const iconSize = size === 'small' ? 14 : 18;

  return (
    <Box
      component="div"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={MAX}
      aria-valuenow={value ?? 0}
      aria-label="Spicy rating"
      tabIndex={disabled ? -1 : 0}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
        gap: 0.25,
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          borderRadius: 0.5,
        },
      }}
    >
      {Array.from({ length: MAX }).map((_, i) => {
        const threshold = i + 1;
        const filled = displayValue >= threshold;
        return (
          <Box key={i} component="span" sx={{ display: 'inline-flex' }}>
            <ChiliIcon size={iconSize} filled={filled} />
          </Box>
        );
      })}
    </Box>
  );
}
