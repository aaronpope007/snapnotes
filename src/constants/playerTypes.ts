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
    color: '#22c55e',
    description: 'The ultimate target. Look for ways to isolate them.',
  },
  calling_station: {
    label: 'Calling Station',
    color: '#38bdf8',
    description: "Don't bluff, just value bet. Passive/loose.",
  },
  nit: {
    label: 'Nit / Rock',
    color: '#6b7280',
    description: 'Neutral, boring. No action unless they have the nuts.',
  },
  maniac: {
    label: 'Maniac',
    color: '#e91e63',
    description: 'High activity and aggression. Stay alert for 3-bets and bluffs.',
  },
  weak_tight_reg: {
    label: 'Average Reg',
    color: '#eab308',
    description: 'Solid range, easily pushed off pots.',
  },
  tag: {
    label: 'TAG',
    color: '#f97316',
    description: 'Warning color. Competent, should be respected.',
  },
  lag: {
    label: 'LAG',
    color: '#ef4444',
    description: 'Loose-aggressive. High activity, stay alert.',
  },
  gto_grinder: {
    label: 'GTO Grinder',
    color: '#a855f7',
    description: 'Reg. Knows the math. Avoid ego battles.',
  },
  unknown: {
    label: 'Unknown',
    color: '#9ca3af',
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
