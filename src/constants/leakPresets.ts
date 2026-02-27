import type { LeakCategory } from '../types/learning';

export interface LeakPreset {
  title: string;
  category: LeakCategory;
}

export const LEAK_PRESETS: LeakPreset[] = [
  // Preflop
  { title: 'Limping in early position', category: 'preflop' },
  { title: 'Overcalling too wide in multiway pots', category: 'preflop' },
  { title: '3bet range too linear (value-heavy, no bluffs)', category: 'preflop' },
  { title: 'Defending BB too wide vs steals', category: 'preflop' },
  { title: 'Defending BB too tight vs steals', category: 'preflop' },
  { title: 'Flatting too many hands OOP', category: 'preflop' },
  { title: 'Squeezing too infrequently', category: 'preflop' },
  { title: 'Cold-calling 3bets out of position', category: 'preflop' },
  // C-betting & Aggression
  { title: 'C-betting too frequently on bad textures', category: 'cbet' },
  { title: 'C-betting too infrequently (giving up too easily)', category: 'cbet' },
  { title: 'Using one-size c-bet instead of range-based sizing', category: 'cbet' },
  { title: 'Not double-barreling enough on good runouts', category: 'cbet' },
  { title: 'Triple-barreling too frequently as a bluff', category: 'cbet' },
  { title: 'Giving up on the turn after c-bet call', category: 'cbet' },
  // Sizing
  { title: 'Undersizing value bets on the river', category: 'sizing' },
  { title: 'Oversizing bluffs (making them unprofitable)', category: 'sizing' },
  { title: 'Not using overbets in appropriate spots', category: 'sizing' },
  { title: 'Using same sizing regardless of board texture', category: 'sizing' },
  { title: 'Pot-controlling when I should be building the pot', category: 'sizing' },
  // Ranges & Balance
  { title: 'Value-betting too thin / not thin enough', category: 'range-construction' },
  { title: 'Calling river bets too wide (overcalling)', category: 'range-construction' },
  { title: 'Folding river too frequently (undercalling)', category: 'range-construction' },
  { title: 'Not enough bluffs in raising range', category: 'range-construction' },
  { title: 'Unbalanced check-raise range', category: 'range-construction' },
  { title: 'Defending too many draws passively instead of raising', category: 'range-construction' },
  // Positional
  { title: 'Playing too many hands from early position', category: 'positional' },
  { title: 'Not taking advantage of positional advantage on later streets', category: 'positional' },
  { title: 'Folding too often to aggression when in position', category: 'positional' },
  // Exploitative / Reads
  { title: 'Not adjusting to player type (ignoring notes/tags)', category: 'exploitative-adjustment' },
  { title: 'Failing to value-bet thinly vs calling stations', category: 'exploitative-adjustment' },
  { title: 'Bluffing into calling stations', category: 'exploitative-adjustment' },
  { title: 'Not exploiting weak c-betters by floating more', category: 'exploitative-adjustment' },
  { title: 'Missing bet-fold opportunities vs straightforward opponents', category: 'exploitative-adjustment' },
  // Mental Game
  { title: 'Tilt after a bad beat affecting subsequent decisions', category: 'mental-game' },
  { title: 'Playing too many tables / loss of focus', category: 'mental-game' },
  { title: 'Revenge mentality after losing a big pot', category: 'mental-game' },
  { title: 'Playing too long / fatigue degrading decisions', category: 'mental-game' },
  { title: 'Shot-taking above comfortable bankroll', category: 'mental-game' },
  { title: 'Rushing decisions in pressure spots', category: 'mental-game' },
  // Study & Process
  { title: 'Not reviewing hands off-table', category: 'study-process' },
  { title: 'Reviewing only bad beats instead of close decisions', category: 'study-process' },
  { title: 'Not having a clear study focus', category: 'study-process' },
  { title: 'Ignoring solver outputs that contradict intuition', category: 'study-process' },
];
