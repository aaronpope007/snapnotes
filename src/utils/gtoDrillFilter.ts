import { getDefaultStreet } from '../constants/gtoStudy';
import type {
  GtoDrill,
  GtoEndsAfter,
  GtoFormat,
  GtoHandStart,
  GtoPosition,
  GtoPotType,
  GtoSolver,
  GtoStack,
  GtoStreetName,
} from '../types/gtoStudy';

export interface GtoDrillFacetFilters {
  format: GtoFormat[];
  stack: GtoStack[];
  handStart: GtoHandStart[];
  street: GtoStreetName[];
  potType: GtoPotType[];
  heroPosition: GtoPosition[];
  villainPosition: GtoPosition[];
  endsAfter: GtoEndsAfter[];
  solver: GtoSolver[];
}

export function emptyGtoDrillFacetFilters(): GtoDrillFacetFilters {
  return {
    format: [],
    stack: [],
    handStart: [],
    street: [],
    potType: [],
    heroPosition: [],
    villainPosition: [],
    endsAfter: [],
    solver: [],
  };
}

export function isGtoDrillFacetFiltersActive(facets: GtoDrillFacetFilters): boolean {
  return (
    facets.format.length > 0 ||
    facets.stack.length > 0 ||
    facets.handStart.length > 0 ||
    facets.street.length > 0 ||
    facets.potType.length > 0 ||
    facets.heroPosition.length > 0 ||
    facets.villainPosition.length > 0 ||
    facets.endsAfter.length > 0 ||
    facets.solver.length > 0
  );
}

function effectiveDrillStreet(drill: GtoDrill): GtoStreetName {
  return drill.street ?? getDefaultStreet(drill.handStart);
}

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

  // Drill street
  const street = effectiveDrillStreet(drill).toLowerCase();
  if ((t === 'preflop' || t === 'pre') && street === 'preflop') return true;
  if (t === 'flop' && street === 'flop') return true;
  if (t === 'turn' && street === 'turn') return true;
  if (t === 'river' && street === 'river') return true;

  // Ends after
  if (t === 'first' && drill.endsAfter === 'FirstAction') return true;
  if ((t === 'street' || t === 'streetend') && drill.endsAfter === 'StreetEnd') return true;
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

function matchesFacetList<T>(selected: T[], value: T): boolean {
  return selected.length === 0 || selected.includes(value);
}

/** Checkbox facet filters — OR within each group, AND across groups. */
export function applyGtoDrillFacetFilters(
  drills: GtoDrill[],
  facets: GtoDrillFacetFilters
): GtoDrill[] {
  if (!isGtoDrillFacetFiltersActive(facets)) return drills;

  return drills.filter((drill) => {
    if (!matchesFacetList(facets.format, drill.format)) return false;
    if (!matchesFacetList(facets.stack, drill.stack)) return false;
    if (!matchesFacetList(facets.handStart, drill.handStart)) return false;
    if (!matchesFacetList(facets.street, effectiveDrillStreet(drill))) return false;
    if (!matchesFacetList(facets.potType, drill.potType)) return false;
    if (!matchesFacetList(facets.heroPosition, drill.heroPosition)) return false;
    if (
      facets.villainPosition.length > 0 &&
      (!drill.villainPosition || !facets.villainPosition.includes(drill.villainPosition))
    ) {
      return false;
    }
    if (!matchesFacetList(facets.endsAfter, drill.endsAfter)) return false;
    if (!matchesFacetList(facets.solver, drill.solver)) return false;
    return true;
  });
}

export function filterGtoDrills(
  drills: GtoDrill[],
  rawQuery: string,
  facets: GtoDrillFacetFilters
): GtoDrill[] {
  return applyGtoDrillFacetFilters(filterGtoDrillsByQuery(drills, rawQuery), facets);
}
