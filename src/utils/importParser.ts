export { parseImportText } from './strictParser';

/**
 * Parse ** and * lines from raw note text into exploits.
 * Supports lines starting with *, **, or ***.
 */
export function parseExploitsFromRawNote(rawNote: string): string[] {
  const lines = rawNote.split(/\r?\n/);
  const exploits: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^\*+/.test(t)) {
      const exploit = t.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '').trim();
      if (exploit) exploits.push(exploit);
    }
  }
  return exploits;
}
