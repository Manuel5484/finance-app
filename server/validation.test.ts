// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MAX_SYMBOLS, parseSymbol, parseSymbols, parseWindow } from './validation';

describe('parseSymbol', () => {
  it.each([
    ['ibm', 'IBM'],
    ['  msft ', 'MSFT'],
    ['BRK-B', 'BRK-B'],
    ['SAP.DE', 'SAP.DE'],
    ['^GSPC', '^GSPC'],
    ['EURUSD=X', 'EURUSD=X'],
  ])('accepts and normalizes %s', (input, expected) => {
    expect(parseSymbol(input)).toBe(expected);
  });

  it.each([[''], ['   '], ['<script>'], ['IBM MSFT'], ['A'.repeat(16)], ['../etc'], [undefined], [42], [['IBM']]])(
    'rejects %j',
    (input) => {
      expect(() => parseSymbol(input)).toThrowError(expect.objectContaining({ code: 'invalid_symbol' }));
    },
  );
});

describe('parseSymbols', () => {
  it('splits, normalizes and de-duplicates', () => {
    expect(parseSymbols('ibm,msft,IBM')).toEqual(['IBM', 'MSFT']);
  });

  it('rejects an empty or missing list', () => {
    expect(() => parseSymbols('')).toThrowError(expect.objectContaining({ code: 'invalid_symbol' }));
    expect(() => parseSymbols(undefined)).toThrowError(expect.objectContaining({ code: 'invalid_symbol' }));
  });

  it('rejects the whole list when one entry is invalid', () => {
    expect(() => parseSymbols('IBM,,MSFT')).toThrowError(expect.objectContaining({ code: 'invalid_symbol' }));
  });

  it('enforces the maximum number of symbols', () => {
    const ok = Array.from({ length: MAX_SYMBOLS }, (_, i) => `S${i}`).join(',');
    const tooMany = `${ok},EXTRA`;
    expect(parseSymbols(ok)).toHaveLength(MAX_SYMBOLS);
    expect(() => parseSymbols(tooMany)).toThrowError(expect.objectContaining({ code: 'invalid_symbol' }));
  });
});

describe('parseWindow', () => {
  it.each(['day', 'week', 'quarter'])('accepts %s', (w) => {
    expect(parseWindow(w)).toBe(w);
  });

  it.each([['year'], [''], [undefined], ['constructor'], ['__proto__']])('rejects %j', (w) => {
    expect(() => parseWindow(w)).toThrowError(expect.objectContaining({ code: 'invalid_symbol' }));
  });
});
