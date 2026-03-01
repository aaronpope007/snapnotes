/** Replaces newlines with // so multiline hand histories become one continuous line. */
export function toNoteOneLiner(s: string): string {
  return s.replace(/\r?\n+/g, ' // ').trim();
}
