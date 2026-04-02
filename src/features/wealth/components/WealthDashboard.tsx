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
import { useMonthlySummary } from '@/features/wealth/hooks/useMonthlySummary';
import { StatCard } from '@/shared/components/StatCard';
import { Card } from '@/shared/components/Card';
import { TransactionList } from './TransactionList';
import { AssetList } from './AssetList';
import { formatIDR } from '@/shared/utils/formatters';

const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export function WealthDashboard() {
  const { user } = useAuth();
  const { assets, isLoading: assetsLoading } = useAssets(user?.id ?? '');
  const { summary, isLoading: summaryLoading } = useMonthlySummary(user?.id ?? '');

  const totalAssets =
    assets?.reduce((sum, a) => {
      if (a.currency === 'IDR') return sum + (a.balance ?? 0);
      return sum + (a.balance_usd ?? 0) * 16000;
    }, 0) ?? 0;

  const monthlyIncome = summary?.total_income_idr ?? 0;
  const monthlyExpenses = summary?.total_expense_idr ?? 0;
  const netCashflow = summary?.net_cashflow_idr ?? 0;

  // Chart: populate current month only; expand with historical data when multi-month hook is available
  const chartData = CHART_MONTHS.map((month, i) => ({
    month,
    income: i === CHART_MONTHS.length - 1 ? monthlyIncome / 1_000_000 : 0,
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
        {summaryLoading || assetsLoading ? (
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
