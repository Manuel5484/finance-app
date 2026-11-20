import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { MarketDataService } from '../services';
import { createMockMarketDataService } from '../services';
import { MarketDataError } from '../types/market';

// Recharts cannot measure layout in jsdom, so stub the chart wrapper.
vi.mock('../components/charts/PerformanceChart', () => ({
  PerformanceChart: ({ rows, window }: { rows: Array<Record<string, unknown>>; window: string }) => (
    <div data-testid="performance-chart" data-window={window} data-rows={rows.length}>
      {rows.length > 0 ? Object.keys(rows[0]).join(',') : 'empty'}
    </div>
  ),
}));

const ALL = ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'];

describe('DashboardPage', () => {
  it('renders quote cards for IBM and competitors and switches time windows', async () => {
    render(<App service={createMockMarketDataService({ latencyMs: 0 })} />);

    expect(await screen.findByTestId('quote-IBM')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^quote-/)).toHaveLength(5);
    expect(await screen.findByTestId('performance-chart')).toHaveAttribute('data-window', 'day');

    await userEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));
    await waitFor(() => expect(screen.getByTestId('performance-chart')).toHaveAttribute('data-window', 'quarter'));
  });

  it('passes one rebased series per company to the chart', async () => {
    render(<App service={createMockMarketDataService({ latencyMs: 0 })} />);
    const chart = await screen.findByTestId('performance-chart');
    expect(chart).toHaveTextContent('t,IBM,MSFT,ORCL,SAP,CRM');
    expect(Number(chart.getAttribute('data-rows'))).toBeGreaterThan(0);
  });

  it('requests history for the newly selected window only', async () => {
    const base = createMockMarketDataService({ latencyMs: 0 });
    const getHistory = vi.fn(base.getHistory);
    render(<App service={{ ...base, getHistory }} />);
    await screen.findByTestId('performance-chart');
    expect(getHistory.mock.calls.every(([, w]) => w === 'day')).toBe(true);

    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));
    await waitFor(() => expect(getHistory).toHaveBeenCalledWith('IBM', 'week'));
  });

  it('shows partial-data notices when one symbol fails', async () => {
    render(<App service={createMockMarketDataService({ latencyMs: 0, failSymbols: ['SAP'] })} />);
    expect(await screen.findByText('Unavailable: SAP')).toBeInTheDocument();
    expect(await screen.findByText('Quotes unavailable: SAP')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^quote-/)).toHaveLength(4);
    expect(screen.queryByTestId('quote-SAP')).not.toBeInTheDocument();
  });

  it('shows an error state with retry when every request fails', async () => {
    render(<App service={createMockMarketDataService({ latencyMs: 0, failSymbols: ALL })} />);
    expect((await screen.findAllByRole('alert')).length).toBe(2);
    expect(screen.getAllByRole('button', { name: 'Retry' }).length).toBe(2);
    expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument();
  });

  it('recovers when Retry is clicked after a transient failure', async () => {
    const base = createMockMarketDataService({ latencyMs: 0 });
    let failing = true;
    const service: MarketDataService = {
      getHistory: base.getHistory,
      getQuotes: async (symbols) => {
        if (failing) throw new MarketDataError('network', 'Unable to reach the market data service', true);
        return base.getQuotes(symbols);
      },
    };
    render(<App service={service} />);

    expect(await screen.findByText('Unable to reach the market data service')).toBeInTheDocument();
    failing = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByTestId('quote-IBM')).toBeInTheDocument();
    expect(screen.queryByText('Unable to reach the market data service')).not.toBeInTheDocument();
  });

  it('shows a loading state before data arrives', () => {
    render(<App service={createMockMarketDataService({ latencyMs: 50 })} />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});
