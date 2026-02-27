/**
 * Leak and Edge status/category colors. Import from here — never hardcode.
 */
import { getPlayerTypeColor } from './playerTypes';

// Leak status: identified=red (LAG), working=yellow/orange (TAG), resolved=green (Whale)
export const LEAK_STATUS_COLORS: Record<string, string> = {
  identified: getPlayerTypeColor('lag'), // #ef4444
  working: getPlayerTypeColor('tag'), // #f97316
  resolved: getPlayerTypeColor('whale'), // #22c55e
};

// Edge status: developing=blue, active=cyan, archived=muted gray
export const EDGE_STATUS_COLORS: Record<string, string> = {
  developing: '#38bdf8', // sky blue
  active: '#22d3ee', // cyan
  archived: '#6b7280', // gray-500
};

export function getLeakStatusColor(status: string): string {
  return LEAK_STATUS_COLORS[status] ?? LEAK_STATUS_COLORS.identified;
}

export function getEdgeStatusColor(status: string): string {
  return EDGE_STATUS_COLORS[status] ?? EDGE_STATUS_COLORS.developing;
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

export const EDGE_CATEGORY_LABELS: Record<string, string> = {
  'pool-tendency': 'Pool tendency',
  'solver-deviation': 'Solver deviation',
  'live-read': 'Live read',
  'sizing-exploit': 'Sizing exploit',
  'positional-edge': 'Positional edge',
  'meta-adjustment': 'Meta adjustment',
  other: 'Other',
};
