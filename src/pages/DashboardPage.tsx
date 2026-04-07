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
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, BarChart3, Plus, TrendingUp, Wallet, DollarSign, Activity } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/contexts/ThemeContext';
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

const QUICK_ACTIONS = [
  { label: 'Income',   icon: ArrowDownLeft, colorClass: 'action-btn-teal',   to: '/transactions?type=income'  },
  { label: 'Expense',  icon: ArrowUpRight,  colorClass: 'action-btn-coral',  to: '/transactions?type=expense' },
  { label: 'Reports',  icon: BarChart3,      colorClass: 'action-btn-yellow', to: '/reports'                   },
  { label: 'Add',      icon: Plus,           colorClass: 'action-btn-blue',   to: '/transactions'              },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { portfolio, isLoading: portfolioLoading } = usePortfolioTotal(user?.id ?? '');
  const { assets } = useAssets(user?.id ?? '');

  const chartGrid = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)';
  const chartTick = isDark ? '#6b7280' : '#64748b';
  const tooltipContentStyle = isDark
    ? { backgroundColor: 'rgba(2,6,23,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }
    : { backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' };
  const tooltipLabelStyle = isDark ? { color: '#9ca3af', fontSize: 12 } : { color: '#64748b', fontSize: 12 };
  const tooltipItemStyle = isDark ? { color: '#e5e7eb' } : { color: '#1e293b' };

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

  // Total Net Worth = Wealth Assets + Trading Equity (all in IDR)
  const tradingEquityIDR = totalEquityUSD * exchangeRate;
  const totalNetWorth = totalAssetsIDR + tradingEquityIDR;
  const wealthPct = totalNetWorth > 0 ? (totalAssetsIDR / totalNetWorth) * 100 : 100;
  const tradingPct = totalNetWorth > 0 ? (tradingEquityIDR / totalNetWorth) * 100 : 0;

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
    <div className="p-5 flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-0.5">
            {getGreeting()} 👋
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            Marlon
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm text-xs text-slate-500 dark:text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ECDC4] animate-pulse-slow" />
          Live
        </div>
      </div>

      {/* ── Net Worth Banner (Teofin gradient card) ────────────── */}
      <div className="card-gradient-visa rounded-2xl px-5 py-5 relative overflow-hidden">
        {/* Decorative circles */}
        <div aria-hidden className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-4 top-12 w-20 h-20 rounded-full bg-white/10" />
        <div aria-hidden className="absolute right-16 -bottom-6 w-16 h-16 rounded-full bg-white/10" />

        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1 relative">Total Net Worth</p>
        <p className="text-3xl font-bold text-white leading-none relative">{formatIDR(totalNetWorth)}</p>
        <p className="text-sm text-white/70 mt-1 relative">≈ {formatUSD(totalNetWorth / exchangeRate)}</p>

        {/* Progress bar */}
        <div className="mt-4 relative">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden flex">
            <div className="h-full bg-white/60 transition-all duration-700" style={{ width: `${wealthPct}%` }} />
            <div className="h-full bg-white/30 transition-all duration-700" style={{ width: `${tradingPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
            <span className="text-xs text-white/75">
              Wealth <span className="text-white font-semibold">{wealthPct.toFixed(0)}%</span>
              {' · '}{formatIDR(totalAssetsIDR)}
            </span>
            {tradingEquityIDR > 0 ? (
              <span className="text-xs text-white/75">
                Trading <span className="text-white font-semibold">{tradingPct.toFixed(0)}%</span>
                {' · '}{formatUSD(totalEquityUSD)}
              </span>
            ) : (
              <span className="text-xs text-white/50 italic">No trading yet</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions (Teofin style) ────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, colorClass, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`${colorClass} w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}>
              <Icon size={24} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Section Label ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 -mb-2">
        <h2 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
          Quick Overview
        </h2>
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        <StatCard
          title="Portfolio Value"
          value={formatUSD(totalEquityUSD)}
          subtitle="Total trading equity"
          icon={<TrendingUp size={20} />}
          accent="blue"
        />
        <StatCard
          title="Today's P&L"
          value={`${floatingPL >= 0 ? '+' : ''}${formatUSD(floatingPL)}`}
          subtitle="Floating profit/loss"
          icon={<Activity size={20} />}
          accent={floatingPL >= 0 ? 'teal' : 'coral'}
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
          icon={<Wallet size={20} />}
          accent="purple"
        />
        <StatCard
          title="Monthly Net"
          value={`${netCashflow >= 0 ? '+' : ''}${formatIDR(netCashflow)}`}
          subtitle="Net cashflow this month"
          icon={<DollarSign size={20} />}
          accent={netCashflow >= 0 ? 'green' : 'coral'}
          trend={monthlyIncome > 0 ? (netCashflow / monthlyIncome) * 100 : 0}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        <div className={portfolioLoading ? 'opacity-50 pointer-events-none' : ''}>
          <TradingDashboard userId={user?.id ?? ''} />
        </div>

        <Card title="Wealth — Income vs Expenses">
          {portfolioLoading ? (
            <div className="h-[300px] flex items-center justify-center text-mp-text-muted text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-white/10 border-t-[#4A90E2] animate-spin" />
                Loading chart…
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F87171" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="month" tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: chartTick, fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}M`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toFixed(1)}M`, '']}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: chartTick }} />
                <Line type="monotone" dataKey="income" stroke="url(#incomeGradient)" strokeWidth={2.5} dot={false} name="Income" strokeLinecap="round" />
                <Line type="monotone" dataKey="expenses" stroke="url(#expenseGradient)" strokeWidth={2.5} dot={false} name="Expenses" strokeLinecap="round" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

