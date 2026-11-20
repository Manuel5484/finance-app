// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MarketDataError } from '../../src/types/market';
import { normalizeHistory, normalizeQuote } from './normalize';

describe('normalizeQuote', () => {
  it('maps a Yahoo quote to the shared Quote shape', () => {
    const quote = normalizeQuote({
      symbol: 'ibm',
      shortName: 'International Business Machines',
      currency: 'USD',
      regularMarketPrice: 251.456,
      regularMarketChange: -1.234,
      regularMarketChangePercent: -0.4883,
      regularMarketTime: new Date('2025-01-02T21:00:00Z'),
    });
    expect(quote).toEqual({
      symbol: 'IBM',
      name: 'International Business Machines',
      price: 251.46,
      change: -1.23,
      changePercent: -0.49,
      currency: 'USD',
      asOf: Date.parse('2025-01-02T21:00:00Z'),
    });
  });

  it('defaults missing optional fields', () => {
    const quote = normalizeQuote({ symbol: 'SAP', regularMarketPrice: 100 });
    expect(quote).toMatchObject({ name: 'SAP', change: 0, changePercent: 0, currency: 'USD' });
  });

  it('rejects a quote without a price', () => {
    expect(() => normalizeQuote({ symbol: 'IBM' })).toThrow(MarketDataError);
  });
});

describe('normalizeHistory', () => {
  const bar = (iso: string, close: number | null) => ({ date: new Date(iso), close });

  it('drops null closes, sorts by time and removes duplicates', () => {
    const history = normalizeHistory(
      'IBM',
      'week',
      {
        meta: {},
        quotes: [
          bar('2025-01-03T15:00:00Z', 12),
          bar('2025-01-02T15:00:00Z', 10),
          bar('2025-01-02T15:30:00Z', null),
          bar('2025-01-02T15:00:00Z', 11),
        ],
      },
      { latestSessionOnly: false },
    );
    expect(history.points).toEqual([
      { t: Date.parse('2025-01-02T15:00:00Z'), close: 11 },
      { t: Date.parse('2025-01-03T15:00:00Z'), close: 12 },
    ]);
  });

  it('keeps only the latest session in the exchange timezone for the day view', () => {
    const history = normalizeHistory(
      'IBM',
      'day',
      {
        meta: { exchangeTimezoneName: 'America/New_York' },
        quotes: [
          bar('2025-01-02T15:00:00Z', 1),
          bar('2025-01-03T15:00:00Z', 2),
          bar('2025-01-03T15:05:00Z', 3),
        ],
      },
      { latestSessionOnly: true },
    );
    expect(history.points.map((p) => p.close)).toEqual([2, 3]);
  });

  it('throws not_found when nothing usable remains', () => {
    expect(() =>
      normalizeHistory('XXX', 'week', { meta: {}, quotes: [bar('2025-01-02T15:00:00Z', null)] }, { latestSessionOnly: false }),
    ).toThrowError(expect.objectContaining({ code: 'not_found' }));
  });
});
