import { useMemo } from 'react';
import Box from '@mui/material/Box';

interface NoteDisplayProps {
  notes: string;
}

function highlightObservations(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**')) {
      return (
        <Box
          key={i}
          component="span"
          sx={{
            color: '#ffb74d',
            fontWeight: 600,
          }}
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

export function NoteDisplay({ notes }: NoteDisplayProps) {
  const content = useMemo(
    () => (notes ? highlightObservations(notes) : null),
    [notes]
  );

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
