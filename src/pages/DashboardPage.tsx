// src/pages/DashboardPage.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePortfolioTotal } from '@/features/trading/hooks/usePortfolioTotal';
import { useMonthlySummary } from '@/features/wealth/hooks/useMonthlySummary';
import { StatCard } from '@/shared/components/StatCard';
import { Card } from '@/shared/components/Card';
import { TradingDashboard } from '@/features/trading/components/TradingDashboard';
import { formatUSD, formatIDR } from '@/shared/utils/formatters';

function getGreeting(): string {
  const hour = parseInt(
    new Date().toLocaleString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jayapura',
    }),
    10,
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const BASE_CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { portfolio, isLoading: portfolioLoading } = usePortfolioTotal(user?.id ?? '');
  const { summary, isLoading: summaryLoading } = useMonthlySummary(user?.id ?? '');

  const totalEquityUSD = portfolio?.total_equity_usd ?? 0;
  const floatingPL = portfolio?.total_profit_usd ?? 0;
  const totalAssetsIDR = portfolio?.total_equity_idr ?? 0;
  const netCashflow = summary?.net_cashflow_idr ?? 0;

  const chartData = [
    ...BASE_CHART_MONTHS.map((month) => ({ month, income: 0, expenses: 0 })),
    {
      month: new Date().toLocaleString('default', { month: 'short' }),
      income: (summary?.total_income_idr ?? 0) / 1_000_000,
      expenses: (summary?.total_expense_idr ?? 0) / 1_000_000,
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-mp-text-primary">
          {getGreeting()}, Marlon 👋
        </h1>
        <p className="text-sm text-mp-text-muted mt-1">
          Here's your financial overview for today.
        </p>
      </div>

      <h2 className="text-lg font-semibold text-mp-text-secondary -mb-4">Quick Overview</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Portfolio Value"
          value={formatUSD(totalEquityUSD)}
          subtitle="Total trading equity"
        />
        <StatCard
          title="Today's P&L"
          value={`${floatingPL >= 0 ? '+' : ''}${formatUSD(floatingPL)}`}
          subtitle="Floating profit/loss"
          trend={
            portfolio?.total_balance_usd
              ? (floatingPL / portfolio.total_balance_usd) * 100
              : 0
          }
        />
        <StatCard
          title="Total Assets"
          value={formatIDR(totalAssetsIDR)}
          subtitle="Combined asset value"
        />
        <StatCard
          title="Monthly Net"
          value={`${netCashflow >= 0 ? '+' : ''}${formatIDR(netCashflow)}`}
          subtitle="Net cashflow this month"
          trend={
            (summary?.total_income_idr ?? 0) > 0
              ? (netCashflow / (summary?.total_income_idr ?? 1)) * 100
              : 0
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={portfolioLoading ? 'opacity-50 pointer-events-none' : ''}>
          <TradingDashboard userId={user?.id ?? ''} />
        </div>

        <Card title="Wealth — Income vs Expenses">
          {summaryLoading ? (
            <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">
              Loading chart…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v: number) => `${v}M`}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toFixed(1)}M`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
