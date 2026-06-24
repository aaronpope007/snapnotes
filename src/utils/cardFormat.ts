/** Bracket token written when inserting a card via the picker, e.g. [7d], [x]. */
export function formatCardToken(shorthand: string): string {
  return `[${shorthand}]`;
}

/** All stored spellings to match when removing a card (new + legacy). */
export function cardTokenNeedles(shorthand: string): string[] {
  return [formatCardToken(shorthand), `\`${shorthand}\``, `'${shorthand}'`];
}
