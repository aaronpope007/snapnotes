import { describe, it, expect } from 'vitest';
import {
  parseNoteToSegments,
  segmentsToNote,
  insertCardAt,
  insertCardInTextSegment,
  insertTextAt,
  removeCardNear,
  displayStateForEditing,
} from './noteSegments';

describe('noteSegments', () => {
  it('round-trips bracket cards and text', () => {
    const text = '[7d][6d] limp/call iso IP';
    const segments = parseNoteToSegments(text);
    expect(segmentsToNote(segments)).toBe(text);
  });

  it('parses legacy backtick cards', () => {
    const segments = parseNoteToSegments('flop `Kd` call');
    expect(segments).toEqual([
      { type: 'text', value: 'flop ' },
      { type: 'card', rank: 'K', suit: 'd', backdoor: false },
      { type: 'text', value: ' call' },
    ]);
  });

  it('inserts card at index', () => {
    const segments = insertCardAt([{ type: 'text', value: 'flop ' }], 1, 'Jc');
    expect(segmentsToNote(segments)).toBe('flop [jc]');
  });

  it('inserts text merging with adjacent text', () => {
    const segments = insertTextAt([{ type: 'text', value: 'flop' }], 1, ' turn');
    expect(segmentsToNote(segments)).toBe('flop turn');
  });

  it('removes nearest matching card', () => {
    const segments = parseNoteToSegments('[7d][6d]');
    const next = removeCardNear(segments, '7d', 1);
    expect(segmentsToNote(next)).toBe('[6d]');
  });

  it('adds leading and trailing text fields around cards for continued typing', () => {
    const cardsOnly = parseNoteToSegments('[7d][6d]');
    expect(displayStateForEditing(cardsOnly)).toEqual({
      leadingSynthetic: true,
      trailingSynthetic: true,
      segments: [
        { type: 'text', value: '' },
        { type: 'card', rank: '7', suit: 'd', backdoor: false },
        { type: 'card', rank: '6', suit: 'd', backdoor: false },
        { type: 'text', value: '' },
      ],
    });
  });

  it('splits text at cursor when inserting a card mid-text', () => {
    const segments = [{ type: 'text' as const, value: 'second word and' }];
    const result = insertCardInTextSegment(segments, 0, 12, 'kd');
    expect(segmentsToNote(result.segments)).toBe('second word [kd]and');
    expect(result.focusTextIndex).toBe(2);
    expect(result.focusOffset).toBe(0);
  });
});
