import { MarketDataError } from '../src/types/market';
import type { History, QuoteFailure, QuotesResult, Quote, WindowId } from '../src/types/market';
import { TtlCache } from './cache';
import { normalizeHistory, normalizeQuote } from './yahoo/normalize';
import type { YahooSource } from './yahoo/yahooClient';
import { QUOTE_TTL_MS, WINDOW_SPECS } from './windows';

export interface MarketService {
  getQuotes(symbols: string[]): Promise<QuotesResult>;
  getHistory(symbol: string, window: WindowId): Promise<History>;
}

interface Options {
  source: YahooSource;
  cache?: TtlCache;
  now?: () => number;
}

export function createMarketService({ source, cache = new TtlCache(), now = Date.now }: Options): MarketService {
  return {
    async getQuotes(symbols) {
      const key = `quotes:${[...symbols].sort().join(',')}`;
      const raws = await cache.getOrLoad(key, QUOTE_TTL_MS, () => source.quote(symbols));
      const bySymbol = new Map(raws.map((r) => [r.symbol.toUpperCase(), r]));

      const quotes: Quote[] = [];
      const failed: QuoteFailure[] = [];
      for (const symbol of symbols) {
        const raw = bySymbol.get(symbol);
        if (!raw) {
          failed.push({ symbol, code: 'not_found', message: `No quote found for ${symbol}` });
          continue;
        }
        try {
          quotes.push(normalizeQuote(raw));
        } catch (error) {
          const e = error instanceof MarketDataError ? error : new MarketDataError('upstream', 'Invalid quote');
          failed.push({ symbol, code: e.code, message: e.message });
        }
      }
      return { quotes, failed };
    },

    getHistory(symbol, window) {
      const spec = WINDOW_SPECS[window];
      return cache.getOrLoad(`history:${symbol}:${window}`, spec.ttlMs, async () => {
        const raw = await source.chart(symbol, {
          period1: new Date(now() - spec.lookbackMs),
          interval: spec.interval,
        });
        return normalizeHistory(symbol, window, raw, spec);
      });
    },
  };
}
