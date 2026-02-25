import { useMemo, Fragment } from 'react';
import Box from '@mui/material/Box';
import { parseNoteTokens } from '../utils/cardParser';
import { CardImage } from './CardImage';

const EXPLOIT_COLOR = '#ffb74d';

type CardSize = 'xxs' | 'xs' | 'sm' | 'md';

interface RichNoteRendererProps {
  text: string;
  cardSize?: CardSize;
}

function renderLine(line: string, isExploit: boolean, cardSize: CardSize): React.ReactNode {
  const tokens = parseNoteTokens(line);

  const content = tokens.map((token, i) => {
    const prevIsCard =
      i > 0 &&
      (tokens[i - 1].type === 'card' || tokens[i - 1].type === 'unknown_card');
    const cardGap = prevIsCard ? { ml: 0.5 } : {};

    if (token.type === 'card') {
      return (
        <Box key={i} component="span" sx={{ display: 'inline-flex', ...cardGap }}>
          <CardImage
            rank={token.rank}
            suit={token.suit}
            backdoor={token.backdoor}
            size={cardSize}
          />
        </Box>
      );
    }
    if (token.type === 'unknown_card') {
      return (
        <Box key={i} component="span" sx={{ display: 'inline-flex', ...cardGap }}>
          <CardImage rank="?" suit={null} size={cardSize} />
        </Box>
      );
    }
    return <span key={i}>{token.value}</span>;
  });

  if (isExploit) {
    return (
      <Box
        component="span"
        sx={{ color: EXPLOIT_COLOR, fontWeight: 600 }}
      >
        {content}
      </Box>
    );
  }

  return <span>{content}</span>;
}

export function RichNoteRenderer({ text, cardSize = 'sm' }: RichNoteRendererProps) {
  const content = useMemo(() => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, i) => (
      <Fragment key={i}>
        <Box component="span" sx={{ display: 'block' }}>
          {renderLine(line, line.startsWith('**') || line.startsWith('*'), cardSize)}
        </Box>
        {i < lines.length - 1 && (
          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              my: 0.75,
            }}
          />
        )}
      </Fragment>
    ));
  }, [text, cardSize]);

  return (
    <Box
      sx={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        lineHeight: 1.6,
      }}
    >
      {content}
    </Box>
  );
}
