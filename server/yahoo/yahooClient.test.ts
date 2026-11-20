// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MarketDataError } from '../../src/types/market';
import { mapYahooError } from './yahooClient';

describe('mapYahooError', () => {
  it('passes through errors that are already typed', () => {
    const original = new MarketDataError('upstream', 'x', true);
    expect(mapYahooError(original)).toBe(original);
  });

  it.each(['No data found, symbol may be delisted', 'Not Found', 'Quote not found for symbol: ZZZ'])(
    'maps "%s" to not_found',
    (message) => {
      expect(mapYahooError(new Error(message))).toMatchObject({ code: 'not_found', retryable: false });
    },
  );

  it('maps a bad request to invalid_symbol', () => {
    const error = new Error('Bad request');
    error.name = 'BadRequestError';
    expect(mapYahooError(error)).toMatchObject({ code: 'invalid_symbol' });
  });

  it('treats anything else as a retryable upstream failure without leaking internals', () => {
    const mapped = mapYahooError(new Error('ECONNRESET at 10.0.0.1:443'));
    expect(mapped).toMatchObject({ code: 'upstream', retryable: true });
    expect(mapped.message).not.toContain('10.0.0.1');
    expect(mapYahooError('a string')).toMatchObject({ code: 'upstream' });
  });
});
