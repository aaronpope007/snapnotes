import { useState, useCallback } from 'react';
import Button from '@mui/material/Button';

/** Interpolate background color: 1 = reddest, 99–100 = passive grey. */
function getRngButtonBgColor(value: number | null): string | undefined {
  if (value === null) return undefined;
  const t = Math.max(0, Math.min(1, (value - 1) / 98)); // 1→0, 99→1
  const [r1, g1, b1] = [0xb7, 0x1c, 0x1c]; // red
  const [r2, g2, b2] = [0x42, 0x42, 0x42]; // passive grey
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function RngButton() {
  const [rngValue, setRngValue] = useState<number | null>(null);
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRngValue(Math.floor(Math.random() * 100) + 1);
  }, []);

  const bgColor = getRngButtonBgColor(rngValue);
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={handleClick}
      aria-label="Random number 1-100"
      sx={{
        minWidth: 44,
        px: 1,
        ...(bgColor && {
          backgroundColor: bgColor,
          '&:hover': { backgroundColor: bgColor },
        }),
      }}
    >
      {rngValue ?? 'RNG'}
    </Button>
  );
}
