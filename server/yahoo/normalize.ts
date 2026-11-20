import { MarketDataError } from '../../src/types/market';
import type { History, Quote, WindowId } from '../../src/types/market';
import type { WindowSpec } from '../windows';

/**
 * Minimal shapes this layer needs from Yahoo. Keeping them local means the
 * normalization code (and its tests) never depends on the yahoo-finance2 types.
 */
export interface RawQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: Date | number;
}

export interface RawChart {
  meta: { exchangeTimezoneName?: string };
  quotes: Array<{ date: Date; close?: number | null }>;
}

const round2 = (n: number) => Number(n.toFixed(2));
const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function normalizeQuote(raw: RawQuote): Quote {
  if (!isNumber(raw.regularMarketPrice)) {
    throw new MarketDataError('upstream', `Yahoo returned no price for ${raw.symbol}`, true);
  }
  const time = raw.regularMarketTime;
  return {
    symbol: raw.symbol.toUpperCase(),
    name: raw.shortName ?? raw.longName ?? raw.symbol,
    price: round2(raw.regularMarketPrice),
    change: round2(raw.regularMarketChange ?? 0),
    changePercent: round2(raw.regularMarketChangePercent ?? 0),
    currency: raw.currency ?? 'USD',
    asOf: time instanceof Date ? time.getTime() : (time ?? Date.now()),
  };
}

/** Calendar date ("2025-01-02") of a timestamp in the exchange's timezone. */
function sessionKey(t: number, timeZone: string): string {
  const format = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
  try {
    return format(timeZone);
  } catch {
    return format('UTC');
  }
}

export function normalizeHistory(
  symbol: string,
  window: WindowId,
  raw: RawChart,
  spec: Pick<WindowSpec, 'latestSessionOnly'>,
): History {
  // Yahoo emits null closes for halted or missing bars. Drop them, then sort and de-duplicate by time.
  const byTime = new Map<number, number>();
  for (const q of raw.quotes) {
    if (isNumber(q.close)) byTime.set(q.date.getTime(), round2(q.close));
  }
  let points = [...byTime.entries()].sort(([a], [b]) => a - b).map(([t, close]) => ({ t, close }));

  if (spec.latestSessionOnly && points.length > 0) {
    const tz = raw.meta.exchangeTimezoneName ?? 'UTC';
    const latest = sessionKey(points[points.length - 1].t, tz);
    points = points.filter((p) => sessionKey(p.t, tz) === latest);
  }

  if (points.length === 0) {
    throw new MarketDataError('not_found', `No price history available for ${symbol}`);
  }
  return { symbol, window, points };
}
