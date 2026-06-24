import { useRef } from 'react';
import Box from '@mui/material/Box';
import { NoteComposer, type NoteComposerHandle } from './NoteComposer';
import { HandHistoryCardPicker } from './HandHistoryCardPicker';
import { getUsedCardShorthands, getUsedUnknownCardCount } from '../utils/cardParser';

export interface NoteWithCardPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** @deprecated Preview is built into the WYSIWYG composer. */
  showPreview?: boolean;
  /** @deprecated Multiline is always enabled in the composer. */
  multiline?: boolean;
  /** @deprecated Use minHeight on composer via composeMinHeight if needed. */
  minRows?: number;
}

export function NoteWithCardPicker({
  value,
  onChange,
  placeholder = 'Type a note or tap a card…',
  autoFocus = false,
  disabled = false,
  onKeyDown,
}: NoteWithCardPickerProps) {
  const composerRef = useRef<NoteComposerHandle>(null);
  const usedShorthands = getUsedCardShorthands(value);
  const usedUnknownCardCount = getUsedUnknownCardCount(value);

  return (
    <Box>
      <NoteComposer
        ref={composerRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onKeyDown={onKeyDown}
      />
      <HandHistoryCardPicker
        variant="cardsOnly"
        layout="inline"
        onInsertCard={(s) => composerRef.current?.insertCard(s)}
        onInsertText={(t) => composerRef.current?.insertText(t)}
        onRemoveCard={(s) => composerRef.current?.removeCard(s)}
        usedShorthands={usedShorthands}
        usedUnknownCardCount={usedUnknownCardCount}
      />
    </Box>
  );
}
