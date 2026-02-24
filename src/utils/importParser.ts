import { STAKE_VALUES } from '../types';
import type { PlayerTypeKey } from '../constants/playerTypes';
import type { ParsedImportPlayer } from '../types';

interface StakeNote {
  stake: number | null;
  text: string;
}

const PLAYER_TYPE_HINTS: Array<{ keywords: string[]; key: PlayerTypeKey }> = [
  { keywords: ['whale'], key: 'whale' },
  { keywords: ['calling station', 'passive fish'], key: 'calling_station' },
  { keywords: ['nit', 'rock'], key: 'nit' },
  { keywords: ['maniac'], key: 'maniac' },
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

function extractStake(text: string): number | null {
  const match = text.match(/\b(200|400|800|1000|2000|5000)\b/);
  return match ? (parseInt(match[1], 10) as (typeof STAKE_VALUES)[number]) : null;
}

/**
 * Parses raw import text. Returns ParsedImportPlayer[] with a single combined noteText.
 * Caller converts to ImportPlayer with notes/importedBy.
 */
export function parseImportText(text: string): ParsedImportPlayer[] {
  const lines = text.split(/\r?\n/);
  const players: ParsedImportPlayer[] = [];
  let current: {
    username: string;
    playerType: PlayerTypeKey;
    stakesSeenAt: number[];
    stakeNotes: StakeNote[];
    exploits: string[];
    rawLines: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const newPlayerMatch = line.match(/^([^-—][\w\s]*?)\s+[-—]\s+(.*)$/);
    if (newPlayerMatch) {
      const username = newPlayerMatch[1].trim();
      if (username) {
        if (current) {
          players.push(buildPlayer(current));
        }
        const rest = newPlayerMatch[2];
        const stake = extractStake(rest);
        const playerType = parsePlayerTypeHint(rest);
        const noteMatch = rest.match(/[-—]\s*(.*)$/);
        const noteText = noteMatch ? noteMatch[1].trim() : rest.trim();
        current = {
          username,
          playerType,
          stakesSeenAt: stake != null ? [stake] : [],
          stakeNotes: stake != null ? [{ stake, text: noteText }] : [{ stake: null, text: noteText }],
          exploits: [],
          rawLines: [line],
        };
      }
      continue;
    }

    const multiStakeMatch = line.match(/^[–-]\s*(\d+)?\s*(.*)$/);
    if (multiStakeMatch && current) {
      const stakeStr = multiStakeMatch[1];
      const rest = multiStakeMatch[2].trim();
      const stake = stakeStr && STAKE_VALUES.includes(parseInt(stakeStr, 10) as (typeof STAKE_VALUES)[number])
        ? parseInt(stakeStr, 10)
        : null;
      const noteMatch = rest.match(/[-—]\s*(.*)$/);
      const noteText = noteMatch ? noteMatch[1].trim() : rest;

      if (stake != null) {
        current.stakesSeenAt = [...new Set([...current.stakesSeenAt, stake])].sort((a, b) => a - b);
        const idx = current.stakeNotes.findIndex((sn) => sn.stake === stake);
        if (idx >= 0) {
          current.stakeNotes[idx].text = [current.stakeNotes[idx].text, noteText].filter(Boolean).join('\n');
        } else {
          current.stakeNotes.push({ stake, text: noteText });
        }
      } else {
        const last = current.stakeNotes[current.stakeNotes.length - 1];
        if (last) {
          last.text = [last.text, noteText].filter(Boolean).join('\n');
        } else {
          current.stakeNotes.push({ stake: null, text: noteText });
        }
      }
      current.rawLines.push(line);
      continue;
    }

    if (current && trimmed) {
      if (trimmed.startsWith('**') || trimmed.startsWith('*')) {
        const exploit = trimmed.replace(/^\*+\s*/, '').trim();
        if (exploit) current.exploits.push(exploit);
      } else {
        const last = current.stakeNotes[current.stakeNotes.length - 1];
        if (last) {
          last.text = [last.text, trimmed].filter(Boolean).join('\n');
        } else {
          current.stakeNotes.push({ stake: null, text: trimmed });
        }
      }
      current.rawLines.push(line);
    }
  }

  if (current) {
    players.push(buildPlayer(current));
  }

  return players;
}

function buildPlayer(
  c: {
    username: string;
    playerType: PlayerTypeKey;
    stakesSeenAt: number[];
    stakeNotes: StakeNote[];
    exploits: string[];
    rawLines: string[];
  }
): ParsedImportPlayer {
  return {
    username: c.username,
    playerType: c.playerType,
    stakesSeenAt: [...new Set(c.stakesSeenAt)].sort((a, b) => a - b),
    noteText: c.rawLines.join('\n'),
    exploits: c.exploits,
  };
}

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
