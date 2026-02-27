/**
 * Leak status/category colors. Import from here — never hardcode.
 */
import { getPlayerTypeColor } from './playerTypes';

// Leak status: identified=red (LAG), working=yellow/orange (TAG), resolved=green (Whale)
export const LEAK_STATUS_COLORS: Record<string, string> = {
  identified: getPlayerTypeColor('lag'), // #ef4444
  working: getPlayerTypeColor('tag'), // #f97316
  resolved: getPlayerTypeColor('whale'), // #22c55e
};

export function getLeakStatusColor(status: string): string {
  return LEAK_STATUS_COLORS[status] ?? LEAK_STATUS_COLORS.identified;
}

export const LEAK_CATEGORY_LABELS: Record<string, string> = {
  preflop: 'Preflop',
  cbet: 'C-bet',
  'river-sizing': 'River sizing',
  sizing: 'Sizing',
  '3bet-defense': '3bet defense',
  'bluff-frequency': 'Bluff frequency',
  'range-construction': 'Range construction',
  positional: 'Positional',
  'mental-game': 'Mental game',
  'exploitative-adjustment': 'Exploitative adjustment',
  'study-process': 'Study & process',
  other: 'Other',
};
