import Box from '@mui/material/Box';

interface CardImageProps {
  rank: string;
  suit: string | null;
  backdoor?: boolean;
  size?: 'xxs' | 'xs' | 'sm' | 'md';
}

const SUIT_COLORS: Record<string, string> = {
  h: '#e91e1e',
  d: '#2196f3',
  c: '#4caf50',
  s: '#757575',
};

const SUIT_SYMBOLS: Record<string, string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

const SIZES = {
  xxs: { width: 20, height: 29 },
  xs: { width: 25, height: 36 },
  sm: { width: 42, height: 60 },
  md: { width: 56, height: 80 },
};
const RANK_FONT_SIZE: Record<keyof typeof SIZES, number> = { xxs: 12, xs: 14, sm: 22, md: 30 };
const PLACEHOLDER_FONT_SIZE: Record<keyof typeof SIZES, number> = { xxs: 14, xs: 17, sm: 28, md: 36 };
const BACKDOOR_FONT_SIZE: Record<keyof typeof SIZES, number> = { xxs: 6, xs: 7, sm: 10, md: 12 };

/** Display rank as single character: A, K, Q, J, T, 9-2 (normalized from parser uppercase). */
function displayRank(rank: string): string {
  return rank.toUpperCase();
}

export function CardImage({
  rank,
  suit,
  backdoor = false,
  size = 'sm',
}: CardImageProps) {
  const { width, height } = SIZES[size];
  const placeholderFontSize = PLACEHOLDER_FONT_SIZE[size];
  const rankFontSize = RANK_FONT_SIZE[size];

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

  const suitColor = SUIT_COLORS[suit] ?? '#bdbdbd';
  const suitSymbol = SUIT_SYMBOLS[suit] ?? '';

  const cardEl = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        border: '1px solid',
        borderColor: 'grey.800',
        borderRadius: '4px',
        bgcolor: suitColor,
        color: '#000',
        fontSize: `${rankFontSize}px`,
        fontWeight: 'bold',
        lineHeight: 1.1,
        mx: '2px',
        verticalAlign: 'middle',
      }}
    >
      <span>{displayRank(rank)}</span>
      <span style={{ fontSize: rankFontSize * 0.7 }}>{suitSymbol}</span>
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
            color: '#000',
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
