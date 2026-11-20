import { COMPANIES } from '../config/companies';
import { MarketDataError } from '../types/market';
import type { History, PricePoint, Quote, QuotesResult, WindowId } from '../types/market';
import type { MarketDataService } from './MarketDataService';

const BASE_PRICES: Record<string, number> = {
  IBM: 250,
  MSFT: 420,
  ORCL: 170,
  SAP: 260,
  CRM: 300,
};

const WINDOW_SHAPE: Record<WindowId, { count: number; stepMs: number }> = {
  day: { count: 78, stepMs: 5 * 60_000 },
  week: { count: 7 * 13, stepMs: 30 * 60_000 },
  quarter: { count: 63, stepMs: 24 * 3_600_000 },
};

function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPoints(symbol: string, window: WindowId, now: number): PricePoint[] {
  const base = BASE_PRICES[symbol];
  const { count, stepMs } = WINDOW_SHAPE[window];
  const rand = seededRandom(`${symbol}:${window}`);
  const points: PricePoint[] = [];
  let price = base;
  for (let i = 0; i < count; i++) {
    price = Math.max(1, price * (1 + (rand() - 0.48) * 0.01));
    points.push({ t: now - (count - 1 - i) * stepMs, close: Number(price.toFixed(2)) });
  }
  return points;
}

function assertKnown(symbol: string): void {
  if (!(symbol in BASE_PRICES)) {
    throw new MarketDataError('not_found', `No data available for symbol "${symbol}"`);
  }
}

export interface MockOptions {
  /** simulated latency in ms (use 0 in tests) */
  latencyMs?: number;
  /** symbols that should fail, to exercise error states */
  failSymbols?: string[];
  now?: () => number;
}

export function createMockMarketDataService(options: MockOptions = {}): MarketDataService {
  const { latencyMs = 150, failSymbols = [], now = Date.now } = options;
  const delay = () => new Promise<void>((resolve) => setTimeout(resolve, latencyMs));

  async function guard(symbol: string): Promise<void> {
    await delay();
    if (failSymbols.includes(symbol)) {
      throw new MarketDataError('upstream', `Upstream error for ${symbol}`, true);
    }
    assertKnown(symbol);
  }

  return {
    async getHistory(symbol, window): Promise<History> {
      await guard(symbol);
      return { symbol, window, points: buildPoints(symbol, window, now()) };
    },

    async getQuotes(symbols): Promise<QuotesResult> {
      const settled = await Promise.allSettled(
        symbols.map(async (symbol): Promise<Quote> => {
          await guard(symbol);
          const points = buildPoints(symbol, 'day', now());
          const first = points[0].close;
          const last = points[points.length - 1];
          const change = Number((last.close - first).toFixed(2));
          return {
            symbol,
            name: COMPANIES.find((c) => c.symbol === symbol)?.name ?? symbol,
            price: last.close,
            change,
            changePercent: Number(((change / first) * 100).toFixed(2)),
            currency: 'USD',
            asOf: last.t,
          };
        }),
      );
      const result: QuotesResult = { quotes: [], failed: [] };
      settled.forEach((r, i) => {
        if (r.status === 'fulfilled') result.quotes.push(r.value);
        else {
          const e = r.reason instanceof MarketDataError ? r.reason : new MarketDataError('upstream', 'Failed');
          result.failed.push({ symbol: symbols[i], code: e.code, message: e.message });
        }
      });
      return result;
    },
  };
}
