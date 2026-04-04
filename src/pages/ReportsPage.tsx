// src/pages/ReportsPage.tsx
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, Sector,
} from 'recharts';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { Card } from '@/shared/components/Card';
import { ExportMenu } from '@/shared/components/ExportMenu';
import { formatIDR } from '@/shared/utils/formatters';
import {
  exportTransactionsCSV,
  exportTransactionsPDF,
  type ExportTransaction,
} from '@/shared/utils/exportUtils';

// ─── Constants ────────────────────────────────────────────────

const USD_RATE = 15750;
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORY_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16',
];

// ─── Helpers ─────────────────────────────────────────────────

function toIdr(amount: number, currency: string) {
  return currency === 'USD' ? amount * USD_RATE : amount;
}
function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d); mon.setDate(diff); mon.setHours(0,0,0,0);
  return mon;
}

type Period = 'day' | 'week' | 'month';
type TabKey = 'overview' | 'categories' | 'trends';

function getRangeDates(period: Period, anchor: string) {
  const d = new Date(anchor + 'T00:00:00');
  if (period === 'day') return { startDate: anchor, endDate: anchor, label: fmtDate(d) };
  if (period === 'week') {
    const mon = startOfWeek(d);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const s = mon.toISOString().split('T')[0];
    const e = sun.toISOString().split('T')[0];
    return { startDate: s, endDate: e, label: `${fmtDate(mon)} – ${fmtDate(sun)}` };
  }
  const y = d.getFullYear(); const m = d.getMonth() + 1;
  const s = `${y}-${String(m).padStart(2,'0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const e = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
  return { startDate: s, endDate: e, label: `${MONTHS_EN[m-1]} ${y}` };
}

function getLast6MonthsRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
}

function buildBarChartData(
  period: Period,
  transactions: Array<{ type: string; amount: number; currency: string; transaction_date?: string | null; description?: string | null }>,
  startDate: string,
) {
  if (period === 'day') {
    const map: Record<string, { label: string; income: number; expenses: number }> = {};
    for (const tx of transactions) {
      const key = tx.description ?? 'Other';
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
      return { label: DAYS_EN[d.getDay()], date: d.toISOString().split('T')[0], income: 0, expenses: 0 };
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
  const weeks = Array.from({ length: 5 }, (_, i) => ({ label: `Wk ${i+1}`, income: 0, expenses: 0 }));
  for (const tx of transactions) {
    const day = new Date((tx.transaction_date ?? '') + 'T00:00:00').getDate();
    const wi = Math.min(Math.ceil(day / 7), 5) - 1;
    const idr = toIdr(Number(tx.amount), tx.currency) / 1_000_000;
    if (tx.type === 'income') weeks[wi].income += idr;
    else if (tx.type === 'expense') weeks[wi].expenses += idr;
  }
  return weeks.filter(w => w.income > 0 || w.expenses > 0);
}

// ─── Active Donut Shape ──────────────────────────────────────

function renderActiveShape(props: Record<string, unknown>) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } =
    props as { cx: number; cy: number; innerRadius: number; outerRadius: number; startAngle: number; endAngle: number; fill: string; payload: { name: string }; percent: number; value: number };
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontWeight={600}>
        {payload.name.length > 14 ? payload.name.slice(0,14)+'…' : payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        {formatIDR(value * 1_000_000)}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#475569" fontSize={10}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState(today);
  const [activePieIndex, setActivePieIndex] = useState(0);

  const { startDate, endDate, label } = getRangeDates(period, anchor);
  const { startDate: trend6Start, endDate: trend6End } = getLast6MonthsRange();

  const { transactions, isLoading } = useTransactions(user?.id ?? '', { startDate, endDate });
  const { transactions: trendTxs, isLoading: trendLoading } = useTransactions(
    user?.id ?? '',
    { startDate: trend6Start, endDate: trend6End }
  );

  // ── Overview KPIs ─────────────────────────────────────────
  const { totalIncome, totalExpense, net, savingsRate } = useMemo(() => {
    let inc = 0, exp = 0;
    for (const tx of transactions ?? []) {
      const idr = toIdr(Number(tx.amount), tx.currency ?? 'IDR');
      if (tx.type === 'income') inc += idr;
      else if (tx.type === 'expense') exp += idr;
    }
    return { totalIncome: inc, totalExpense: exp, net: inc - exp, savingsRate: inc > 0 ? ((inc - exp) / inc) * 100 : 0 };
  }, [transactions]);

  const barChartData = useMemo(() => buildBarChartData(
    period,
    (transactions ?? []).map(t => ({ type: t.type, amount: Number(t.amount), currency: t.currency ?? 'IDR', transaction_date: t.transaction_date, description: t.description })),
    startDate
  ), [transactions, period, startDate]);

  // ── Category Breakdown ────────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; value: number; id: string }> = {};
    for (const tx of transactions ?? []) {
      if (tx.type !== 'expense') continue;
      const catId = (tx as { category_id?: string | null }).category_id ?? 'uncategorized';
      if (!map[catId]) map[catId] = { id: catId, name: 'Other', value: 0 };
      map[catId].value += toIdr(Number(tx.amount), tx.currency ?? 'IDR') / 1_000_000;
    }
    return Object.values(map).sort((a,b) => b.value - a.value).slice(0,10);
  }, [transactions]);

  // ── 6-Month Trends ────────────────────────────────────────
  const trendsData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: MONTHS_EN[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1, income: 0, expenses: 0 };
    });
    for (const tx of trendTxs ?? []) {
      if (!tx.transaction_date) continue;
      const p = tx.transaction_date.split('-');
      const slot = months.find(m => m.year === parseInt(p[0]) && m.month === parseInt(p[1]));
      if (!slot) continue;
      const idr = toIdr(Number(tx.amount), tx.currency ?? 'IDR') / 1_000_000;
      if (tx.type === 'income') slot.income += idr;
      else if (tx.type === 'expense') slot.expenses += idr;
    }
    return months;
  }, [trendTxs]);

  const savingsTrendData = useMemo(() =>
    trendsData.map(m => ({
      label: m.label,
      savings: m.income > 0 ? Math.round(((m.income - m.expenses) / m.income) * 100) : 0,
    })),
    [trendsData]
  );

  // ── Navigation ────────────────────────────────────────────
  const navigate = (dir: -1 | 1) => {
    const d = new Date(anchor + 'T00:00:00');
    if (period === 'day') d.setDate(d.getDate() + dir);
    else if (period === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d.toISOString().split('T')[0]);
  };

  // ── Export ────────────────────────────────────────────────
  const getExportTxs = (): ExportTransaction[] => (transactions ?? []).map(tx => ({
    transaction_date: tx.transaction_date, description: tx.description,
    type: tx.type, amount: Number(tx.amount), currency: tx.currency, notes: tx.notes,
  }));
  const filename = `mp-wealth-${activeTab}-${startDate}`;
  const handleExportCSV = () => exportTransactionsCSV(getExportTxs(), filename);
  const handleExportPDF = () => exportTransactionsPDF(getExportTxs(), { label: 'Report', period: label, totalIncome, totalExpense, net }, filename);

  // ── Tab / period configs ──────────────────────────────────
  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview',   label: 'Overview'    },
    { key: 'categories', label: 'Categories'  },
    { key: 'trends',     label: '6-Mo Trends' },
  ];
  const PERIOD_TABS: { key: Period; label: string }[] = [
    { key: 'day',   label: 'Daily'   },
    { key: 'week',  label: 'Weekly'  },
    { key: 'month', label: 'Monthly' },
  ];

  const PeriodSelector = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.06] border border-white/10 p-1">
        {PERIOD_TABS.map(t => (
          <button key={t.key} onClick={() => { setPeriod(t.key); setAnchor(today); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === t.key ? 'bg-white/15 text-white shadow' : 'text-mp-text-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-mp-text-secondary hover:text-white transition-colors text-sm">‹</button>
        {period === 'day' ? (
          <input type="date" value={anchor} onChange={e => setAnchor(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-mp-primary focus:outline-none" />
        ) : (
          <span className="text-sm font-medium text-mp-text-primary min-w-[160px] text-center">{label}</span>
        )}
        <button onClick={() => navigate(1)} disabled={anchor >= today} className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-mp-text-secondary hover:text-white transition-colors text-sm disabled:opacity-30">›</button>
        <button onClick={() => setAnchor(today)} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-mp-text-muted hover:text-white transition-colors">Today</button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-mp-text-primary">Reports</h1>
        <ExportMenu
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          disabled={isLoading || (transactions ?? []).length === 0}
        />
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.06] border border-white/10 p-1 self-start overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-mp-primary text-white shadow' : 'text-mp-text-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {PeriodSelector}

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-mp-green/10 border border-mp-green/20 px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] text-mp-text-muted uppercase tracking-wide">Income</p>
              <p className="text-sm font-bold text-mp-green">+{formatIDR(totalIncome)}</p>
            </div>
            <div className="rounded-xl bg-mp-red/10 border border-mp-red/20 px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] text-mp-text-muted uppercase tracking-wide">Expenses</p>
              <p className="text-sm font-bold text-mp-red">−{formatIDR(totalExpense)}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 flex flex-col gap-1 border ${net >= 0 ? 'bg-mp-green/10 border-mp-green/20' : 'bg-mp-red/10 border-mp-red/20'}`}>
              <p className="text-[10px] text-mp-text-muted uppercase tracking-wide">Net</p>
              <p className={`text-sm font-bold ${net >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
                {net >= 0 ? '+' : '−'}{formatIDR(Math.abs(net))}
              </p>
            </div>
            <div className="rounded-xl bg-mp-blue/10 border border-mp-blue/20 px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] text-mp-text-muted uppercase tracking-wide">Savings Rate</p>
              <p className={`text-sm font-bold ${savingsRate >= 0 ? 'text-mp-blue' : 'text-mp-red'}`}>
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Bar chart */}
          <Card title={`Income vs Expenses — ${label}`}>
            {isLoading ? (
              <div className="h-[260px] flex items-center justify-center text-mp-text-muted text-sm">Loading…</div>
            ) : barChartData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-mp-text-muted text-sm">No transactions for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(1)}M`} />
                  <Tooltip formatter={(value: number, name: string) => [formatIDR(value * 1_000_000), name === 'income' ? 'Income' : 'Expenses']}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend formatter={(v) => v === 'income' ? 'Income' : 'Expenses'} />
                  <Bar dataKey="income" fill="#10b981" name="income" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="expenses" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Transaction detail table */}
          {(transactions ?? []).length > 0 && (
            <Card title="Transaction Details">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-mp-border text-mp-text-secondary text-left">
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Description</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions ?? []).map(tx => (
                      <tr key={tx.id} className="border-b border-mp-border/40 last:border-0">
                        <td className="py-2 pr-3 text-mp-text-muted whitespace-nowrap text-xs">
                          {tx.transaction_date ? new Date(tx.transaction_date+'T00:00:00').toLocaleDateString('en-US',{day:'2-digit',month:'short'}) : '—'}
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
        </>
      )}

      {/* ══ CATEGORIES ════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <>
          {PeriodSelector}
          {isLoading ? (
            <Card title="Expense Breakdown">
              <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">Loading…</div>
            </Card>
          ) : categoryData.length === 0 ? (
            <Card title="Expense Breakdown">
              <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">
                No expense data for this period
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <Card title={`Expenses by Category — ${label}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape as never}
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Category Breakdown">
                <div className="flex flex-col gap-3">
                  {categoryData.map((cat, idx) => {
                    const total = categoryData.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? (cat.value / total) * 100 : 0;
                    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-sm text-mp-text-primary truncate">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="text-xs text-mp-text-muted">{pct.toFixed(1)}%</span>
                            <span className="text-sm font-medium text-white">{formatIDR(cat.value * 1_000_000)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ══ TRENDS ════════════════════════════════════════════════ */}
      {activeTab === 'trends' && (
        trendLoading ? (
          <Card title="6-Month Trends">
            <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">Loading…</div>
          </Card>
        ) : (
          <>
            <Card title="Income vs Expenses — Last 6 Months">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}M`} />
                  <Tooltip formatter={(value: number, name: string) => [formatIDR(value * 1_000_000), name === 'income' ? 'Income' : 'Expenses']}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend formatter={(v) => v === 'income' ? 'Income' : 'Expenses'} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} name="expenses" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Savings Rate — Last 6 Months">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={savingsTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Savings Rate']}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="savings" fill="#3b82f6" radius={[4,4,0,0]} name="savings" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-mp-border">
                {savingsTrendData.map((m) => (
                  <div key={m.label} className="text-center min-w-[3rem]">
                    <p className="text-[10px] text-mp-text-muted">{m.label}</p>
                    <p className={`text-xs font-bold ${m.savings >= 0 ? 'text-mp-blue' : 'text-mp-red'}`}>
                      {m.savings.toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )
      )}

    </div>
  );
}
