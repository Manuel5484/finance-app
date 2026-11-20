import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COMPANIES } from '../../config/companies';
import { PerformanceChart } from './PerformanceChart';

describe('PerformanceChart (real Recharts, not stubbed)', () => {
  it('shows an empty message instead of an empty chart when there is no data', () => {
    render(<PerformanceChart rows={[]} companies={COMPANIES} window="week" />);
    expect(screen.getByText('No data available for this period.')).toBeInTheDocument();
    expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument();
  });

  it('mounts the chart container without crashing when data is present', () => {
    // jsdom has no layout, so Recharts draws no SVG here; this guards against render-time exceptions.
    const rows = [
      { t: Date.parse('2025-01-02T15:00:00Z'), IBM: 0, MSFT: 0, ORCL: null, SAP: 0, CRM: 0 },
      { t: Date.parse('2025-01-03T15:00:00Z'), IBM: 1.5, MSFT: -0.5, ORCL: null, SAP: 2, CRM: 0.1 },
    ];
    for (const window of ['day', 'week', 'quarter'] as const) {
      const { unmount } = render(<PerformanceChart rows={rows} companies={COMPANIES} window={window} />);
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
      unmount();
    }
  });
});
