import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const MAX = 5;
const STAR_COUNT = 5;

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  onHoverChange?: (value: number | null) => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  onHoverChange,
  size = 'medium',
  disabled = false,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value ?? 0;

  const resolveValue = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const star = pct <= 0 ? 1 : Math.min(MAX, Math.ceil(pct * MAX));
      return Math.max(1, Math.min(MAX, star));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const v = resolveValue(e);
      setHoverValue(v);
      onHoverChange?.(v);
    },
    [disabled, resolveValue, onHoverChange]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
    onHoverChange?.(null);
  }, [onHoverChange]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onChange(resolveValue(e));
    },
    [disabled, onChange, resolveValue]
  );

  const starSize = size === 'small' ? 14 : 18;

  return (
    <Box
      component="div"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={MAX}
      aria-valuenow={value ?? 0}
      aria-label="Star rating"
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
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          borderRadius: 0.5,
        },
      }}
    >
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const filled = displayValue >= i + 1;
        return (
          <Box
            key={i}
            component="span"
            sx={{
              display: 'inline-flex',
              width: starSize,
              height: starSize,
              flexShrink: 0,
            }}
          >
            {filled ? (
              <StarIcon sx={{ fontSize: starSize, color: 'warning.main' }} />
            ) : (
              <StarBorderIcon
                sx={{ fontSize: starSize, color: 'action.disabled' }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
