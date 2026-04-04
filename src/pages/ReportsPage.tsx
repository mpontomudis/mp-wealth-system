// src/pages/ReportsPage.tsx
import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '@/shared/hooks/useAuth';
import { useMonthlySummary } from '@/features/wealth/hooks/useMonthlySummary';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { Card } from '@/shared/components/Card';
import { Select } from '@/shared/components/Select';
import { formatIDR } from '@/shared/utils/formatters';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2024, i, 1).toLocaleString('id-ID', { month: 'long' }),
}));

const now = new Date();
const YEAR_OPTIONS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { summary, isLoading } = useMonthlySummary(user?.id ?? '', year, month);
  const { transactions } = useTransactions(user?.id ?? '', { startDate, endDate });

  // Build weekly breakdown from transactions
  const weekData = (() => {
    const weeks: Record<string, { week: string; income: number; expenses: number }> = {};
    for (let w = 1; w <= 5; w++) {
      weeks[`W${w}`] = { week: `Minggu ${w}`, income: 0, expenses: 0 };
    }
    for (const tx of transactions ?? []) {
      const d = new Date(tx.transaction_date ?? '');
      const day = d.getDate();
      const weekNum = Math.min(Math.ceil(day / 7), 5);
      const key = `W${weekNum}`;
      const amt = Number(tx.amount ?? 0);
      const idr = tx.currency === 'USD' ? amt * 15750 : amt;
      if (tx.type === 'income') weeks[key].income += idr / 1_000_000;
      else if (tx.type === 'expense') weeks[key].expenses += idr / 1_000_000;
    }
    return Object.values(weeks).filter(w => w.income > 0 || w.expenses > 0);
  })();

  const chartData = weekData.length > 0 ? weekData : [
    {
      week: MONTH_OPTIONS[month - 1]?.label ?? 'Bulan ini',
      income: (summary?.total_income_idr ?? 0) / 1_000_000,
      expenses: (summary?.total_expense_idr ?? 0) / 1_000_000,
    },
  ];

  const net = (summary?.net_cashflow_idr ?? 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-mp-text-primary">Reports</h1>
        <div className="flex gap-2">
          <div className="w-36">
            <Select
              options={MONTH_OPTIONS}
              value={String(month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </div>
          <div className="w-24">
            <Select
              options={YEAR_OPTIONS}
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-mp-green/10 border border-mp-green/20 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2">
          <p className="text-xs text-mp-text-muted">Total Income</p>
          <p className="text-sm font-bold text-mp-green">+{formatIDR(summary?.total_income_idr ?? 0)}</p>
        </div>
        <div className="rounded-xl bg-mp-red/10 border border-mp-red/20 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2">
          <p className="text-xs text-mp-text-muted">Total Expenses</p>
          <p className="text-sm font-bold text-mp-red">−{formatIDR(summary?.total_expense_idr ?? 0)}</p>
        </div>
        <div className={`rounded-xl px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2 border ${net >= 0 ? 'bg-mp-green/10 border-mp-green/20' : 'bg-mp-red/10 border-mp-red/20'}`}>
          <p className="text-xs text-mp-text-muted">Net Cashflow</p>
          <p className={`text-sm font-bold ${net >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
            {net >= 0 ? '+' : '−'}{formatIDR(Math.abs(net))}
          </p>
        </div>
      </div>

      {/* Chart */}
      <Card title="Income vs Expenses">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">
            Loading chart…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(v: number) => `${v.toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatIDR(value * 1_000_000),
                  name === 'income' ? 'Income' : 'Expenses',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend formatter={(v) => v === 'income' ? 'Income' : 'Expenses'} />
              <Bar dataKey="income" fill="#10b981" name="income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Table */}
      <Card title="Monthly Summary">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mp-border text-mp-text-secondary text-left">
                <th className="pb-3 pr-4 font-medium">Metric</th>
                <th className="pb-3 pr-4 font-medium text-right">IDR</th>
                <th className="pb-3 font-medium text-right">USD</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-mp-text-muted">Loading…</td>
                </tr>
              ) : (
                <>
                  <tr className="border-b border-mp-border/50">
                    <td className="py-3 pr-4 text-mp-text-secondary">Total Income</td>
                    <td className="py-3 pr-4 text-mp-green text-right font-medium">
                      {formatIDR(summary?.total_income_idr ?? 0)}
                    </td>
                    <td className="py-3 text-mp-green text-right font-medium">
                      ${(summary?.total_income_usd ?? 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-mp-border/50">
                    <td className="py-3 pr-4 text-mp-text-secondary">Total Expenses</td>
                    <td className="py-3 pr-4 text-mp-red text-right font-medium">
                      {formatIDR(summary?.total_expense_idr ?? 0)}
                    </td>
                    <td className="py-3 text-mp-red text-right font-medium">
                      ${(summary?.total_expense_usd ?? 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-mp-text-primary font-semibold">Net Cashflow</td>
                    <td className={`py-3 pr-4 text-right font-semibold ${net >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
                      {formatIDR(net)}
                    </td>
                    <td className={`py-3 text-right font-semibold ${net >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
                      ${(summary?.net_cashflow_usd ?? 0).toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
