import type { GtoDrill } from '../types/gtoStudy';

/** One token (lowercase) matches if it hits name substring or any mapped field. */
function tokenMatchesAtom(t: string, drill: GtoDrill): boolean {
  if (drill.name.toLowerCase().includes(t)) return true;

  // Format
  if (
    drill.format === 'HU' &&
    (t === 'hu' || t === 'heads-up' || t === 'headsup' || t === 'heads up')
  ) {
    return true;
  }
  if (drill.format === '8max' && (t === '8max' || t === '8-max' || t === 'ring')) {
    return true;
  }

  // Stacks
  if ((t === '100' || t === '100bb') && drill.stack === '100bb') return true;
  if ((t === '200' || t === '200bb') && drill.stack === '200bb') return true;

  // Pot type
  if (t === 'srp' && drill.potType === 'SRP') return true;
  if ((t === '3bp' || t === '3b') && drill.potType === '3BP') return true;
  if ((t === '4bp' || t === '4b') && drill.potType === '4BP') return true;
  if ((t === 'folded' || t === 'foldedto') && drill.potType === 'FoldedTo') return true;
  if (t === 'custom' && drill.potType === 'Custom') return true;

  // Hand start
  if ((t === 'preflop' || t === 'pre') && drill.handStart === 'Preflop') return true;
  if ((t === 'postflop' || t === 'post') && drill.handStart === 'Postflop') return true;

  // Ends after
  if (t === 'first' && drill.endsAfter === 'FirstAction') return true;
  if (t === 'street' && drill.endsAfter === 'StreetEnd') return true;
  if (t === 'hand' && drill.endsAfter === 'HandEnd') return true;

  // Hero position (lowercase token → enum)
  const hp = drill.heroPosition;
  if (t === 'sb' && hp === 'SB') return true;
  if (t === 'bb' && hp === 'BB') return true;
  if (t === 'btn' && hp === 'BTN') return true;
  if (t === 'co' && hp === 'CO') return true;
  if (t === 'hj' && hp === 'HJ') return true;
  if (t === 'lj' && hp === 'LJ') return true;
  if (t === 'utg' && (hp === 'UTG' || hp === 'UTG1')) return true;
  if (t === 'utg1' && hp === 'UTG1') return true;

  // Solver
  if (drill.solver === 'Lucid' && t === 'lucid') return true;
  if (drill.solver === 'GTO Wizard' && (t === 'wizard' || t === 'gto' || t === 'gtowizard' || t === 'gto-wizard')) {
    return true;
  }
  if (
    drill.solver === 'Solver Pro' &&
    (t === 'solver' || t === 'pro' || t === 'solverpro' || t === 'solver-pro')
  ) {
    return true;
  }

  return false;
}

/**
 * Client-side drill list filter.
 * - Full query (lowercased, collapsed spaces) as substring of name → match.
 * - Otherwise whitespace tokens are ANDed; each token must match via {@link tokenMatchesAtom} (OR within token).
 */
export function filterGtoDrillsByQuery(drills: GtoDrill[], rawQuery: string): GtoDrill[] {
  const q = rawQuery.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return drills;

  const tokens = q.split(' ').filter(Boolean);

  return drills.filter((drill) => {
    if (drill.name.toLowerCase().includes(q)) return true;
    if (tokens.length === 0) return true;
    return tokens.every((tok) => tokenMatchesAtom(tok, drill));
  });
}
