import type { WindowId } from '../src/types/market';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WindowSpec {
  /** How far back to request from Yahoo. */
  lookbackMs: number;
  interval: '5m' | '30m' | '1d';
  /**
   * Keep only the most recent trading session. The day view requests a few days
   * so weekends and holidays still return the last session.
   */
  latestSessionOnly: boolean;
  /** How long a normalized response may be served from cache. */
  ttlMs: number;
}

/** Add an entry here (and in src/config/timeWindows.ts) to support a new window. */
export const WINDOW_SPECS: Record<WindowId, WindowSpec> = {
  day: { lookbackMs: 7 * DAY_MS, interval: '5m', latestSessionOnly: true, ttlMs: 60_000 },
  week: { lookbackMs: 7 * DAY_MS, interval: '30m', latestSessionOnly: false, ttlMs: 5 * 60_000 },
  quarter: { lookbackMs: 92 * DAY_MS, interval: '1d', latestSessionOnly: false, ttlMs: 60 * 60_000 },
};

export const QUOTE_TTL_MS = 30_000;
