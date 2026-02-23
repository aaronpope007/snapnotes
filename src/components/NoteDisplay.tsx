import { useMemo } from 'react';
import Box from '@mui/material/Box';

const EXPLOIT_COLOR = '#ffb74d';

interface NoteDisplayProps {
  text: string;
}

function highlightExploitLines(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') || line.startsWith('*')) {
      return (
        <Box
          key={i}
          component="span"
          sx={{ color: EXPLOIT_COLOR, fontWeight: 600 }}
        >
          {line}
          {i < lines.length - 1 ? '\n' : ''}
        </Box>
      );
    }
    return (
      <span key={i}>
        {line}
        {i < lines.length - 1 ? '\n' : ''}
      </span>
    );
  });
}

export function NoteDisplay({ text }: NoteDisplayProps) {
  const content = useMemo(() => (text ? highlightExploitLines(text) : null), [text]);

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
      {content || (
        <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          No notes yet.
        </Box>
      )}
    </Box>
  );
}
