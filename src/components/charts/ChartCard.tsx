import type { ReactNode } from 'react';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import type { AsyncStatus } from '../../hooks/useAsyncData';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  status: AsyncStatus;
  error?: Error;
  onRetry?: () => void;
  /** Optional notice shown above the content, e.g. partial-data warnings. */
  notice?: string;
  children: ReactNode;
}

/** Reusable titled card that owns loading and error presentation for any chart or table. */
export function ChartCard({ title, subtitle, status, error, onRetry, notice, children }: ChartCardProps) {
  return (
    <section className="card chart-card" aria-label={title}>
      <header className="card__header">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      {notice && <p className="notice">{notice}</p>}
      {status === 'loading' && <LoadingState />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Something went wrong'} onRetry={onRetry} />
      )}
      {status === 'success' && children}
    </section>
  );
}
