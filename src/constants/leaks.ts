export type LeakColor = 'aggro' | 'passive' | 'mixed';
export type LeakCategory = 'preflop' | 'postflop';

export interface LeakDefinition {
  id: string;
  label: string;
  color: LeakColor;
  category: LeakCategory;
}

export const LEAK_COLORS: Record<LeakColor, string> = {
  aggro: '#e53935',
  passive: '#1e88e5',
  mixed: '#43a047',
};

export const LEAK_LABELS: Record<LeakColor, string> = {
  aggro: 'Aggro',
  passive: 'Passive',
  mixed: 'Mixed',
};

const PREFLOP_AGGRO: LeakDefinition[] = [
  { id: '3b-too-wide-ip', label: '3-bets Too Wide IP', color: 'aggro', category: 'preflop' },
  { id: '3b-too-wide-oop', label: '3-bets Too Wide OOP', color: 'aggro', category: 'preflop' },
  { id: 'squeezes-too-often', label: 'Squeezes Too Often', color: 'aggro', category: 'preflop' },
  { id: '4b-too-light', label: '4-bets Too Light', color: 'aggro', category: 'preflop' },
  { id: 'opens-too-wide-ep', label: 'Opens Too Wide (EP)', color: 'aggro', category: 'preflop' },
  { id: 'oversteals-btn-co', label: 'Oversteals BTN/CO', color: 'aggro', category: 'preflop' },
  { id: 'limp-reraise-often', label: 'Limp-Reraises Often', color: 'aggro', category: 'preflop' },
  { id: 'iso-raises-too-light', label: 'Iso-raises Too Light', color: 'aggro', category: 'preflop' },
];

const PREFLOP_PASSIVE: LeakDefinition[] = [
  { id: 'under-3b-ip', label: 'Under 3-bets IP', color: 'passive', category: 'preflop' },
  { id: 'under-3b-oop', label: 'Under 3-bets OOP', color: 'passive', category: 'preflop' },
  { id: 'calls-3b-too-wide', label: 'Calls 3-bets Too Wide', color: 'passive', category: 'preflop' },
  { id: 'folds-too-much-3b', label: 'Folds Too Much to 3-bets', color: 'passive', category: 'preflop' },
  { id: 'cold-calls-too-wide', label: 'Cold-calls Too Wide', color: 'passive', category: 'preflop' },
  { id: 'never-squeezes', label: 'Never Squeezes', color: 'passive', category: 'preflop' },
];

const PREFLOP_MIXED: LeakDefinition[] = [
  { id: 'sizing-tells-pf', label: 'Sizing Tells (PF)', color: 'mixed', category: 'preflop' },
  { id: 'capped-range-vs-3b', label: 'Capped Range vs 3-bet', color: 'mixed', category: 'preflop' },
  { id: 'bb-defense-imbalanced', label: 'BB Defense Imbalanced', color: 'mixed', category: 'preflop' },
  { id: 'leaks-multiway', label: 'Leaks in Multiway Pots', color: 'mixed', category: 'preflop' },
];

const POSTFLOP_AGGRO: LeakDefinition[] = [
  { id: 'cbet-too-often-ip', label: 'C-bets Too Often IP', color: 'aggro', category: 'postflop' },
  { id: 'cbet-too-often-oop', label: 'C-bets Too Often OOP', color: 'aggro', category: 'postflop' },
  { id: 'double-barrels-too-wide', label: 'Double Barrels Too Wide', color: 'aggro', category: 'postflop' },
  { id: 'triple-barrel-bluffs', label: 'Triple Barrel Bluffs', color: 'aggro', category: 'postflop' },
  { id: 'overbets-as-bluffs', label: 'Overbets as Bluffs', color: 'aggro', category: 'postflop' },
  { id: 'checkraise-too-often', label: 'X/R Too Often', color: 'aggro', category: 'postflop' },
  { id: 'donkbets-frequently', label: 'Donk-bets Frequently', color: 'aggro', category: 'postflop' },
  { id: 'over-raises-draws', label: 'Over-raises Draws', color: 'aggro', category: 'postflop' },
  { id: 'attacks-checks-aggressive', label: 'Attacks Checks Aggressively', color: 'aggro', category: 'postflop' },
  { id: 'barrels-off-bluff-2', label: 'Barrels Off as Bluff (2-barrel)', color: 'aggro', category: 'postflop' },
  { id: 'barrels-off-bluff-3', label: 'Barrels Off as Bluff (3-barrel)', color: 'aggro', category: 'postflop' },
  { id: 'probe-bets-too-often-oop', label: 'Probe Bets Too Often OOP', color: 'aggro', category: 'postflop' },
  { id: 'bets-checked-to-no-range', label: 'Bets When Checked To (No Range Advantage)', color: 'aggro', category: 'postflop' },
  { id: 'plays-draws-aggressive-ip', label: 'Plays Draws Aggressively IP', color: 'aggro', category: 'postflop' },
  { id: 'ckr-draws', label: 'X/R Draws', color: 'aggro', category: 'postflop' },
];

const POSTFLOP_PASSIVE: LeakDefinition[] = [
  { id: 'checks-back-too-often-ip', label: 'Checks Back Too Often IP', color: 'passive', category: 'postflop' },
  { id: 'under-cbets', label: 'Under C-bets', color: 'passive', category: 'postflop' },
  { id: 'folds-to-pressure', label: 'Folds to Pressure', color: 'passive', category: 'postflop' },
  { id: 'slowplays-too-often', label: 'Slow-plays Too Often', color: 'passive', category: 'postflop' },
  { id: 'underbets-value', label: 'Under-bets Value', color: 'passive', category: 'postflop' },
  { id: 'doesnt-raise-wet-boards', label: "Doesn't Raise Wet Boards", color: 'passive', category: 'postflop' },
  { id: 'calls-down-too-wide', label: 'Calls Down Too Wide', color: 'passive', category: 'postflop' },
  { id: 'calls-draws-without-odds', label: 'Calls Draws Without Odds', color: 'passive', category: 'postflop' },
  { id: 'plays-draws-passive-oop', label: 'Plays Draws Passively OOP', color: 'passive', category: 'postflop' },
  { id: 'plays-draws-passive-ip', label: 'Plays Draws Passively IP', color: 'passive', category: 'postflop' },
];

const POSTFLOP_MIXED: LeakDefinition[] = [
  { id: 'bet-sizing-tells', label: 'Bet Sizing Tells', color: 'mixed', category: 'postflop' },
  { id: 'transparent-range', label: 'Transparent Range', color: 'mixed', category: 'postflop' },
  { id: 'unbalanced-lines', label: 'Unbalanced Lines', color: 'mixed', category: 'postflop' },
  { id: 'ignores-position', label: 'Ignores Position', color: 'mixed', category: 'postflop' },
  { id: 'tilts-after-bad-beats', label: 'Tilts After Bad Beats', color: 'mixed', category: 'postflop' },
  { id: 'scared-big-pots', label: 'Scared of Big Pots', color: 'mixed', category: 'postflop' },
];

export const PREFLOP_LEAKS: LeakDefinition[] = [
  ...PREFLOP_AGGRO,
  ...PREFLOP_PASSIVE,
  ...PREFLOP_MIXED,
];

export const POSTFLOP_LEAKS: LeakDefinition[] = [
  ...POSTFLOP_AGGRO,
  ...POSTFLOP_PASSIVE,
  ...POSTFLOP_MIXED,
];

export const ALL_LEAKS: LeakDefinition[] = [...PREFLOP_LEAKS, ...POSTFLOP_LEAKS];

export const getLeakById = (id: string): LeakDefinition | undefined =>
  ALL_LEAKS.find((l) => l.id === id);

/** Get leak definitions for display (e.g. in search, player card) */
export function getLeaksForDisplay(leakIds: string[]): LeakDefinition[] {
  return leakIds.map(getLeakById).filter(Boolean) as LeakDefinition[];
}
