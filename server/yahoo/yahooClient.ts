import YahooFinance from 'yahoo-finance2';
import { MarketDataError } from '../../src/types/market';
import type { RawChart, RawQuote } from './normalize';

/** What the market service needs from a data provider. Tests and alternate providers implement this. */
export interface YahooSource {
  quote(symbols: string[]): Promise<RawQuote[]>;
  chart(symbol: string, options: { period1: Date; interval: '5m' | '30m' | '1d' }): Promise<RawChart>;
}

export function mapYahooError(error: unknown): MarketDataError {
  if (error instanceof MarketDataError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/no data found|not found|delisted/i.test(message)) {
    return new MarketDataError('not_found', 'Symbol not found');
  }
  if (error instanceof Error && error.name === 'BadRequestError') {
    return new MarketDataError('invalid_symbol', 'Yahoo rejected the symbol');
  }
  return new MarketDataError('upstream', 'Market data provider is unavailable', true);
}

/** The only module that imports yahoo-finance2. */
export function createYahooSource(): YahooSource {
  const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  return {
    async quote(symbols) {
      try {
        const results = await yahoo.quote(symbols);
        return results.flatMap((q): RawQuote[] => (q.symbol ? [{ ...q, symbol: q.symbol }] : []));
      } catch (error) {
        throw mapYahooError(error);
      }
    },
    async chart(symbol, { period1, interval }) {
      try {
        return await yahoo.chart(symbol, { period1, interval, return: 'array' });
      } catch (error) {
        throw mapYahooError(error);
      }
    },
  };
}
