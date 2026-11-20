import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Quote } from '../../types/market';
import { ChartCard } from '../charts/ChartCard';
import { QuoteCard } from './QuoteCard';
import { TimeWindowTabs } from '../layout/TimeWindowTabs';

const quote = (overrides: Partial<Quote> = {}): Quote => ({
  symbol: 'IBM',
  name: 'IBM',
  price: 227.29,
  change: -1.24,
  changePercent: -0.54,
  currency: 'USD',
  asOf: 0,
  ...overrides,
});

describe('QuoteCard', () => {
  it('shows price, a negative change without a plus sign, and the down style', () => {
    render(<QuoteCard quote={quote()} />);
    const card = screen.getByTestId('quote-IBM');
    expect(card).toHaveTextContent('$227.29');
    expect(card).toHaveTextContent('-1.24 (-0.54%)');
    expect(card).not.toHaveTextContent('+');
    expect(card).toHaveClass('quote-card--down');
  });

  it('shows a plus sign and the up style for a gain', () => {
    render(<QuoteCard quote={quote({ change: 8, changePercent: 1.58 })} />);
    const card = screen.getByTestId('quote-IBM');
    expect(card).toHaveTextContent('+8.00 (+1.58%)');
    expect(card).toHaveClass('quote-card--up');
  });

  it('treats an unchanged price as up, with no minus sign', () => {
    render(<QuoteCard quote={quote({ change: 0, changePercent: 0 })} />);
    expect(screen.getByTestId('quote-IBM')).toHaveTextContent('+0.00 (+0.00%)');
  });
});

describe('TimeWindowTabs', () => {
  it('renders the three windows and marks the selected one', () => {
    render(<TimeWindowTabs value="week" onChange={() => {}} />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Current day', 'Last 7 days', 'Last quarter']);
    expect(screen.getByRole('tab', { name: 'Last 7 days' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Current day' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the clicked window', async () => {
    const onChange = vi.fn();
    render(<TimeWindowTabs value="day" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));
    expect(onChange).toHaveBeenCalledWith('quarter');
  });
});

describe('ChartCard', () => {
  it('shows a loading state and hides content while loading', () => {
    render(<ChartCard title="T" status="loading"><p>content</p></ChartCard>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the error message and calls onRetry', async () => {
    const onRetry = vi.fn();
    render(<ChartCard title="T" status="error" error={new Error('Boom')} onRetry={onRetry}><p>content</p></ChartCard>);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('falls back to a generic message when the error has none', () => {
    render(<ChartCard title="T" status="error"><p>content</p></ChartCard>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('renders content, subtitle and notice on success', () => {
    render(<ChartCard title="T" subtitle="sub" notice="Unavailable: SAP" status="success"><p>content</p></ChartCard>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('sub')).toBeInTheDocument();
    expect(screen.getByText('Unavailable: SAP')).toBeInTheDocument();
  });
});
