import { useEffect, useRef, useState, useCallback } from 'react';
import Button from '@mui/material/Button';

/** Gradient 1–100: aggressive (red) → passive (dark blue). */
const RNG_COLORS: [number, number, number][] = [
  [0xb7, 0x1c, 0x1c], // 1: red
  [0xef, 0x6c, 0x00], // 25: orange
  [0xff, 0xeb, 0x3b], // 50: yellow
  [0x4f, 0xc3, 0xf7], // 75: light blue
  [0x15, 0x65, 0xc0], // 100: dark blue
];

function getRandomRngValue(): number {
  return Math.floor(Math.random() * 100) + 1;
}

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

/** 1–25 red→orange, 26–50 orange→yellow, 51–75 yellow→light blue, 76–100 light blue→dark blue. */
function getRngButtonBgColor(value: number | null): string | undefined {
  if (value === null) return undefined;
  const v = Math.max(1, Math.min(100, value));
  let t: number;
  let i: number;
  if (v <= 25) {
    i = 0;
    t = (v - 1) / 24;
  } else if (v <= 50) {
    i = 1;
    t = (v - 26) / 24;
  } else if (v <= 75) {
    i = 2;
    t = (v - 51) / 24;
  } else {
    i = 3;
    t = (v - 76) / 24;
  }
  return lerpRgb(RNG_COLORS[i], RNG_COLORS[i + 1], t);
}

export function RngButton() {
  const [rngValue, setRngValue] = useState<number>(() => getRandomRngValue());
  const intervalRef = useRef<number | null>(null);

  const roll = useCallback(() => {
    setRngValue(getRandomRngValue());
  }, []);

  useEffect(() => {
    intervalRef.current = window.setInterval(roll, 5000);

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [roll]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    roll();
  }, [roll]);

  const bgColor = getRngButtonBgColor(rngValue);
  return (
    <Button
      variant="outlined"
      size="medium"
      onClick={handleClick}
      aria-label="Re-roll random number 1-100"
      sx={{
        minWidth: 72,
        minHeight: 40,
        px: 1.5,
        fontSize: '1.75rem',
        fontWeight: 600,
        color: '#000',
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
