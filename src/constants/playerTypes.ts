/**
 * Player type keys, labels, colors. Import colors from here — never hardcode.
 */
export const PLAYER_TYPE_KEYS = [
  'whale',
  'calling_station',
  'nit',
  'maniac',
  'weak_tight_reg',
  'tag',
  'lag',
  'gto_grinder',
  'unknown',
] as const;

export type PlayerTypeKey = (typeof PLAYER_TYPE_KEYS)[number];

export const PLAYER_TYPE_CONFIG: Record<
  PlayerTypeKey,
  { label: string; color: string; description: string }
> = {
  whale: {
    label: 'Whale',
    color: '#ff9800',
    description: 'Loose aggressive, plays almost every hand, creates massive pots',
  },
  calling_station: {
    label: 'Calling Station',
    color: '#009688',
    description: 'Calls everything, never raises, impossible to bluff',
  },
  nit: {
    label: 'Nit / Rock',
    color: '#9e9e9e',
    description: 'Only plays premiums, folds to all aggression',
  },
  maniac: {
    label: 'Maniac',
    color: '#e91e63',
    description: 'Pure aggression, constant overbets, reckless',
  },
  weak_tight_reg: {
    label: 'Weak-Tight Reg',
    color: '#ffeb3b',
    description: 'Solid range, easily pushed off pots',
  },
  tag: {
    label: 'TAG',
    color: '#2196f3',
    description: 'Tight aggressive, standard good player',
  },
  lag: {
    label: 'LAG',
    color: '#f44336',
    description: 'Loose aggressive, high skill, most dangerous',
  },
  gto_grinder: {
    label: 'GTO Grinder',
    color: '#9c27b0',
    description: 'Balanced, hard to exploit',
  },
  unknown: {
    label: 'Unknown',
    color: '#bdbdbd',
    description: 'Not yet classified',
  },
};

export function getPlayerTypeColor(key: string | undefined): string {
  const k = key && key in PLAYER_TYPE_CONFIG ? (key as PlayerTypeKey) : 'unknown';
  return PLAYER_TYPE_CONFIG[k].color;
}

export function getPlayerTypeLabel(key: string | undefined): string {
  const k = key && key in PLAYER_TYPE_CONFIG ? (key as PlayerTypeKey) : 'unknown';
  return PLAYER_TYPE_CONFIG[k].label;
}
