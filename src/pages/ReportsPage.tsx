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
import { Card } from '@/shared/components/Card';
import { Select } from '@/shared/components/Select';
import { formatIDR } from '@/shared/utils/formatters';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }),
}));

const YEAR_OPTIONS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { summary, isLoading } = useMonthlySummary(user?.id ?? '', year, month);

  const chartData = [
    {
      category: 'This Month',
      income: (summary?.total_income_idr ?? 0) / 1_000_000,
      expenses: (summary?.total_expense_idr ?? 0) / 1_000_000,
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mp-text-primary">Reports</h1>
        <div className="flex gap-3">
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

      <Card title="Income vs Expenses">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">
            Loading chart…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(v: number) => `${v}M`}
              />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toFixed(2)}M`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

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
                  <td colSpan={3} className="py-6 text-center text-mp-text-muted">
                    Loading…
                  </td>
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
                    <td className="py-3 pr-4 text-mp-text-primary font-semibold">
                      Net Cashflow
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-semibold ${
                        (summary?.net_cashflow_idr ?? 0) >= 0
                          ? 'text-mp-green'
                          : 'text-mp-red'
                      }`}
                    >
                      {formatIDR(summary?.net_cashflow_idr ?? 0)}
                    </td>
                    <td
                      className={`py-3 text-right font-semibold ${
                        (summary?.net_cashflow_usd ?? 0) >= 0
                          ? 'text-mp-green'
                          : 'text-mp-red'
                      }`}
                    >
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
