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
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
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
  const { assets } = useAssets(user?.id ?? '');

  // Fetch only this month's transactions for summary stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const { transactions } = useTransactions(user?.id ?? '', { startDate: startOfMonth });

  const exchangeRate = portfolio?.exchange_rate ?? 16000;
  const totalAssetsIDR =
    assets?.reduce((sum, a) => {
      if (a.currency === 'IDR') return sum + (a.balance ?? 0);
      return sum + (a.balance_usd ?? 0) * exchangeRate;
    }, 0) ?? 0;

  const totalEquityUSD = portfolio?.total_equity_usd ?? 0;
  const floatingPL = portfolio?.total_profit_usd ?? 0;

  // Compute monthly summary from transactions (no RPC dependency)
  const monthlyIncome = (transactions ?? [])
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.currency === 'IDR' ? (t.amount ?? 0) : (t.amount ?? 0) * exchangeRate), 0);
  const monthlyExpenses = (transactions ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.currency === 'IDR' ? (t.amount ?? 0) : (t.amount ?? 0) * exchangeRate), 0);
  const netCashflow = monthlyIncome - monthlyExpenses;

  const chartData = [
    ...BASE_CHART_MONTHS.map((month) => ({ month, income: 0, expenses: 0 })),
    {
      month: now.toLocaleString('default', { month: 'short' }),
      income:   monthlyIncome   / 1_000_000,
      expenses: monthlyExpenses / 1_000_000,
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {getGreeting()}, Marlon{' '}
            <span className="inline-block animate-pulse-slow">👋</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Here's your financial overview for today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-mp-green animate-pulse-slow" />
          Live
        </div>
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3 -mb-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Quick Overview
        </h2>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Stat cards */}
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
          trend={monthlyIncome > 0 ? (netCashflow / monthlyIncome) * 100 : 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={portfolioLoading ? 'opacity-50 pointer-events-none' : ''}>
          <TradingDashboard userId={user?.id ?? ''} />
        </div>

        <Card title="Wealth — Income vs Expenses">
          {portfolioLoading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
                Loading chart…
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}M`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toFixed(1)}M`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#6b7280' }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="url(#incomeGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Income"
                  strokeLinecap="round"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="url(#expenseGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Expenses"
                  strokeLinecap="round"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
