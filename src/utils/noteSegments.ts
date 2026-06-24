import { parseNoteTokens } from './cardParser';
import { formatCardToken } from './cardFormat';

export type NoteSegment =
  | { type: 'text'; value: string }
  | { type: 'card'; rank: string; suit: string; backdoor: boolean }
  | { type: 'unknown' };

export function shorthandToSegment(shorthand: string): NoteSegment {
  if (shorthand === 'x') return { type: 'unknown' };
  const m = /^([akqjt2-9])([cdhs])\2?$/i.exec(shorthand);
  if (!m) return { type: 'text', value: formatCardToken(shorthand) };
  const doubled = m[0].length === 4;
  return {
    type: 'card',
    rank: m[1].toUpperCase(),
    suit: m[2].toLowerCase(),
    backdoor: doubled,
  };
}

export function segmentToShorthand(seg: NoteSegment): string | null {
  if (seg.type === 'unknown') return 'x';
  if (seg.type !== 'card') return null;
  const rank = seg.rank.toLowerCase();
  return seg.backdoor ? `${rank}${seg.suit}${seg.suit}` : `${rank}${seg.suit}`;
}

export function parseNoteToSegments(text: string): NoteSegment[] {
  if (!text) return [];
  const tokens = parseNoteTokens(text);
  const segments: NoteSegment[] = [];

  for (const token of tokens) {
    if (token.type === 'text') {
      if (!token.value) continue;
      const last = segments[segments.length - 1];
      if (last?.type === 'text') {
        last.value += token.value;
      } else {
        segments.push({ type: 'text', value: token.value });
      }
    } else if (token.type === 'card') {
      segments.push({
        type: 'card',
        rank: token.rank,
        suit: token.suit,
        backdoor: token.backdoor,
      });
    } else if (token.type === 'unknown_card') {
      segments.push({ type: 'unknown' });
    }
  }

  return segments;
}

export function segmentsToNote(segments: NoteSegment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text') return seg.value;
      if (seg.type === 'unknown') return formatCardToken('x');
      const shorthand = segmentToShorthand(seg);
      return shorthand ? formatCardToken(shorthand) : '';
    })
    .join('');
}

export function ensureEditableSegments(segments: NoteSegment[]): NoteSegment[] {
  if (segments.length === 0) return [{ type: 'text', value: '' }];
  return segments;
}

/** True when the UI should show an extra empty text field after the last card. */
export function needsTrailingTextField(segments: NoteSegment[]): boolean {
  if (segments.length === 0) return false;
  const last = segments[segments.length - 1];
  return last.type !== 'text';
}

export function needsLeadingTextField(segments: NoteSegment[]): boolean {
  if (segments.length === 0) return false;
  return segments[0].type !== 'text';
}

export interface DisplayNoteState {
  segments: NoteSegment[];
  leadingSynthetic: boolean;
  trailingSynthetic: boolean;
}

export function displayStateForEditing(stored: NoteSegment[]): DisplayNoteState {
  const base = ensureEditableSegments(stored);
  let segments = base;
  let leadingSynthetic = false;
  let trailingSynthetic = false;

  if (needsLeadingTextField(base)) {
    segments = [{ type: 'text', value: '' }, ...segments];
    leadingSynthetic = true;
  }
  if (needsTrailingTextField(base)) {
    segments = [...segments, { type: 'text', value: '' }];
    trailingSynthetic = true;
  }

  return { segments, leadingSynthetic, trailingSynthetic };
}

/** @deprecated Use displayStateForEditing */
export function displaySegmentsForEditing(segments: NoteSegment[]): NoteSegment[] {
  return displayStateForEditing(segments).segments;
}

export function insertCardAt(
  segments: NoteSegment[],
  index: number,
  shorthand: string
): NoteSegment[] {
  const next = [...segments];
  next.splice(index, 0, shorthandToSegment(shorthand));
  return next;
}

export interface CardInsertResult {
  segments: NoteSegment[];
  focusTextIndex: number;
  focusOffset: number;
}

export function insertCardInTextSegment(
  segments: NoteSegment[],
  textIndex: number,
  charOffset: number,
  shorthand: string
): CardInsertResult {
  const seg = segments[textIndex];
  if (!seg || seg.type !== 'text') {
    const next = insertCardAt(segments, textIndex, shorthand);
    const focusTextIndex =
      textIndex + 1 < next.length && next[textIndex + 1].type === 'text'
        ? textIndex + 1
        : next.length;
    return { segments: next, focusTextIndex, focusOffset: 0 };
  }

  const before = seg.value.slice(0, charOffset);
  const after = seg.value.slice(charOffset);
  const card = shorthandToSegment(shorthand);
  const parts: NoteSegment[] = [];
  if (before) parts.push({ type: 'text', value: before });
  parts.push(card);
  if (after) parts.push({ type: 'text', value: after });

  const next = [...segments];
  next.splice(textIndex, 1, ...parts);

  let focusTextIndex = textIndex;
  if (after) {
    focusTextIndex = textIndex + (before ? 2 : 1);
  } else if (before) {
    focusTextIndex = textIndex + 2;
  } else {
    focusTextIndex = textIndex + 1;
  }

  return { segments: next, focusTextIndex, focusOffset: 0 };
}

export function insertTextAt(
  segments: NoteSegment[],
  index: number,
  text: string
): NoteSegment[] {
  if (!text) return segments;
  const next = [...segments];
  if (index > 0 && next[index - 1]?.type === 'text') {
    const prev = next[index - 1];
    if (prev.type === 'text') {
      next[index - 1] = { type: 'text', value: prev.value + text };
      return next;
    }
  }
  if (index < next.length && next[index]?.type === 'text') {
    const cur = next[index];
    if (cur.type === 'text') {
      next[index] = { type: 'text', value: text + cur.value };
      return next;
    }
  }
  next.splice(index, 0, { type: 'text', value: text });
  return next;
}

export function removeCardNear(
  segments: NoteSegment[],
  shorthand: string,
  nearIndex: number
): NoteSegment[] {
  const matches: number[] = [];
  segments.forEach((seg, i) => {
    const segShorthand = segmentToShorthand(seg);
    if (segShorthand === shorthand.toLowerCase() || (shorthand === 'x' && seg.type === 'unknown')) {
      matches.push(i);
    }
  });
  if (matches.length === 0) return segments;
  const target = matches.reduce((best, i) =>
    Math.abs(i - nearIndex) < Math.abs(best - nearIndex) ? i : best
  );
  const next = [...segments];
  next.splice(target, 1);
  return next;
}

export function updateTextSegment(
  segments: NoteSegment[],
  index: number,
  value: string
): NoteSegment[] {
  const next = [...segments];
  if (next[index]?.type === 'text') {
    if (value === '' && next.length > 1) {
      next.splice(index, 1);
    } else {
      next[index] = { type: 'text', value };
    }
  }
  return next;
}

export function removeSegmentAt(segments: NoteSegment[], index: number): NoteSegment[] {
  const next = segments.filter((_, i) => i !== index);
  return ensureEditableSegments(next);
}
