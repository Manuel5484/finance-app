import { createHttpMarketDataService } from './httpMarketDataService';
import { createMockMarketDataService } from './mockMarketDataService';
import type { MarketDataService } from './MarketDataService';

export type { MarketDataService } from './MarketDataService';
export { createMockMarketDataService } from './mockMarketDataService';
export { createHttpMarketDataService } from './httpMarketDataService';

/** Selects the data source from VITE_DATA_SOURCE ("mock" by default). */
export function createDefaultService(): MarketDataService {
  return import.meta.env.VITE_DATA_SOURCE === 'http'
    ? createHttpMarketDataService()
    : createMockMarketDataService();
}
