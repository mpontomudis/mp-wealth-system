// src/features/trading/components/EquityChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { formatUSD, formatDate } from '@/shared/utils/formatters';

// ─── Types ────────────────────────────────────────────────────

export interface EquityDataPoint {
  time: string;
  equity: number;
  balance?: number;
}

interface EquityChartProps {
  data: EquityDataPoint[];
  height?: number;
  showBalance?: boolean;
  referenceValue?: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const equity  = payload.find((p) => p.dataKey === 'equity');
  const balance = payload.find((p) => p.dataKey === 'balance');

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 text-sm min-w-[160px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <p className="text-xs font-medium text-gray-400 mb-2">{label}</p>

      {equity && (
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-mp-blue" />
            Equity
          </span>
          <span className="font-semibold text-white">
            {formatUSD(equity.value ?? 0)}
          </span>
        </div>
      )}

      {balance && (
        <div className="flex items-center justify-between gap-6 mt-1">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-mp-green" />
            Balance
          </span>
          <span className="font-semibold text-white">
            {formatUSD(balance.value ?? 0)}
          </span>
        </div>
      )}

      {equity && balance && (
        <>
          <div className="border-t border-white/10 mt-2 pt-2">
            {(() => {
              const pl = (equity.value ?? 0) - (balance.value ?? 0);
              const positive = pl >= 0;
              return (
                <div className="flex items-center justify-between gap-6">
                  <span className="text-gray-500">P/L</span>
                  <span className={`font-semibold ${positive ? 'text-mp-green' : 'text-mp-red'}`}>
                    {positive ? '+' : ''}{formatUSD(pl)}
                  </span>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Y-axis tick formatter ────────────────────────────────────

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

// ─── Gradient defs ────────────────────────────────────────────

function ChartGradients() {
  return (
    <defs>
      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.15} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
      </linearGradient>
    </defs>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm"
      style={{ height }}
    >
      No equity data available.
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function EquityChart({
  data,
  height = 240,
  showBalance = true,
  referenceValue,
}: EquityChartProps) {
  if (!data.length) return <EmptyChart height={height} />;

  const formatted = data.map((point) => ({
    ...point,
    label: formatDate(point.time, 'short'),
  }));

  // Determine min/max for a tighter Y domain with 2% padding
  const equityValues = data.map((d) => d.equity);
  const balanceValues = showBalance ? data.map((d) => d.balance ?? d.equity) : equityValues;
  const allValues = [...equityValues, ...balanceValues];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = (maxVal - minVal) * 0.02 || 10;
  const yDomain: [number, number] = [
    Math.floor(minVal - padding),
    Math.ceil(maxVal + padding),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={formatted}
        margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
      >
        <ChartGradients />

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          vertical={false}
        />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />

        <YAxis
          domain={yDomain}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatYAxis}
          width={52}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 2' }}
        />

        {/* Optional reference line (e.g. starting balance) */}
        {referenceValue !== undefined && (
          <ReferenceLine
            y={referenceValue}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: formatUSD(referenceValue),
              position: 'insideTopRight',
              fontSize: 10,
              fill: '#f59e0b',
            }}
          />
        )}

        {/* Balance line (dashed, behind equity) */}
        {showBalance && (
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, fill: '#10b981' }}
          />
        )}

        {/* Equity line (primary) */}
        <Line
          type="monotone"
          dataKey="equity"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default EquityChart;
