import { describe, expect, it } from 'vitest';
import { mergeSeries, rebaseToPercent } from './transform';

describe('rebaseToPercent', () => {
  it('expresses closes as % change from the first point', () => {
    const out = rebaseToPercent([
      { t: 1, close: 100 },
      { t: 2, close: 110 },
      { t: 3, close: 95 },
    ]);
    expect(out.map((p) => p.close)).toEqual([0, 10, -5]);
  });

  it('returns an empty array for empty input', () => {
    expect(rebaseToPercent([])).toEqual([]);
  });

  it('returns an empty array when the base close is zero, to avoid dividing by zero', () => {
    expect(rebaseToPercent([{ t: 1, close: 0 }, { t: 2, close: 5 }])).toEqual([]);
  });

  it('starts at 0 for a single point and preserves timestamps', () => {
    expect(rebaseToPercent([{ t: 42, close: 250 }])).toEqual([{ t: 42, close: 0 }]);
  });

  it('rounds to two decimals', () => {
    const [, second] = rebaseToPercent([{ t: 1, close: 3 }, { t: 2, close: 4 }]);
    expect(second.close).toBe(33.33);
  });

  it('does not mutate its input', () => {
    const input = [{ t: 1, close: 100 }, { t: 2, close: 120 }];
    rebaseToPercent(input);
    expect(input).toEqual([{ t: 1, close: 100 }, { t: 2, close: 120 }]);
  });

  it('makes symbols with very different prices comparable', () => {
    const ibm = rebaseToPercent([{ t: 1, close: 250 }, { t: 2, close: 275 }]);
    const msft = rebaseToPercent([{ t: 1, close: 500 }, { t: 2, close: 550 }]);
    expect(ibm[1].close).toBe(msft[1].close);
  });
});

describe('mergeSeries', () => {
  it('aligns series on a sorted time axis and fills gaps with null', () => {
    const rows = mergeSeries([
      { symbol: 'A', points: [{ t: 1, close: 1 }, { t: 3, close: 3 }] },
      { symbol: 'B', points: [{ t: 2, close: 2 }, { t: 3, close: 30 }] },
    ]);
    expect(rows).toEqual([
      { t: 1, A: 1, B: null },
      { t: 2, A: null, B: 2 },
      { t: 3, A: 3, B: 30 },
    ]);
  });

  it('returns no rows for no series', () => {
    expect(mergeSeries([])).toEqual([]);
  });

  it('sorts rows even when input points are out of order', () => {
    const rows = mergeSeries([{ symbol: 'A', points: [{ t: 3, close: 3 }, { t: 1, close: 1 }] }]);
    expect(rows.map((r) => r.t)).toEqual([1, 3]);
  });

  it('keeps a symbol with no points as null on every row', () => {
    const rows = mergeSeries([
      { symbol: 'A', points: [{ t: 1, close: 1 }] },
      { symbol: 'B', points: [] },
    ]);
    expect(rows).toEqual([{ t: 1, A: 1, B: null }]);
  });

  it('keeps a legitimate 0 value instead of treating it as missing', () => {
    const rows = mergeSeries([{ symbol: 'A', points: [{ t: 1, close: 0 }] }]);
    expect(rows[0].A).toBe(0);
  });

  it('works end to end with rebaseToPercent', () => {
    const rows = mergeSeries([
      { symbol: 'IBM', points: rebaseToPercent([{ t: 1, close: 200 }, { t: 2, close: 210 }]) },
      { symbol: 'MSFT', points: rebaseToPercent([{ t: 1, close: 400 }, { t: 2, close: 380 }]) },
    ]);
    expect(rows).toEqual([
      { t: 1, IBM: 0, MSFT: 0 },
      { t: 2, IBM: 5, MSFT: -5 },
    ]);
  });
});
