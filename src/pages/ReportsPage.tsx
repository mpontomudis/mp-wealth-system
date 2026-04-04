// src/pages/ReportsPage.tsx
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { Card } from '@/shared/components/Card';
import { formatIDR } from '@/shared/utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USD_RATE = 15750;
const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function toIdr(amount: number, currency: string) {
  return currency === 'USD' ? amount * USD_RATE : amount;
}

function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0,0,0,0);
  return mon;
}

type Period = 'day' | 'week' | 'month';

function getRangeDates(period: Period, anchor: string): { startDate: string; endDate: string; label: string } {
  const d = new Date(anchor + 'T00:00:00');
  if (period === 'day') {
    return { startDate: anchor, endDate: anchor, label: fmtDate(d) };
  }
  if (period === 'week') {
    const mon = startOfWeek(d);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const s = mon.toISOString().split('T')[0];
    const e = sun.toISOString().split('T')[0];
    return { startDate: s, endDate: e, label: `${fmtDate(mon)} – ${fmtDate(sun)}` };
  }
  // month
  const y = d.getFullYear(); const m = d.getMonth() + 1;
  const s = `${y}-${String(m).padStart(2,'0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const e = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
  return { startDate: s, endDate: e, label: `${MONTHS_ID[m-1]} ${y}` };
}

function buildChartData(
  period: Period,
  transactions: Array<{ type: string; amount: number; currency: string; transaction_date?: string | null; description?: string | null }>,
  startDate: string,
) {
  if (period === 'day') {
    // group by description/category — show top items
    const map: Record<string, { label: string; income: number; expenses: number }> = {};
    for (const tx of transactions) {
      const key = tx.description ?? 'Lainnya';
      if (!map[key]) map[key] = { label: key.length > 12 ? key.slice(0,12)+'…' : key, income: 0, expenses: 0 };
      const idr = toIdr(Number(tx.amount), tx.currency) / 1_000_000;
      if (tx.type === 'income') map[key].income += idr;
      else if (tx.type === 'expense') map[key].expenses += idr;
    }
    return Object.values(map).sort((a,b) => (b.income+b.expenses)-(a.income+a.expenses)).slice(0,6);
  }

  if (period === 'week') {
    const mon = new Date(startDate + 'T00:00:00');
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      return { label: DAYS_ID[d.getDay()], date: d.toISOString().split('T')[0], income: 0, expenses: 0 };
    });
    for (const tx of transactions) {
      const d = days.find(d => d.date === tx.transaction_date);
      if (!d) continue;
      const idr = toIdr(Number(tx.amount), tx.currency) / 1_000_000;
      if (tx.type === 'income') d.income += idr;
      else if (tx.type === 'expense') d.expenses += idr;
    }
    return days;
  }

  // month → per week
  const weeks = Array.from({ length: 5 }, (_, i) => ({
    label: `Mgg ${i+1}`, income: 0, expenses: 0,
  }));
  for (const tx of transactions) {
    const day = new Date(tx.transaction_date + 'T00:00:00').getDate();
    const wi = Math.min(Math.ceil(day / 7), 5) - 1;
    const idr = toIdr(Number(tx.amount), tx.currency) / 1_000_000;
    if (tx.type === 'income') weeks[wi].income += idr;
    else if (tx.type === 'expense') weeks[wi].expenses += idr;
  }
  return weeks.filter(w => w.income > 0 || w.expenses > 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [period, setPeriod] = useState<Period>('day');
  const [anchor, setAnchor] = useState(today);

  const { startDate, endDate, label } = getRangeDates(period, anchor);

  const { transactions, isLoading } = useTransactions(user?.id ?? '', { startDate, endDate });

  const { totalIncome, totalExpense, net } = useMemo(() => {
    let inc = 0, exp = 0;
    for (const tx of transactions ?? []) {
      const idr = toIdr(Number(tx.amount), tx.currency ?? 'IDR');
      if (tx.type === 'income') inc += idr;
      else if (tx.type === 'expense') exp += idr;
    }
    return { totalIncome: inc, totalExpense: exp, net: inc - exp };
  }, [transactions]);

  const chartData = useMemo(() =>
    buildChartData(period, (transactions ?? []).map(t => ({
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency ?? 'IDR',
      transaction_date: t.transaction_date,
      description: t.description,
    })), startDate),
    [transactions, period, startDate]
  );

  // Navigate anchor ±1 period
  const navigate = (dir: -1 | 1) => {
    const d = new Date(anchor + 'T00:00:00');
    if (period === 'day') d.setDate(d.getDate() + dir);
    else if (period === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d.toISOString().split('T')[0]);
  };

  const PERIOD_TABS: { key: Period; label: string }[] = [
    { key: 'day', label: 'Hari' },
    { key: 'week', label: 'Minggu' },
    { key: 'month', label: 'Bulan' },
  ];

  const xKey = period === 'day' ? 'label' : period === 'week' ? 'label' : 'label';

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-mp-text-primary">Reports</h1>

        {/* Period tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.06] border border-white/10 p-1">
          {PERIOD_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setPeriod(t.key); setAnchor(today); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === t.key
                  ? 'bg-mp-primary text-white shadow'
                  : 'text-mp-text-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-mp-text-secondary hover:text-white transition-colors text-sm"
        >
          ‹
        </button>
        {period === 'day' ? (
          <input
            type="date"
            value={anchor}
            onChange={e => setAnchor(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-mp-primary focus:outline-none"
          />
        ) : (
          <span className="text-sm font-medium text-mp-text-primary min-w-[160px] text-center">{label}</span>
        )}
        <button
          onClick={() => navigate(1)}
          disabled={anchor >= today}
          className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-mp-text-secondary hover:text-white transition-colors text-sm disabled:opacity-30"
        >
          ›
        </button>
        <button
          onClick={() => setAnchor(today)}
          className="ml-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-mp-text-muted hover:text-white transition-colors"
        >
          Hari ini
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-mp-green/10 border border-mp-green/20 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2">
          <p className="text-xs text-mp-text-muted">Total Income</p>
          <p className="text-sm font-bold text-mp-green">+{formatIDR(totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-mp-red/10 border border-mp-red/20 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2">
          <p className="text-xs text-mp-text-muted">Total Expenses</p>
          <p className="text-sm font-bold text-mp-red">−{formatIDR(totalExpense)}</p>
        </div>
        <div className={`rounded-xl px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2 border ${net >= 0 ? 'bg-mp-green/10 border-mp-green/20' : 'bg-mp-red/10 border-mp-red/20'}`}>
          <p className="text-xs text-mp-text-muted">Net</p>
          <p className={`text-sm font-bold ${net >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
            {net >= 0 ? '+' : '−'}{formatIDR(Math.abs(net))}
          </p>
        </div>
      </div>

      {/* Chart */}
      <Card title={`Income vs Expenses — ${label}`}>
        {isLoading ? (
          <div className="h-[260px] flex items-center justify-center text-mp-text-muted text-sm">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-mp-text-muted text-sm">
            Tidak ada transaksi pada periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(1)}M`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatIDR(value * 1_000_000),
                  name === 'income' ? 'Income' : 'Expenses',
                ]}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend formatter={(v) => v === 'income' ? 'Income' : 'Expenses'} />
              <Bar dataKey="income" fill="#10b981" name="income" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="expenses" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Transaction detail table */}
      {(transactions ?? []).length > 0 && (
        <Card title="Detail Transaksi">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mp-border text-mp-text-secondary text-left">
                  <th className="pb-2 pr-3 font-medium">Tanggal</th>
                  <th className="pb-2 pr-3 font-medium">Keterangan</th>
                  <th className="pb-2 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {(transactions ?? []).map(tx => (
                  <tr key={tx.id} className="border-b border-mp-border/40 last:border-0">
                    <td className="py-2 pr-3 text-mp-text-muted whitespace-nowrap text-xs">
                      {tx.transaction_date ? new Date(tx.transaction_date+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short'}) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-mp-text-primary max-w-[180px] truncate">{tx.description ?? '—'}</td>
                    <td className={`py-2 text-right font-medium whitespace-nowrap ${tx.type==='income'?'text-mp-green':tx.type==='expense'?'text-mp-red':'text-mp-blue'}`}>
                      {tx.type==='income'?'+':tx.type==='expense'?'−':''}{formatIDR(toIdr(Number(tx.amount), tx.currency ?? 'IDR'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

