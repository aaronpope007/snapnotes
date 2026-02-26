import { useRef, useCallback, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { RichNoteRenderer } from './RichNoteRenderer';
import { HandHistoryCardPicker } from './HandHistoryCardPicker';
import { getUsedCardShorthands, getUsedUnknownCardCount } from '../utils/cardParser';

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
  /** Optional spoiler text; when provided with onSpoilerChange, spoiler section is shown and card picker inserts into focused field */
  spoilerValue?: string;
  onSpoilerChange?: (value: string) => void;
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
  spoilerValue = '',
  onSpoilerChange,
}: HandHistoryFormContentProps) {
  const contentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const contentSelectionRef = useRef({ start: 0, end: 0 });
  const spoilerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const spoilerSelectionRef = useRef({ start: 0, end: 0 });
  const activeFieldRef = useRef<'content' | 'spoiler'>('content');
  const [spoilerSectionOpen, setSpoilerSectionOpen] = useState(false);
  const hasSpoiler = onSpoilerChange !== undefined;

  const insertIntoContent = useCallback(
    (shorthand: string, wrapBackticks: boolean) => {
      const { start } = contentSelectionRef.current;
      const before = content.slice(0, start);
      const after = content.slice(start);
      const inserted = wrapBackticks ? `\`${shorthand}\`` : shorthand;
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

  const insertIntoSpoiler = useCallback(
    (shorthand: string, wrapBackticks: boolean) => {
      if (!onSpoilerChange) return;
      const { start } = spoilerSelectionRef.current;
      const before = spoilerValue.slice(0, start);
      const after = spoilerValue.slice(start);
      const inserted = wrapBackticks ? `\`${shorthand}\`` : shorthand;
      const next = before + inserted + after;
      onSpoilerChange(next);
      const newPos = start + inserted.length;
      spoilerSelectionRef.current = { start: newPos, end: newPos };
      setTimeout(() => {
        spoilerInputRef.current?.focus();
        spoilerInputRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [spoilerValue, onSpoilerChange]
  );

  const insertCardAtCursor = useCallback(
    (shorthand: string) => {
      if (activeFieldRef.current === 'spoiler' && hasSpoiler) {
        insertIntoSpoiler(shorthand, true);
      } else {
        insertIntoContent(shorthand, true);
      }
    },
    [hasSpoiler, insertIntoContent, insertIntoSpoiler]
  );

  const insertTextAtCursor = useCallback(
    (text: string) => {
      if (activeFieldRef.current === 'spoiler' && hasSpoiler) {
        insertIntoSpoiler(text, false);
      } else {
        insertIntoContent(text, false);
      }
    },
    [hasSpoiler, insertIntoContent, insertIntoSpoiler]
  );

  const removeCardFromContent = useCallback(
    (shorthand: string) => {
      const needle = `\`${shorthand}\``;
      if (activeFieldRef.current === 'spoiler' && hasSpoiler) {
        const cursor = spoilerSelectionRef.current.start;
        let index = spoilerValue.indexOf(needle);
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
          index = spoilerValue.indexOf(needle, index + 1);
        }
        onSpoilerChange!(spoilerValue.slice(0, bestIndex) + spoilerValue.slice(bestIndex + needle.length));
        spoilerSelectionRef.current = { start: bestIndex, end: bestIndex };
        setTimeout(() => {
          spoilerInputRef.current?.focus();
          spoilerInputRef.current?.setSelectionRange(bestIndex, bestIndex);
        }, 0);
      } else {
        const cursor = contentSelectionRef.current.start;
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
      }
    },
    [content, spoilerValue, onContentChange, onSpoilerChange, hasSpoiler]
  );

  const usedShorthands = useMemo(() => {
    const fromContent = getUsedCardShorthands(content);
    const fromSpoiler = hasSpoiler ? getUsedCardShorthands(spoilerValue) : new Set<string>();
    return new Set([...fromContent, ...fromSpoiler]);
  }, [content, spoilerValue, hasSpoiler]);

  const usedUnknownCardCount =
    (getUsedUnknownCardCount(content) + (hasSpoiler ? getUsedUnknownCardCount(spoilerValue) : 0)) | 0;

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
            onFocus={() => { activeFieldRef.current = 'content'; }}
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

          {hasSpoiler && (
            <Box sx={{ mt: 1 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setSpoilerSectionOpen((o) => !o)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  p: 0,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
                aria-expanded={spoilerSectionOpen}
              >
                {spoilerSectionOpen ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Spoiler (optional)
                </Typography>
              </Box>
              <Collapse in={spoilerSectionOpen}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  maxRows={6}
                  placeholder="Hidden info — click a card on the right to insert at cursor"
                  value={spoilerValue}
                  onChange={(e) => onSpoilerChange!(e.target.value)}
                  onFocus={() => { activeFieldRef.current = 'spoiler'; }}
                  onSelect={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    spoilerSelectionRef.current = { start: t.selectionStart ?? 0, end: t.selectionEnd ?? 0 };
                  }}
                  onBlur={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    spoilerSelectionRef.current = { start: t.selectionStart ?? 0, end: t.selectionEnd ?? 0 };
                  }}
                  inputRef={spoilerInputRef}
                  sx={{
                    mt: 0.5,
                    '& .MuiInputBase-root': { bgcolor: 'grey.900' },
                    '& .MuiInputBase-input': {
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: 'text.secondary',
                    },
                  }}
                  slotProps={{
                    input: { 'aria-label': 'Spoiler text (backtick codes)' },
                  }}
                />
              </Collapse>
            </Box>
          )}
        </Box>
      </Box>
      <HandHistoryCardPicker
        onInsertCard={insertCardAtCursor}
        onInsertText={insertTextAtCursor}
        onRemoveCard={removeCardFromContent}
        usedShorthands={usedShorthands}
        usedUnknownCardCount={usedUnknownCardCount}
      />
    </Box>
  );
}
