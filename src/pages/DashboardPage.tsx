import { useMemo, useState } from 'react';
import { QuoteCardGrid } from '../components/cards/QuoteCardGrid';
import { ChartCard } from '../components/charts/ChartCard';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import { COMPANIES } from '../config/companies';
import { DEFAULT_WINDOW, TIME_WINDOWS } from '../config/timeWindows';
import { mergeSeries, rebaseToPercent } from '../domain/transform';
import { useHistories } from '../hooks/useHistories';
import { useQuotes } from '../hooks/useQuotes';
import type { MarketDataService } from '../services';
import type { WindowId } from '../types/market';

const SYMBOLS = COMPANIES.map((c) => c.symbol);

export function DashboardPage({ service }: { service: MarketDataService }) {
  const [window, setWindow] = useState<WindowId>(DEFAULT_WINDOW);
  const quotes = useQuotes(service, SYMBOLS);
  const histories = useHistories(service, SYMBOLS, window);

  const rows = useMemo(
    () =>
      histories.data
        ? mergeSeries(
            histories.data.series.map((s) => ({ symbol: s.symbol, points: rebaseToPercent(s.points) })),
          )
        : [],
    [histories.data],
  );
  const failed = histories.data?.failed ?? [];
  const failedQuotes = quotes.data?.failed.map((f) => f.symbol) ?? [];
  const windowConfig = TIME_WINDOWS.find((w) => w.id === window)!;

  return (
    <>
      <ChartCard
        title="Market summary"
        subtitle="Latest quotes"
        status={quotes.status}
        error={quotes.error}
        onRetry={quotes.reload}
        notice={failedQuotes.length > 0 ? `Quotes unavailable: ${failedQuotes.join(', ')}` : undefined}
      >
        <QuoteCardGrid quotes={quotes.data?.quotes ?? []} />
      </ChartCard>

      <TimeWindowTabs value={window} onChange={setWindow} />

      <ChartCard
        title={windowConfig.title}
        status={histories.status}
        error={histories.error}
        onRetry={histories.reload}
        notice={failed.length > 0 ? `Unavailable: ${failed.join(', ')}` : undefined}
      >
        <PerformanceChart rows={rows} companies={COMPANIES} window={window} />
      </ChartCard>
    </>
  );
}
