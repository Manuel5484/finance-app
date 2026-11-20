import { useCallback } from 'react';
import type { MarketDataService } from '../services';
import type { QuotesResult } from '../types/market';
import { useAsyncData } from './useAsyncData';

export function useQuotes(service: MarketDataService, symbols: string[]) {
  const key = symbols.join(',');
  const load = useCallback(async (): Promise<QuotesResult> => {
    const result = await service.getQuotes(key.split(',').filter(Boolean));
    if (result.quotes.length === 0 && result.failed.length > 0) {
      throw new Error(result.failed[0].message);
    }
    return result;
  }, [service, key]);
  return useAsyncData(load);
}
