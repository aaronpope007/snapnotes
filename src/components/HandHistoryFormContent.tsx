import { useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { RichNoteRenderer } from './RichNoteRenderer';
import { HandHistoryCardPicker } from './HandHistoryCardPicker';
import { getUsedCardShorthands } from '../utils/cardParser';

const DEFAULT_CONTENT_LABEL = 'Content';
const DEFAULT_PLACEHOLDER = 'Paste hand history… Click a card on the right to insert at cursor';

export interface HandHistoryFormContentProps {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  /** Label for the content field, e.g. "Content" or "Hand text" */
  contentLabel?: string;
  /** Placeholder when content is empty */
  placeholder?: string;
  /** Whether the content field is required (e.g. for add hand for review) */
  contentRequired?: boolean;
  /** Card size in the preview */
  cardSize?: 'xxs' | 'xs' | 'sm' | 'md';
}

export function HandHistoryFormContent({
  title,
  onTitleChange,
  content,
  onContentChange,
  contentLabel = DEFAULT_CONTENT_LABEL,
  placeholder = DEFAULT_PLACEHOLDER,
  contentRequired = false,
  cardSize = 'xs',
}: HandHistoryFormContentProps) {
  const contentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const contentSelectionRef = useRef({ start: 0, end: 0 });

  const insertCardAtCursor = useCallback(
    (shorthand: string) => {
      const { start } = contentSelectionRef.current;
      const before = content.slice(0, start);
      const after = content.slice(start);
      const inserted = `\`${shorthand}\``;
      const next = before + inserted + after;
      onContentChange(next);
      const newPos = start + inserted.length;
      contentSelectionRef.current = { start: newPos, end: newPos };
      setTimeout(() => {
        contentInputRef.current?.focus();
        contentInputRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [content, onContentChange]
  );

  const insertTextAtCursor = useCallback(
    (text: string) => {
      const { start } = contentSelectionRef.current;
      const before = content.slice(0, start);
      const after = content.slice(start);
      const next = before + text + after;
      onContentChange(next);
      const newPos = start + text.length;
      contentSelectionRef.current = { start: newPos, end: newPos };
      setTimeout(() => {
        contentInputRef.current?.focus();
        contentInputRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [content, onContentChange]
  );

  const removeCardFromContent = useCallback(
    (shorthand: string) => {
      const cursor = contentSelectionRef.current.start;
      const needle = `\`${shorthand}\``;
      let index = content.indexOf(needle);
      if (index === -1) return;
      let bestIndex = index;
      let bestDist = Math.min(
        Math.abs(cursor - index),
        Math.abs(cursor - (index + needle.length))
      );
      while (index !== -1) {
        const dist = Math.min(
          Math.abs(cursor - index),
          Math.abs(cursor - (index + needle.length))
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = index;
        }
        index = content.indexOf(needle, index + 1);
      }
      const next = content.slice(0, bestIndex) + content.slice(bestIndex + needle.length);
      onContentChange(next);
      contentSelectionRef.current = { start: bestIndex, end: bestIndex };
      setTimeout(() => {
        contentInputRef.current?.focus();
        contentInputRef.current?.setSelectionRange(bestIndex, bestIndex);
      }, 0);
    },
    [content, onContentChange]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        alignItems: 'flex-start',
        flex: 1,
        minWidth: 0,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TextField
          fullWidth
          label="Title"
          placeholder="e.g. AK vs 3-bet"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          margin="normal"
          size="small"
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography
            component="label"
            variant="caption"
            sx={{
              display: 'block',
              mb: 0.5,
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            {contentLabel}
          </Typography>
          <Box
            onClick={() => contentInputRef.current?.focus()}
            sx={{
              flex: 1,
              minHeight: 100,
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              cursor: 'text',
              '&:hover': { borderColor: 'action.selected' },
              '&:focus-within': {
                borderColor: 'primary.main',
                borderWidth: 2,
                margin: '-1px',
              },
            }}
          >
            {content ? (
              <RichNoteRenderer text={content} cardSize={cardSize} />
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                {placeholder}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder=""
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onSelect={(e) => {
              const t = e.target as HTMLTextAreaElement;
              contentSelectionRef.current = { start: t.selectionStart ?? 0, end: t.selectionEnd ?? 0 };
            }}
            onBlur={(e) => {
              const t = e.target as HTMLTextAreaElement;
              contentSelectionRef.current = { start: t.selectionStart ?? 0, end: t.selectionEnd ?? 0 };
            }}
            inputRef={contentInputRef}
            margin="normal"
            size="small"
            required={contentRequired}
            sx={{
              mt: 1,
              '& .MuiInputBase-root': { bgcolor: 'grey.900' },
              '& .MuiInputBase-input': {
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: 'text.secondary',
              },
            }}
            slotProps={{
              input: { 'aria-label': 'Raw content (backtick codes)' },
            }}
          />
        </Box>
      </Box>
      <HandHistoryCardPicker
        onInsertCard={insertCardAtCursor}
        onInsertText={insertTextAtCursor}
        onRemoveCard={removeCardFromContent}
        usedShorthands={getUsedCardShorthands(content)}
      />
    </Box>
  );
}
