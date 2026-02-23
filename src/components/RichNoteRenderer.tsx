import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { parseNoteTokens } from '../utils/cardParser';
import { CardImage } from './CardImage';

const EXPLOIT_COLOR = '#ffb74d';

interface RichNoteRendererProps {
  text: string;
}

function renderLine(line: string, isExploit: boolean): React.ReactNode {
  const tokens = parseNoteTokens(line);

  const content = tokens.map((token, i) => {
    if (token.type === 'card') {
      return (
        <CardImage
          key={i}
          rank={token.rank}
          suit={token.suit}
          backdoor={token.backdoor}
        />
      );
    }
    if (token.type === 'unknown_card') {
      return <CardImage key={i} rank="?" suit={null} />;
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

export function RichNoteRenderer({ text }: RichNoteRendererProps) {
  const content = useMemo(() => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, i) => (
      <span key={i}>
        {renderLine(line, line.startsWith('**') || line.startsWith('*'))}
        {i < lines.length - 1 ? '\n' : ''}
      </span>
    ));
  }, [text]);

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
