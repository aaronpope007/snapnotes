import type {
  GtoCustomConfig,
  GtoDrill,
  GtoDrillCreate,
  GtoEndsAfter,
  GtoFormat,
  GtoHandStart,
  GtoPosition,
  GtoPotType,
  GtoSolver,
  GtoStack,
  GtoStreetAction,
} from '../types/gtoStudy';

export interface GtoDrillFormState {
  name: string;
  format: GtoFormat;
  stack: GtoStack;
  handStart: GtoHandStart;
  potType: GtoPotType;
  heroPosition: GtoPosition;
  villainPosition: GtoPosition | '';
  endsAfter: GtoEndsAfter;
  solver: GtoSolver;
  streetActions: GtoStreetAction[];
  customNotes: string;
}

export function emptyDrillFormState(): GtoDrillFormState {
  return {
    name: '',
    format: 'HU',
    stack: '100bb',
    handStart: 'Preflop',
    potType: 'SRP',
    heroPosition: 'SB',
    villainPosition: '',
    endsAfter: 'HandEnd',
    solver: 'Lucid',
    streetActions: [{ street: 'Preflop', sizing: '' }],
    customNotes: '',
  };
}

/** Prefill for “clone drill” — copies settings; HU drills flip 100bb ↔ 200bb. */
export function drillToCloneFormState(drill: GtoDrill): GtoDrillFormState {
  const base = drillToFormState(drill);
  const stack: GtoStack =
    drill.format === 'HU' ? (base.stack === '100bb' ? '200bb' : '100bb') : base.stack;
  return { ...base, stack };
}

export function drillToFormState(drill: GtoDrill): GtoDrillFormState {
  return {
    name: drill.name,
    format: drill.format,
    stack: drill.stack,
    handStart: drill.handStart,
    potType: drill.potType,
    heroPosition: drill.heroPosition,
    villainPosition: drill.villainPosition ?? '',
    endsAfter: drill.endsAfter,
    solver: drill.solver,
    streetActions:
      drill.customConfig?.streetActions?.length
        ? drill.customConfig.streetActions.map((s) => ({ ...s }))
        : [{ street: 'Preflop', sizing: '' }],
    customNotes: drill.customConfig?.notes ?? '',
  };
}

export function formStateToPayload(state: GtoDrillFormState): GtoDrillCreate {
  const payload: GtoDrillCreate = {
    name: state.name.trim(),
    format: state.format,
    stack: state.stack,
    handStart: state.handStart,
    potType: state.potType,
    heroPosition: state.heroPosition,
    villainPosition:
      state.handStart === 'Postflop' && state.villainPosition
        ? state.villainPosition
        : undefined,
    endsAfter: state.endsAfter,
    solver: state.solver,
  };
  if (state.potType === 'Custom') {
    payload.customConfig = {
      streetActions: state.streetActions
        .filter((s) => s.sizing.trim() || s.street)
        .map((s) => ({ street: s.street, sizing: s.sizing.trim() })),
      notes: state.customNotes.trim() || undefined,
    };
  }
  return payload;
}

export function isDrillFormDirty(
  current: GtoDrillFormState,
  baseline: GtoDrillFormState | null,
  isNew: boolean
): boolean {
  if (isNew) {
    const empty = emptyDrillFormState();
    return JSON.stringify(current) !== JSON.stringify(empty);
  }
  if (!baseline) return false;
  return JSON.stringify(current) !== JSON.stringify(baseline);
}

export function customConfigEquals(a?: GtoCustomConfig, b?: GtoCustomConfig): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
