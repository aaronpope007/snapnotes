import Box from '@mui/material/Box';
import FcBModule from '@heruka_urgyen/react-playing-cards/lib/FcB';
// ESM/CommonJS interop: package may export { default } instead of component directly
const Card = (typeof FcBModule === 'function' ? FcBModule : (FcBModule as { default?: unknown }).default ?? FcBModule) as React.ComponentType<{ card: string; height?: string; front?: boolean; style?: React.CSSProperties }>;

interface CardImageProps {
  rank: string;
  suit: string | null;
  backdoor?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

const SUIT_COLORS: Record<string, string> = {
  h: '#e53935',
  d: '#1e88e5',
  c: '#43a047',
  s: '#757575',
};

// Overlay colors to tint the card face (white/beige -> suit color) via multiply blend
const SUIT_FACE_COLORS: Record<string, string> = {
  h: 'rgba(255, 215, 215, 0.9)',
  d: 'rgba(215, 230, 255, 0.9)',
  c: 'rgba(215, 255, 215, 0.9)',
  s: 'rgba(200, 200, 200, 0.85)',
};

const SIZES = { xs: { width: 25, height: 36 }, sm: { width: 42, height: 60 }, md: { width: 56, height: 80 } };
const PLACEHOLDER_FONT_SIZE: Record<keyof typeof SIZES, number> = { xs: 17, sm: 28, md: 36 };
const BACKDOOR_FONT_SIZE: Record<keyof typeof SIZES, number> = { xs: 7, sm: 10, md: 12 };

export function CardImage({
  rank,
  suit,
  backdoor = false,
  size = 'sm',
}: CardImageProps) {
  const { width, height } = SIZES[size];
  const heightPx = `${height}px`;
  const placeholderFontSize = PLACEHOLDER_FONT_SIZE[size];

  if (suit === null) {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width,
          height,
          border: '1px solid',
          borderColor: 'grey.500',
          borderRadius: '2px',
          bgcolor: 'grey.800',
          color: 'grey.400',
          fontSize: `${placeholderFontSize}px`,
          fontWeight: 'bold',
          mx: '1px',
          verticalAlign: 'middle',
        }}
      >
        ?
      </Box>
    );
  }

  const cardStr = `${rank}${suit}`;
  const suitColor = SUIT_COLORS[suit] ?? '#bdbdbd';
  const faceColor = SUIT_FACE_COLORS[suit] ?? 'rgba(189, 189, 189, 0.4)';

  const cardEl = (
    <Box
      component="span"
      sx={{
        position: 'relative',
        display: 'inline-flex',
        verticalAlign: 'middle',
        overflow: 'hidden',
        mx: '2px',
      }}
    >
      <Card
        card={cardStr}
        height={heightPx}
        front
        style={{
          width: 'auto',
          height: heightPx,
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
      <Box
        component="span"
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: faceColor,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
        aria-hidden
      />
    </Box>
  );

  if (backdoor) {
    return (
      <Box
        component="span"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          verticalAlign: 'middle',
        }}
      >
        {cardEl}
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: -2,
            right: 2,
            fontSize: `${BACKDOOR_FONT_SIZE[size]}px`,
            fontWeight: 'bold',
            color: suitColor,
            lineHeight: 1,
          }}
        >
          *
        </Box>
      </Box>
    );
  }

  return cardEl;
}
