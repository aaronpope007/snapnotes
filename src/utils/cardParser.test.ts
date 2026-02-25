import { describe, it, expect } from 'vitest';
import { parseNoteTokens, getUsedCardShorthands } from './cardParser';

describe('parseNoteTokens', () => {
  it('parses `kd` as single card (backtick syntax)', () => {
    const tokens = parseNoteTokens('`kd`');
    expect(tokens).toEqual([
      { type: 'card', rank: 'K', suit: 'd', backdoor: false },
    ]);
  });

  it('parses `Kdd` as backdoor card', () => {
    const tokens = parseNoteTokens('`Kdd`');
    expect(tokens).toEqual([
      { type: 'card', rank: 'K', suit: 'd', backdoor: true },
    ]);
  });

  it('parses `kdac2s` as three cards', () => {
    const tokens = parseNoteTokens('`kdac2s`');
    expect(tokens).toEqual([
      { type: 'card', rank: 'K', suit: 'd', backdoor: false },
      { type: 'card', rank: 'A', suit: 'c', backdoor: false },
      { type: 'card', rank: '2', suit: 's', backdoor: false },
    ]);
  });

  it('parses mixed text and backtick cards', () => {
    const tokens = parseNoteTokens('flop `Kd9c` and turn `x`');
    expect(tokens).toEqual([
      { type: 'text', value: 'flop ' },
      { type: 'card', rank: 'K', suit: 'd', backdoor: false },
      { type: 'card', rank: '9', suit: 'c', backdoor: false },
      { type: 'text', value: ' and turn ' },
      { type: 'unknown_card' },
    ]);
  });

  it('does not convert Kd without backticks (imported notes)', () => {
    const tokens = parseNoteTokens('Maxxxstakd - 400 ring - ck back');
    expect(tokens).toEqual([
      { type: 'text', value: 'Maxxxstakd - 400 ring - ck back' },
    ]);
  });

  it('parses `Kc9cxcc` as K + 9 + unknown (cc ignored)', () => {
    const tokens = parseNoteTokens('`Kc9cxcc`');
    expect(tokens).toEqual([
      { type: 'card', rank: 'K', suit: 'c', backdoor: false },
      { type: 'card', rank: '9', suit: 'c', backdoor: false },
      { type: 'unknown_card' },
    ]);
  });

  it('handles unclosed backtick as plain text', () => {
    const tokens = parseNoteTokens('flop `Kd');
    expect(tokens.map((t) => (t.type === 'text' ? t.value : '')).join('')).toBe('flop `Kd');
  });
});

describe('getUsedCardShorthands', () => {
  it('returns shorthands for all cards in backticks', () => {
    const used = getUsedCardShorthands('hero has `8s` `6h` flop `8d` `2c` `9h`');
    expect(used.has('8s')).toBe(true);
    expect(used.has('6h')).toBe(true);
    expect(used.has('8d')).toBe(true);
    expect(used.has('2c')).toBe(true);
    expect(used.has('9h')).toBe(true);
    expect(used.size).toBe(5);
  });

  it('includes x for unknown cards', () => {
    const used = getUsedCardShorthands('turn `x`');
    expect(used.has('x')).toBe(true);
    expect(used.size).toBe(1);
  });

  it('ignores text outside backticks', () => {
    const used = getUsedCardShorthands('Kd without backticks');
    expect(used.size).toBe(0);
  });
});
