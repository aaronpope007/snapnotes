import type {
  Gto8maxPosition,
  GtoEndsAfter,
  GtoFormat,
  GtoHandStart,
  GtoHuPosition,
  GtoPotType,
  GtoSolver,
  GtoStack,
  GtoStreetName,
} from '../types/gtoStudy';

export const GTO_FORMAT_LABELS: Record<GtoFormat, string> = {
  HU: 'Heads-Up',
  '8max': '8max Ring',
};

export const GTO_STACK_OPTIONS: Record<GtoFormat, GtoStack[]> = {
  HU: ['100bb', '200bb'],
  '8max': ['200bb'],
};

export const GTO_HAND_START_OPTIONS: GtoHandStart[] = ['Preflop', 'Postflop'];

export const GTO_POT_TYPE_OPTIONS: GtoPotType[] = ['SRP', '3BP', '4BP', 'FoldedTo', 'Custom'];

export const GTO_POT_TYPE_LABELS: Record<GtoPotType, string> = {
  SRP: 'SRP',
  '3BP': '3BP',
  '4BP': '4BP',
  FoldedTo: 'Folded To',
  Custom: 'Custom',
};

export const GTO_ENDS_AFTER_OPTIONS: GtoEndsAfter[] = ['FirstAction', 'StreetEnd', 'HandEnd'];

export const GTO_SOLVER_OPTIONS: GtoSolver[] = ['Lucid', 'GTO Wizard', 'Solver Pro'];

export const GTO_STREET_OPTIONS: GtoStreetName[] = ['Preflop', 'Flop', 'Turn', 'River'];

export const GTO_HU_POSITIONS: GtoHuPosition[] = ['SB', 'BB'];

export const GTO_8MAX_POSITIONS: Gto8maxPosition[] = [
  'UTG',
  'UTG1',
  'LJ',
  'HJ',
  'CO',
  'BTN',
  'SB',
  'BB',
];

export const GTO_ENDS_AFTER_LABELS: Record<GtoEndsAfter, string> = {
  FirstAction: 'First action',
  StreetEnd: 'Street end',
  HandEnd: 'Hand end',
};

export function getPositionsForFormat(format: GtoFormat): readonly string[] {
  return format === 'HU' ? GTO_HU_POSITIONS : GTO_8MAX_POSITIONS;
}

export function getPotTypesForDrill(format: GtoFormat, handStart: GtoHandStart): GtoPotType[] {
  if (format === '8max' && handStart === 'Postflop') {
    return GTO_POT_TYPE_OPTIONS.filter((p) => p !== 'FoldedTo');
  }
  return GTO_POT_TYPE_OPTIONS;
}

export function getDefaultStack(format: GtoFormat): GtoStack {
  return format === 'HU' ? '100bb' : '200bb';
}

export function getDefaultHeroPosition(format: GtoFormat): string {
  return format === 'HU' ? 'SB' : 'BTN';
}

export function formatDrillSummary(drill: {
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: GtoPotType;
  heroPosition: string;
  villainPosition?: string;
  solver: GtoSolver;
}): string {
  const parts = [
    GTO_FORMAT_LABELS[drill.format],
    drill.stack,
    drill.handStart,
    GTO_POT_TYPE_LABELS[drill.potType],
    `Hero ${drill.heroPosition}`,
  ];
  if (drill.villainPosition) parts.push(`vs ${drill.villainPosition}`);
  parts.push(drill.solver);
  return parts.join(' · ');
}
