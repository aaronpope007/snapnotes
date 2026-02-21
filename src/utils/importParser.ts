import { STAKE_VALUES, PLAYER_TYPES } from '../types';
import type { ImportPlayer } from '../types';

/**
 * Parses raw text in the format:
 * PlayerName - [stake] [optional player type] - [note text]
 * **observation line
 * [additional lines]
 */
export function parseImportText(text: string): ImportPlayer[] {
  const lines = text.split(/\r?\n/);
  const players: ImportPlayer[] = [];
  let current: ImportPlayer | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^([\w][\w\s]*?)\s+-\s+(.*)$/);

    if (headerMatch) {
      const [, username, rest] = headerMatch;
      const trimmedName = username.trim();
      if (!trimmedName) continue;

      // Save previous player if any
      if (current) {
        players.push({ ...current, notes: (current.notes || '').trim() });
      }

      const { stake, playerType, noteLine } = parseHeaderRest(rest);
      current = {
        username: trimmedName,
        playerType: playerType || undefined,
        stakesSeenAt: stake ? [stake] : [],
        notes: noteLine || '',
      };
    } else if (current && line.trim()) {
      // Continuation line - append to notes
      current.notes = (current.notes ? current.notes + '\n' : '') + line;
    }
  }

  if (current) {
    players.push({ ...current, notes: (current.notes || '').trim() });
  }

  return players;
}

function parseHeaderRest(rest: string): {
  stake?: number;
  playerType?: string;
  noteLine?: string;
} {
  const result: { stake?: number; playerType?: string; noteLine?: string } = {};
  const parts = rest.split(/\s*-\s*/);

  if (parts.length >= 2) {
    const first = parts[0].trim();
    const note = parts.slice(1).join(' - ').trim();

    // Parse first part for stake and optional type
    const tokens = first.split(/\s+/);
    for (const t of tokens) {
      const num = parseInt(t, 10);
      if (!isNaN(num) && STAKE_VALUES.includes(num as (typeof STAKE_VALUES)[number])) {
        result.stake = num;
      } else if (PLAYER_TYPES.some((pt) => pt.toLowerCase().startsWith(t.toLowerCase()))) {
        const match = PLAYER_TYPES.find((pt) =>
          pt.toLowerCase().includes(t.toLowerCase())
        );
        if (match) result.playerType = match;
      }
    }
    result.noteLine = note;
  } else if (parts.length === 1) {
    const first = parts[0].trim();
    const tokens = first.split(/\s+/);
    let noteStart = 0;
    for (let j = 0; j < tokens.length; j++) {
      const num = parseInt(tokens[j], 10);
      if (!isNaN(num) && STAKE_VALUES.includes(num as (typeof STAKE_VALUES)[number])) {
        result.stake = num;
        noteStart = j + 1;
        break;
      }
      const typeMatch = PLAYER_TYPES.find((pt) =>
        pt.toLowerCase().includes(tokens[j].toLowerCase())
      );
      if (typeMatch) {
        result.playerType = typeMatch;
        noteStart = j + 1;
        break;
      }
    }
    result.noteLine = tokens.slice(noteStart).join(' ').trim() || first;
  }

  return result;
}
