import type { History, QuotesResult, WindowId } from '../types/market';

/**
 * The only contract the UI depends on. Implementations: mock (offline fixtures)
 * and http (a backend proxy wrapping Yahoo Finance). Add new sources by
 * implementing this interface.
 */
export interface MarketDataService {
  getQuotes(symbols: string[]): Promise<QuotesResult>;
  getHistory(symbol: string, window: WindowId): Promise<History>;
}
