import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartRow } from '../../domain/transform';
import type { Company, WindowId } from '../../types/market';

interface PerformanceChartProps {
  rows: ChartRow[];
  companies: Company[];
  window: WindowId;
}

function formatTick(t: number, window: WindowId): string {
  const d = new Date(t);
  return window === 'day'
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** The only component that imports the charting library, so it can be swapped later. */
export function PerformanceChart({ rows, companies, window }: PerformanceChartProps) {
  if (rows.length === 0) return <p className="muted">No data available for this period.</p>;

  return (
    <div className="chart" data-testid="performance-chart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={(t: number) => formatTick(t, window)} minTickGap={32} />
          <YAxis tickFormatter={(v: number) => `${v}%`} width={56} />
          <Tooltip
            labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
            formatter={(v) => `${v}%`}
          />
          <Legend />
          {companies.map((c) => (
            <Line
              key={c.symbol}
              type="monotone"
              dataKey={c.symbol}
              name={c.name}
              stroke={c.color}
              dot={false}
              strokeWidth={c.symbol === 'IBM' ? 3 : 1.5}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
