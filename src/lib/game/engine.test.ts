import { describe, it, expect } from 'vitest';
import {
  TEMPLATE,
  createShuffledString,
  shiftByOne,
  formatBracketDisplay,
  checkWin
} from './engine';

describe('TEMPLATE', () => {
  it('contains 0-9 then A-Z', () => {
    expect(TEMPLATE).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('has length 36', () => {
    expect(TEMPLATE).toHaveLength(36);
  });
});

describe('createShuffledString', () => {
  it('returns a string of the requested length', () => {
    for (const len of [8, 16, 36]) {
      expect(createShuffledString(len)).toHaveLength(len);
    }
  });

  it('contains exactly the same characters as the template prefix', () => {
    for (const len of [8, 16, 36]) {
      const result = createShuffledString(len);
      const expected = TEMPLATE.slice(0, len);
      expect([...result].sort().join('')).toBe([...expected].sort().join(''));
    }
  });

  it('produces a shuffled result (not identical to template) for non-trivial lengths', () => {
    // With 36 characters the probability of a no-op shuffle is 1/36! — effectively zero.
    // Run a few times for extra confidence.
    const results = Array.from({ length: 5 }, () => createShuffledString(36));
    const allSame = results.every((r) => r === TEMPLATE);
    expect(allSame).toBe(false);
  });

  it('returns the single character for length 1', () => {
    expect(createShuffledString(1)).toBe('0');
  });
});

describe('shiftByOne', () => {
  it('shifts left: first character moves to end', () => {
    expect(shiftByOne('ABCD', 'left')).toBe('BCDA');
  });

  it('shifts right: last character moves to front', () => {
    expect(shiftByOne('ABCD', 'right')).toBe('DABC');
  });

  it('returns the same single character when shifting left', () => {
    expect(shiftByOne('X', 'left')).toBe('X');
  });

  it('returns the same single character when shifting right', () => {
    expect(shiftByOne('X', 'right')).toBe('X');
  });

  it('returns empty string for empty input (left)', () => {
    expect(shiftByOne('', 'left')).toBe('');
  });

  it('returns empty string for empty input (right)', () => {
    expect(shiftByOne('', 'right')).toBe('');
  });

  it('handles two-character string', () => {
    expect(shiftByOne('AB', 'left')).toBe('BA');
    expect(shiftByOne('AB', 'right')).toBe('BA');
  });
});

describe('formatBracketDisplay', () => {
  it('places bracket at the start', () => {
    // Original: bracket_first_x('3021', 0, 2) => ' [ 3  0 ]  2  1'
    expect(formatBracketDisplay('3021', 0, 2)).toBe(' [ 3  0 ]  2  1');
  });

  it('places bracket in the middle', () => {
    // Original: bracket_first_x('3021', 1, 3) => '3 [ 0  2 ]  1'
    expect(formatBracketDisplay('3021', 1, 2)).toBe('3 [ 0  2 ]  1');
  });

  it('places bracket at the end', () => {
    // Original: bracket_first_x('3021', 2, 4) => '3  0 [ 2  1 ]'
    expect(formatBracketDisplay('3021', 2, 2)).toBe('3  0 [ 2  1 ]');
  });

  it('handles bracket covering entire string', () => {
    expect(formatBracketDisplay('3021', 0, 4)).toBe(' [ 3  0  2  1 ]');
  });

  it('handles single-character string', () => {
    expect(formatBracketDisplay('A', 0, 1)).toBe(' [ A ]');
  });

  it('handles bracket size of 1', () => {
    expect(formatBracketDisplay('ABC', 1, 1)).toBe('A [ B ]  C');
  });

  it('clamps bracket size to text length', () => {
    // bracketSize exceeds remaining chars
    expect(formatBracketDisplay('AB', 1, 5)).toBe('A [ B ]');
  });
});

describe('checkWin', () => {
  it('returns true when string matches sorted template prefix', () => {
    expect(checkWin('01234567', 8)).toBe(true);
  });

  it('returns false when string is not sorted', () => {
    expect(checkWin('10234567', 8)).toBe(false);
  });

  it('returns true for full 36-character sorted string', () => {
    expect(checkWin(TEMPLATE, 36)).toBe(true);
  });

  it('returns false for a shuffled 36-character string', () => {
    const shuffled = TEMPLATE.split('').reverse().join('');
    expect(checkWin(shuffled, 36)).toBe(false);
  });

  it('returns true for single character', () => {
    expect(checkWin('0', 1)).toBe(true);
  });

  it('returns false when length does not match content', () => {
    // '012' is correct for length 3, not for length 4
    expect(checkWin('012', 4)).toBe(false);
  });
});
