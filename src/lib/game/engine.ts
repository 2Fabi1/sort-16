export const TEMPLATE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Fisher-Yates shuffle of the first `length` characters of TEMPLATE.
 */
export function createShuffledString(length: number): string {
  const chars = TEMPLATE.slice(0, length).split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Shift all characters in the string by one position.
 * 'left':  first char moves to end   — "ABCD" => "BCDA"
 * 'right': last char moves to front   — "ABCD" => "DABC"
 */
export function shiftByOne(text: string, direction: 'left' | 'right'): string {
  if (text.length <= 1) return text;
  if (direction === 'left') {
    return text.slice(1) + text[0];
  }
  return text[text.length - 1] + text.slice(0, -1);
}

/**
 * Format the game string with spaces between characters and brackets
 * around the active bracket region.
 *
 * Replicates the original bracket_first_x(text, start, end) behaviour,
 * but accepts (text, bracketStart, bracketSize) and converts internally.
 */
export function formatBracketDisplay(
  text: string,
  bracketStart: number,
  bracketSize: number
): string {
  const end = Math.min(bracketStart + bracketSize, text.length);
  const chars = text.split('');
  const spaced = chars.join('  ').split('  ');

  const beforeBracket = spaced.slice(0, bracketStart).join('  ');
  const insideBracket = spaced.slice(bracketStart, end).join('  ');
  const afterBracket = spaced.slice(end).join('  ');

  const firstPart = beforeBracket + ' [ ' + insideBracket + ' ]';
  return firstPart + (afterBracket ? '  ' + afterBracket : '');
}

/**
 * Check whether the current string matches the solved state.
 */
export function checkWin(current: string, length: number): boolean {
  return current === TEMPLATE.slice(0, length);
}
