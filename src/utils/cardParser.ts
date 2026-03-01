/**
 * Token types for card shorthand parsing in poker notes.
 * Cards render when wrapped in backticks or single quotes: `kd`, 'kd', `As' (can mix)
 */

export type CardToken =
  | { type: 'card'; rank: string; suit: string; backdoor: boolean }
  | { type: 'unknown_card' }
  | { type: 'text'; value: string };

// Regex for parsing inside delimiters - consecutive cards (no spaces): kdac2s -> Kd, Ac, 2s
const INNER_CARD_REGEX = /([AKQJT2-9])(c|d|h|s)\2|([AKQJT2-9])(c|d|h|s)|x([cdhs]*)/gi;

function parseBacktickContent(content: string): CardToken[] {
  const tokens: CardToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(INNER_CARD_REGEX.source, 'gi');

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    lastIndex = match.index + match[0].length;

    if (match[1] !== undefined && match[2] !== undefined) {
      tokens.push({
        type: 'card',
        rank: match[1].toUpperCase(),
        suit: match[2].toLowerCase(),
        backdoor: true,
      });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      tokens.push({
        type: 'card',
        rank: match[3].toUpperCase(),
        suit: match[4].toLowerCase(),
        backdoor: false,
      });
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'unknown_card' });
    }
  }

  if (lastIndex < content.length) {
    tokens.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return tokens;
}

function indexOfDelimiter(text: string, fromIndex: number): number {
  const idx = text.indexOf('`', fromIndex);
  const idx2 = text.indexOf("'", fromIndex);
  if (idx === -1) return idx2;
  if (idx2 === -1) return idx;
  return Math.min(idx, idx2);
}

/**
 * Splits a note string into typed tokens. Cards render inside ` or ' (can mix).
 * e.g. `kd`, 'kd', `As' -> King of diamonds
 */
export function parseNoteTokens(text: string): CardToken[] {
  const tokens: CardToken[] = [];
  let i = 0;

  while (i < text.length) {
    const open = indexOfDelimiter(text, i);
    if (open === -1) {
      if (i < text.length) tokens.push({ type: 'text', value: text.slice(i) });
      break;
    }

    if (open > i) {
      tokens.push({ type: 'text', value: text.slice(i, open) });
    }

    const close = indexOfDelimiter(text, open + 1);
    if (close === -1) {
      tokens.push({ type: 'text', value: text.slice(open) });
      break;
    }

    const inner = text.slice(open + 1, close);
    tokens.push(...parseBacktickContent(inner));
    i = close + 1;
  }

  return tokens;
}

/**
 * Returns the set of card shorthands already used in note text (inside ` or ').
 * Used to grey out those cards in the picker. Unknown cards are not added here;
 * use getUsedUnknownCardCount for the count of `x` unknown cards.
 */
export function getUsedCardShorthands(text: string): Set<string> {
  const tokens = parseNoteTokens(text);
  const used = new Set<string>();
  for (const t of tokens) {
    if (t.type === 'card') {
      used.add(t.rank.toLowerCase() + t.suit);
    }
  }
  return used;
}

/**
 * Returns how many unknown-card tokens (`x`) are in the note text (inside ` or ').
 */
export function getUsedUnknownCardCount(text: string): number {
  const tokens = parseNoteTokens(text);
  let count = 0;
  for (const t of tokens) {
    if (t.type === 'unknown_card') count++;
  }
  return count;
}
