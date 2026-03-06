export type LeakColor = 'aggro' | 'passive' | 'tell';

export interface LeakDefinition {
  id: string;
  label: string;
  color: LeakColor;
  category: 'preflop' | 'postflop';
  /** For postflop: 'ip' | 'oop'. Preflop has no position. */
  position?: 'ip' | 'oop';
}

export const LEAK_COLORS: Record<LeakColor, string> = {
  aggro: '#e53935',
  passive: '#1e88e5',
  tell: '#ffb300',
};

/** Action-Line leak schema: Phase → Role → [Leaks] or nested sub-groups. */
export const LEAK_MAP = {
  PREFLOP: {
    PFR: ['Limping', 'RFI Wide', 'F3B High', 'Size Tell (Nuts)', 'No 4B Bluff', '4b Folds'],
    VS_PFR: ['Cold Call Wide', 'Linear 3B', 'High 3b IP', 'High Squeeze', 'Peels 3B Wide'],
  },
  POSTFLOP_IP: {
    PFR_LEAD: ['One-and-Done', 'Fit-or-Fold', '3-Barrel Air', 'Gives up to X-R', 'Small=Weak'],
    VS_PFR: ['Floaty', 'Passive Draw', 'Donk Turn', 'Auto-Fold Turn', 'Raises Nuts Only'],
  },
  POSTFLOP_OOP: {
    PFR_LEAD: ['Over-Cbet OOP', 'X-R Honest (PFR)', 'X-Fold PFR', 'Protection Obsessed', 'Spewy Barrels'],
    VS_PFR: {
      CHECK_RAISE: ['X-R Air (Bluff)', 'X-R Honest (Value)'],
      DONKING: ['Honest Donking', 'Dishonest Donking'],
      DEFENDING: ['Calling Station', 'X-Fold Flop', 'Over-values TPWK', 'Afraid of Draws'],
    },
  },
} as const;

/** Slug from label, e.g. "RFI Wide" → "rfi-wide", "Small=Weak" → "small-weak". */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/=/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[-]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Color assignments per leak label (aggro=red, passive=blue, tell=yellow). */
const LEAK_COLOR_MAP: Record<string, LeakColor> = {
  Limping: 'passive',
  'RFI Wide': 'aggro',
  'F3B High': 'passive',
  'Size Tell (Nuts)': 'tell',
  'No 4B Bluff': 'passive',
  '4b Folds': 'aggro',
  'Cold Call Wide': 'passive',
  'Linear 3B': 'aggro',
  'High 3b IP': 'aggro',
  'High Squeeze': 'aggro',
  'Peels 3B Wide': 'passive',
  'One-and-Done': 'passive',
  'Fit-or-Fold': 'passive',
  '3-Barrel Air': 'aggro',
  'Gives up to X-R': 'passive',
  'Small=Weak': 'tell',
  Floaty: 'aggro',
  'Passive Draw': 'passive',
  'Donk Turn': 'aggro',
  'Auto-Fold Turn': 'passive',
  'Raises Nuts Only': 'passive',
  'Over-Cbet OOP': 'aggro',
  'X-R Honest (PFR)': 'tell',
  'X-Fold PFR': 'passive',
  'Protection Obsessed': 'aggro',
  'Spewy Barrels': 'aggro',
  'X-R Air (Bluff)': 'aggro',
  'X-R Honest (Value)': 'tell',
  'Honest Donking': 'tell',
  'Dishonest Donking': 'aggro',
  'Calling Station': 'passive',
  'X-Fold Flop': 'passive',
  'Over-values TPWK': 'aggro',
  'Afraid of Draws': 'passive',
};

function getColor(label: string): LeakColor {
  return LEAK_COLOR_MAP[label] ?? 'passive';
}

/** Flatten LEAK_MAP into id → LeakDefinition for getLeakById. */
function buildLeakRegistry(): Map<string, LeakDefinition> {
  const map = new Map<string, LeakDefinition>();

  const add = (label: string, category: 'preflop' | 'postflop', position?: 'ip' | 'oop') => {
    const id = slugify(label);
    map.set(id, { id, label, color: getColor(label), category, position });
  };

  for (const label of LEAK_MAP.PREFLOP.PFR) add(label, 'preflop');
  for (const label of LEAK_MAP.PREFLOP.VS_PFR) add(label, 'preflop');

  for (const label of LEAK_MAP.POSTFLOP_IP.PFR_LEAD) add(label, 'postflop', 'ip');
  for (const label of LEAK_MAP.POSTFLOP_IP.VS_PFR) add(label, 'postflop', 'ip');

  for (const label of LEAK_MAP.POSTFLOP_OOP.PFR_LEAD) add(label, 'postflop', 'oop');
  for (const label of LEAK_MAP.POSTFLOP_OOP.VS_PFR.CHECK_RAISE) add(label, 'postflop', 'oop');
  for (const label of LEAK_MAP.POSTFLOP_OOP.VS_PFR.DONKING) add(label, 'postflop', 'oop');
  for (const label of LEAK_MAP.POSTFLOP_OOP.VS_PFR.DEFENDING) add(label, 'postflop', 'oop');

  return map;
}

const LEAK_REGISTRY = buildLeakRegistry();

export const ALL_LEAKS: LeakDefinition[] = Array.from(LEAK_REGISTRY.values());

export const getLeakById = (id: string): LeakDefinition | undefined =>
  LEAK_REGISTRY.get(id) ?? LEAK_REGISTRY.get(id.replace(/_/g, '-'));

/** Get leak definitions for display (e.g. search, player card). */
export function getLeaksForDisplay(leakIds: string[]): LeakDefinition[] {
  return leakIds.map(getLeakById).filter(Boolean) as LeakDefinition[];
}
