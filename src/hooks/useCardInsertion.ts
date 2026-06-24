import { useRef, useCallback, useMemo } from 'react';
import { getUsedCardShorthands, getUsedUnknownCardCount } from '../utils/cardParser';
import { formatCardToken, cardTokenNeedles } from '../utils/cardFormat';

export function useCardInsertion(value: string, onChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const trackSelection = useCallback((el: HTMLInputElement | HTMLTextAreaElement) => {
    selectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    };
  }, []);

  const insertAtCursor = useCallback(
    (text: string) => {
      const { start } = selectionRef.current;
      const next = value.slice(0, start) + text + value.slice(start);
      onChange(next);
      const newPos = start + text.length;
      selectionRef.current = { start: newPos, end: newPos };
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [value, onChange]
  );

  const insertCard = useCallback(
    (shorthand: string) => insertAtCursor(formatCardToken(shorthand)),
    [insertAtCursor]
  );

  const insertText = useCallback(
    (text: string) => insertAtCursor(text),
    [insertAtCursor]
  );

  const removeCard = useCallback(
    (shorthand: string) => {
      const needles = cardTokenNeedles(shorthand);
      const cursor = selectionRef.current.start;
      let best: { index: number; len: number } | null = null;
      let bestDist = Infinity;
      for (const needle of needles) {
        let idx = value.indexOf(needle);
        while (idx !== -1) {
          const dist = Math.min(
            Math.abs(cursor - idx),
            Math.abs(cursor - (idx + needle.length))
          );
          if (dist < bestDist) {
            bestDist = dist;
            best = { index: idx, len: needle.length };
          }
          idx = value.indexOf(needle, idx + 1);
        }
      }
      if (!best) return;
      const next = value.slice(0, best.index) + value.slice(best.index + best.len);
      onChange(next);
      selectionRef.current = { start: best.index, end: best.index };
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(best.index, best.index);
      }, 0);
    },
    [value, onChange]
  );

  const usedShorthands = useMemo(() => getUsedCardShorthands(value), [value]);
  const usedUnknownCardCount = useMemo(() => getUsedUnknownCardCount(value), [value]);

  return {
    inputRef,
    trackSelection,
    insertCard,
    insertText,
    removeCard,
    usedShorthands,
    usedUnknownCardCount,
  };
}
