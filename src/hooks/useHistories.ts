import { useCallback } from 'react';
import type { SymbolSeries } from '../domain/transform';
import type { MarketDataService } from '../services';
import type { WindowId } from '../types/market';
import { useAsyncData } from './useAsyncData';

export interface HistoriesResult {
  series: SymbolSeries[];
  /** symbols that failed to load, so one bad symbol does not blank the chart */
  failed: string[];
}

export function useHistories(service: MarketDataService, symbols: string[], window: WindowId) {
  const key = symbols.join(',');
  const load = useCallback(async (): Promise<HistoriesResult> => {
    const list = key.split(',').filter(Boolean);
    const results = await Promise.allSettled(list.map((s) => service.getHistory(s, window)));
    const series: SymbolSeries[] = [];
    const failed: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') series.push({ symbol: list[i], points: r.value.points });
      else failed.push(list[i]);
    });
    if (series.length === 0 && failed.length > 0) {
      throw new Error('Unable to load market history for any symbol');
    }
    return { series, failed };
  }, [service, key, window]);
  return useAsyncData(load);
}
