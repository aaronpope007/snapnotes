import type { PlayerTypeKey } from '../constants/playerTypes';
import type { ParsedImportPlayer } from '../types';

const PLAYER_TYPE_HINTS: Array<{ keywords: string[]; key: PlayerTypeKey }> = [
  { keywords: ['hu whale', 'whale'], key: 'whale' },
  { keywords: ['hu fish', 'calling station', 'passive fish'], key: 'calling_station' },
  { keywords: ['nit', 'rock'], key: 'nit' },
  { keywords: ['maniac'], key: 'maniac' },
  { keywords: ['fish'], key: 'unknown' },
  { keywords: ['reg'], key: 'unknown' },
  { keywords: ['weak tight', 'weak-tight'], key: 'weak_tight_reg' },
  { keywords: ['tag'], key: 'tag' },
  { keywords: ['lag'], key: 'lag' },
  { keywords: ['gto'], key: 'gto_grinder' },
];

function parsePlayerTypeHint(text: string): PlayerTypeKey {
  const lower = text.toLowerCase();
  for (const { keywords, key } of PLAYER_TYPE_HINTS) {
    if (keywords.some((k) => lower.includes(k))) return key;
  }
  return 'unknown';
}

function isAllCaps(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return t === t.toUpperCase() && /[A-Z]/.test(t);
}

function normalizeUsername(u: string): string {
  return u.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Split full input into player blocks. A new block starts when a line is a player name line.
 * Name line: non-blank, does not start with lowercase, and (previous line blank OR first non-blank OR line contains " - ").
 */
function splitIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  let firstNonBlankIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed !== '' && firstNonBlankIndex < 0) firstNonBlankIndex = i;
    const prevBlank = i === 0 || lines[i - 1].trim() === '';
    const hasSeparator = trimmed.includes(' - ');
    const doesNotStartWithLower = trimmed !== '' && trimmed[0] !== trimmed[0].toLowerCase();
    const isNameLine =
      trimmed !== '' &&
      doesNotStartWithLower &&
      (prevBlank || i === firstNonBlankIndex || hasSeparator);

    if (isNameLine && current.length > 0) {
      blocks.push(current);
      current = [];
    }
    if (trimmed !== '' || current.length > 0) {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

/**
 * Parse one player block into ParsedImportPlayer.
 * Name line: first line; if it contains " - ", username is before first " - ", else whole line.
 * ALL CAPS lines -> exploits. Rest -> single note text. stakesSeenAt: [].
 */
function parseBlock(blockLines: string[]): ParsedImportPlayer {
  const rawBlock = blockLines.join('\n');
  const nameLine = blockLines[0]?.trim() ?? '';
  const restLines = blockLines.slice(1);

  const username = nameLine.includes(' - ')
    ? nameLine.slice(0, nameLine.indexOf(' - ')).trim()
    : nameLine.trim();

  const playerType = parsePlayerTypeHint(nameLine);

  const noteLines: string[] = [];
  const exploits: string[] = [];

  for (const line of restLines) {
    const t = line.trim();
    if (!t) {
      noteLines.push(line);
      continue;
    }
    if (isAllCaps(t)) {
      exploits.push(t);
    } else {
      noteLines.push(line);
    }
  }

  const noteText = [nameLine, ...noteLines].join('\n').trim();

  return {
    username: username || 'Unknown',
    playerType,
    stakesSeenAt: [],
    noteText: noteText || rawBlock,
    exploits,
  };
}

/**
 * Loose import parser for documents with inconsistent or multi-line formatting.
 * Player names often on their own line; notes on following lines; ALL CAPS = exploits.
 * Blind-level stakes are not mapped; store in note text only.
 */
export function parseLooseImport(text: string): ParsedImportPlayer[] {
  const lines = text.split(/\r?\n/);
  const blocks = splitIntoBlocks(lines);
  return blocks.map((block) => parseBlock(block));
}

/**
 * Find probable (fuzzy) duplicate: normalized username matches an existing one but raw differs.
 */
export function findFuzzyDuplicates(
  parsed: ParsedImportPlayer[],
  existingUsernames: Set<string>
): Array<{ incoming: string; existing: string }> {
  const existingList = [...existingUsernames];
  const normalizedToExisting = new Map<string, string>();
  for (const u of existingList) {
    const n = normalizeUsername(u);
    if (!normalizedToExisting.has(n)) normalizedToExisting.set(n, u);
  }

  const pairs: Array<{ incoming: string; existing: string }> = [];

  for (const p of parsed) {
    const n = normalizeUsername(p.username);
    const existing = normalizedToExisting.get(n);
    if (existing != null && existing.toLowerCase() !== p.username.toLowerCase()) {
      pairs.push({ incoming: p.username, existing });
    }
  }
  return pairs;
}
