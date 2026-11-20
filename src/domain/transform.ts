import type { PricePoint } from '../types/market';

export interface SymbolSeries {
  symbol: string;
  points: PricePoint[];
}

/** One chart row: a timestamp plus one value per symbol (null = no data). */
export type ChartRow = { t: number } & Record<string, number | null>;

/** Converts closes to % change relative to the first point, so symbols with different prices compare fairly. */
export function rebaseToPercent(points: PricePoint[]): PricePoint[] {
  if (points.length === 0 || points[0].close === 0) return [];
  const base = points[0].close;
  return points.map((p) => ({ t: p.t, close: Number((((p.close - base) / base) * 100).toFixed(2)) }));
}

/** Merges per-symbol series onto a shared, sorted time axis. Missing values stay null. */
export function mergeSeries(series: SymbolSeries[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();
  for (const { symbol, points } of series) {
    for (const { t, close } of points) {
      const row = rows.get(t) ?? ({ t } as ChartRow);
      row[symbol] = close;
      rows.set(t, row);
    }
  }
  const symbols = series.map((s) => s.symbol);
  return [...rows.values()]
    .sort((a, b) => a.t - b.t)
    .map((row) => {
      for (const symbol of symbols) row[symbol] ??= null;
      return row;
    });
}
