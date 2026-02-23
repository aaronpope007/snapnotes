import Box from '@mui/material/Box';
import { RichNoteRenderer } from './RichNoteRenderer';

interface NoteDisplayProps {
  text: string;
}

export function NoteDisplay({ text }: NoteDisplayProps) {
  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      {text ? (
        <RichNoteRenderer text={text} />
      ) : (
        <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.9rem' }}>
          No notes yet.
        </Box>
      )}
    </Box>
  );
}
