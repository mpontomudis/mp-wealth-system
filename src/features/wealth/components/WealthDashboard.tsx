// src/features/wealth/components/WealthDashboard.tsx
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
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { StatCard } from '@/shared/components/StatCard';
import { Card } from '@/shared/components/Card';
import { TransactionList } from './TransactionList';
import { AssetList } from './AssetList';
import { formatIDR } from '@/shared/utils/formatters';

const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export function WealthDashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { assets, isLoading: assetsLoading } = useAssets(user?.id ?? '');

  // Fetch only this month's transactions for summary stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const { transactions, isLoading: txLoading } = useTransactions(user?.id ?? '', { startDate: startOfMonth });

  const totalAssets =
    assets?.reduce((sum, a) => {
      if (a.currency === 'IDR') return sum + (a.balance ?? 0);
      return sum + (a.balance_usd ?? 0) * 16000;
    }, 0) ?? 0;

  const EXCHANGE_RATE = 16000;
  const monthlyIncome = (transactions ?? [])
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.currency === 'IDR' ? (t.amount ?? 0) : (t.amount ?? 0) * EXCHANGE_RATE), 0);

  const monthlyExpenses = (transactions ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.currency === 'IDR' ? (t.amount ?? 0) : (t.amount ?? 0) * EXCHANGE_RATE), 0);

  const netCashflow = monthlyIncome - monthlyExpenses;
  const isLoading = assetsLoading || txLoading;

  const chartGrid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const chartTick = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = isDark
    ? { backgroundColor: 'rgba(2,6,23,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', fontSize: 12 }
    : { backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 };
  const tooltipLabelStyle = isDark ? { color: '#9ca3af' } : { color: '#64748b' };
  const tooltipItemStyle  = isDark ? { color: '#e5e7eb' } : { color: '#1e293b' };

  // Chart: populate current month only; expand with historical data when multi-month hook is available
  const chartData = CHART_MONTHS.map((month, i) => ({
    month,
    income:   i === CHART_MONTHS.length - 1 ? monthlyIncome   / 1_000_000 : 0,
    expenses: i === CHART_MONTHS.length - 1 ? monthlyExpenses / 1_000_000 : 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={formatIDR(totalAssets)}
          subtitle="All asset types combined"
        />
        <StatCard
          title="Monthly Income"
          value={formatIDR(monthlyIncome)}
          subtitle="This month"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatIDR(monthlyExpenses)}
          subtitle="This month"
        />
        <StatCard
          title="Net Cashflow"
          value={formatIDR(netCashflow)}
          subtitle="Income − Expenses"
          trend={
            monthlyIncome > 0
              ? ((netCashflow / monthlyIncome) * 100)
              : 0
          }
        />
      </div>

      {/* Row 2: Line chart */}
      <Card title="Income vs Expenses — Last 6 Months">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">
            Loading chart…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="wealthIncomeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wealthExpenseGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F87171" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="month" tick={{ fill: chartTick, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: chartTick, fontSize: 12 }}
                tickFormatter={(v: number) => `${v}M`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`Rp ${(value as number).toFixed(1)}M`, '']}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: chartTick }} />
              <Line type="monotone" dataKey="income" stroke="url(#wealthIncomeGrad)" strokeWidth={2.5} dot={false} name="Income" strokeLinecap="round" />
              <Line type="monotone" dataKey="expenses" stroke="url(#wealthExpenseGrad)" strokeWidth={2.5} dot={false} name="Expenses" strokeLinecap="round" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Row 3: Recent transactions + assets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recent Transactions">
          <TransactionList limit={10} showFilters={false} />
        </Card>
        <Card>
          <AssetList />
        </Card>
      </div>
    </div>
  );
}
