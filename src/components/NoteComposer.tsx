import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  Fragment,
} from 'react';
import Box from '@mui/material/Box';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { CardImage } from './CardImage';
import { useCompactMode } from '../context/CompactModeContext';
import {
  parseNoteToSegments,
  segmentsToNote,
  ensureEditableSegments,
  displayStateForEditing,
  insertCardAt,
  insertCardInTextSegment,
  insertTextAt,
  removeCardNear,
  updateTextSegment,
  removeSegmentAt,
  type NoteSegment,
  type DisplayNoteState,
} from '../utils/noteSegments';

const EXPLOIT_COLOR = '#ffb74d';

export interface NoteComposerHandle {
  insertCard: (shorthand: string) => void;
  insertText: (text: string) => void;
  removeCard: (shorthand: string) => void;
}

export interface NoteComposerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  minHeight?: number;
}

interface InsertContext {
  displayIndex: number;
  offset: number;
}

function isExploitText(value: string): boolean {
  return value.startsWith('**') || value.startsWith('*');
}

function textFieldStyle(seg: { value: string }): React.CSSProperties {
  return {
    display: 'inline-block',
    verticalAlign: 'middle',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    resize: 'none',
    padding: 0,
    margin: 0,
    font: 'inherit',
    lineHeight: 'inherit',
    color: isExploitText(seg.value) ? EXPLOIT_COLOR : 'inherit',
    fontWeight: isExploitText(seg.value) ? 600 : 'inherit',
    minWidth: 48,
    width: seg.value.includes('\n') ? '100%' : `${Math.max(seg.value.length, 1)}ch`,
    maxWidth: '100%',
  };
}

function displayToStoredIndex(displayIndex: number, state: DisplayNoteState): number {
  return displayIndex - (state.leadingSynthetic ? 1 : 0);
}

function storedToDisplayIndex(storedIndex: number, state: DisplayNoteState): number {
  return storedIndex + (state.leadingSynthetic ? 1 : 0);
}

function isSyntheticDisplayIndex(displayIndex: number, state: DisplayNoteState): boolean {
  if (state.leadingSynthetic && displayIndex === 0) return true;
  if (state.trailingSynthetic && displayIndex === state.segments.length - 1) return true;
  return false;
}

function resolveFocusAfterInsert(
  result: { focusTextIndex: number; focusOffset: number },
  nextStored: NoteSegment[],
  prevState: DisplayNoteState
): InsertContext {
  const nextState = displayStateForEditing(nextStored);
  const { focusTextIndex, focusOffset } = result;

  if (focusTextIndex < nextStored.length && nextStored[focusTextIndex]?.type === 'text') {
    return {
      displayIndex: storedToDisplayIndex(focusTextIndex, nextState),
      offset: focusOffset,
    };
  }

  if (nextState.trailingSynthetic) {
    return { displayIndex: nextState.segments.length - 1, offset: 0 };
  }

  const fallback = Math.min(
    storedToDisplayIndex(Math.max(0, focusTextIndex), nextState),
    nextState.segments.length - 1
  );
  return { displayIndex: fallback, offset: focusOffset };
}

export const NoteComposer = forwardRef<NoteComposerHandle, NoteComposerProps>(
  function NoteComposer(
    {
      value,
      onChange,
      placeholder = 'Type a note or tap a card…',
      autoFocus = false,
      disabled = false,
      onKeyDown,
      minHeight = 48,
    },
    ref
  ) {
    const compact = useCompactMode();
    const cardSize = compact ? 'xxxs' : 'sm';
    const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null);
    const [pendingFocus, setPendingFocus] = useState<InsertContext | null>(null);
    const insertContextRef = useRef<InsertContext>({ displayIndex: 0, offset: 0 });
    const textRef = useRef<HTMLTextAreaElement | null>(null);

    const storedSegments = useMemo(
      () => ensureEditableSegments(parseNoteToSegments(value)),
      [value]
    );
    const displayState = useMemo(
      () => displayStateForEditing(storedSegments),
      [storedSegments]
    );
    const { segments: displaySegments } = displayState;
    const isEmpty =
      storedSegments.length === 1 &&
      storedSegments[0].type === 'text' &&
      storedSegments[0].value === '';

    const applySegments = useCallback(
      (next: NoteSegment[]) => {
        onChange(segmentsToNote(ensureEditableSegments(next)));
      },
      [onChange]
    );

    const syncSelection = useCallback(
      (displayIndex: number, el: HTMLTextAreaElement) => {
        const ctx = { displayIndex, offset: el.selectionStart ?? 0 };
        insertContextRef.current = ctx;
      },
      []
    );

    const focusTextAt = useCallback((ctx: InsertContext) => {
      insertContextRef.current = ctx;
      setEditingTextIndex(ctx.displayIndex);
      setPendingFocus(ctx);
    }, []);

    const insertCard = useCallback(
      (shorthand: string) => {
        const ctx = insertContextRef.current;
        const { displayIndex, offset } = ctx;

        if (displayState.leadingSynthetic && displayIndex === 0) {
          const next = insertCardAt(storedSegments, 0, shorthand);
          applySegments(next);
          focusTextAt(resolveFocusAfterInsert({ focusTextIndex: 1, focusOffset: 0 }, next, displayState));
          return;
        }

        if (
          displayState.trailingSynthetic &&
          displayIndex === displaySegments.length - 1
        ) {
          const next = insertCardAt(storedSegments, storedSegments.length, shorthand);
          applySegments(next);
          focusTextAt(resolveFocusAfterInsert({ focusTextIndex: next.length, focusOffset: 0 }, next, displayState));
          return;
        }

        const storedIndex = displayToStoredIndex(displayIndex, displayState);
        const storedSeg = storedSegments[storedIndex];

        if (storedSeg?.type === 'text') {
          const result = insertCardInTextSegment(storedSegments, storedIndex, offset, shorthand);
          applySegments(result.segments);
          focusTextAt(resolveFocusAfterInsert(result, result.segments, displayState));
          return;
        }

        const next = insertCardAt(storedSegments, storedIndex, shorthand);
        applySegments(next);
        focusTextAt(
          resolveFocusAfterInsert({ focusTextIndex: storedIndex + 1, focusOffset: 0 }, next, displayState)
        );
      },
      [storedSegments, displayState, displaySegments.length, applySegments, focusTextAt]
    );

    const insertText = useCallback(
      (text: string) => {
        const { displayIndex } = insertContextRef.current;
        if (displayState.leadingSynthetic && displayIndex === 0) {
          applySegments([{ type: 'text', value: text }, ...storedSegments]);
          return;
        }
        const storedIndex = displayToStoredIndex(displayIndex, displayState);
        applySegments(insertTextAt(storedSegments, storedIndex, text));
      },
      [storedSegments, displayState, applySegments]
    );

    const removeCard = useCallback(
      (shorthand: string) => {
        const storedIndex = displayToStoredIndex(insertContextRef.current.displayIndex, displayState);
        applySegments(removeCardNear(storedSegments, shorthand, storedIndex));
      },
      [storedSegments, displayState, applySegments]
    );

    useImperativeHandle(ref, () => ({ insertCard, insertText, removeCard }), [
      insertCard,
      insertText,
      removeCard,
    ]);

    useEffect(() => {
      if (autoFocus && isEmpty) focusTextAt({ displayIndex: 0, offset: 0 });
    }, [autoFocus, isEmpty, focusTextAt]);

    useEffect(() => {
      if (pendingFocus === null) return;
      if (editingTextIndex !== pendingFocus.displayIndex) return;
      const el = textRef.current;
      if (el) {
        el.focus();
        const offset = Math.min(pendingFocus.offset, el.value.length);
        el.setSelectionRange(offset, offset);
        insertContextRef.current = { displayIndex: pendingFocus.displayIndex, offset };
        setPendingFocus(null);
      }
    }, [pendingFocus, editingTextIndex, displaySegments]);

    const handleTextChange = (displayIndex: number, nextValue: string) => {
      if (displayState.leadingSynthetic && displayIndex === 0) {
        if (nextValue === '') return;
        applySegments([{ type: 'text', value: nextValue }, ...storedSegments]);
        return;
      }

      if (
        displayState.trailingSynthetic &&
        displayIndex === displaySegments.length - 1
      ) {
        if (nextValue === '') return;
        applySegments([...storedSegments, { type: 'text', value: nextValue }]);
        return;
      }

      const storedIndex = displayToStoredIndex(displayIndex, displayState);
      applySegments(updateTextSegment(storedSegments, storedIndex, nextValue));
    };

    const handleRemoveSegment = (storedIndex: number) => {
      applySegments(removeSegmentAt(storedSegments, storedIndex));
    };

    const handleCardClick = (storedIndex: number) => {
      if (storedIndex + 1 < storedSegments.length && storedSegments[storedIndex + 1].type === 'text') {
        const seg = storedSegments[storedIndex + 1];
        focusTextAt({
          displayIndex: storedToDisplayIndex(storedIndex + 1, displayState),
          offset: seg.type === 'text' ? seg.value.length : 0,
        });
        return;
      }
      if (displayState.trailingSynthetic) {
        focusTextAt({ displayIndex: displaySegments.length - 1, offset: 0 });
      }
    };

    const startEditing = (displayIndex: number, offset?: number) => {
      const seg = displaySegments[displayIndex];
      const endOffset = seg?.type === 'text' ? seg.value.length : 0;
      focusTextAt({ displayIndex, offset: offset ?? endOffset });
    };

    const renderCard = (seg: NoteSegment, storedIndex: number) => {
      if (seg.type === 'unknown') {
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
            <CardImage rank="?" suit={null} size={cardSize} />
            {!disabled && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSegment(storedIndex);
                }}
                aria-label="Remove unknown card"
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  p: 0,
                  width: 14,
                  height: 14,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <CloseIcon sx={{ fontSize: 10 }} />
              </IconButton>
            )}
          </Box>
        );
      }
      if (seg.type !== 'card') return null;
      return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
          <CardImage rank={seg.rank} suit={seg.suit} backdoor={seg.backdoor} size={cardSize} />
          {!disabled && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSegment(storedIndex);
              }}
              aria-label={`Remove ${seg.rank} of ${seg.suit}`}
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                p: 0,
                width: 14,
                height: 14,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <CloseIcon sx={{ fontSize: 10 }} />
            </IconButton>
          )}
        </Box>
      );
    };

    return (
      <Box
        onClick={() => {
          if (!disabled && isEmpty) startEditing(0, 0);
        }}
        sx={{
          minHeight,
          p: 1,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          cursor: 'text',
          '&:focus-within': {
            borderColor: 'primary.main',
            borderWidth: 2,
            m: '-1px',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.25,
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}
        >
          {displaySegments.map((seg, displayIndex) => {
            const storedIndex = isSyntheticDisplayIndex(displayIndex, displayState)
              ? -1
              : displayToStoredIndex(displayIndex, displayState);
            const isSynthetic = isSyntheticDisplayIndex(displayIndex, displayState);
            const showPlaceholder =
              isEmpty && displayIndex === 0 && (!displayState.leadingSynthetic || displayIndex === 0);

            return (
              <Fragment key={displayIndex}>
                {seg.type === 'text' ? (
                  editingTextIndex === displayIndex ? (
                    <TextareaAutosize
                      ref={textRef}
                      value={seg.value}
                      disabled={disabled}
                      placeholder={showPlaceholder ? placeholder : undefined}
                      onChange={(e) => {
                        handleTextChange(displayIndex, e.target.value);
                        syncSelection(displayIndex, e.target);
                      }}
                      onSelect={(e) => syncSelection(displayIndex, e.currentTarget)}
                      onKeyUp={(e) => syncSelection(displayIndex, e.currentTarget)}
                      onClick={(e) => syncSelection(displayIndex, e.currentTarget)}
                      onBlur={() => {
                        window.setTimeout(() => {
                          if (document.activeElement !== textRef.current) {
                            if (!isEmpty || seg.value !== '') setEditingTextIndex(null);
                          }
                        }, 0);
                      }}
                      onKeyDown={onKeyDown}
                      aria-label={displayIndex === 0 ? 'Note text' : 'Continue note text'}
                      style={textFieldStyle(seg)}
                    />
                  ) : (
                    <Box
                      component="span"
                      onClick={() => !disabled && startEditing(displayIndex)}
                      sx={{
                        cursor: disabled ? 'default' : 'text',
                        whiteSpace: 'pre-wrap',
                        color: isExploitText(seg.value) ? EXPLOIT_COLOR : 'inherit',
                        fontWeight: isExploitText(seg.value) ? 600 : 'inherit',
                        minWidth: seg.value || isSynthetic ? 48 : undefined,
                        display: 'inline',
                      }}
                    >
                      {seg.value || (showPlaceholder ? (
                        <Typography
                          component="span"
                          color="text.secondary"
                          fontStyle="italic"
                          fontSize="inherit"
                        >
                          {placeholder}
                        </Typography>
                      ) : '\u00A0')}
                    </Box>
                  )
                ) : (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => !disabled && handleCardClick(storedIndex)}
                    sx={{
                      display: 'inline-flex',
                      border: 'none',
                      p: 0,
                      m: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      verticalAlign: 'middle',
                    }}
                  >
                    {renderCard(seg, storedIndex)}
                  </Box>
                )}
              </Fragment>
            );
          })}
        </Box>
        {!isEmpty && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            Place cursor in text, then pick a card · click text to edit · × removes a card
          </Typography>
        )}
      </Box>
    );
  }
);
