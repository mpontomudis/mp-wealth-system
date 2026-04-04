// src/features/trading/components/BrokerDetailModal.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  X,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Trophy,
  Activity,
  BarChart2,
} from 'lucide-react';
import { useTradeHistory } from '../hooks/useTradeHistory';
import { useEquityChart } from '../hooks/useEquityChart';
import {
  formatUSD,
  formatDate,
  formatPL,
  formatLots,
  formatPercentage,
} from '@/shared/utils/formatters';
import type { TradingAccountWithLatestMetrics } from '../services/trading.service';

interface BrokerDetailModalProps {
  account: TradingAccountWithLatestMetrics | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────

function MetricBox({ label, value, sub, highlight }: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}) {
  const valueColor =
    highlight === 'positive' ? 'text-mp-green' :
    highlight === 'negative' ? 'text-mp-red' :
    'text-mp-text-primary';

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <p className="text-xs text-mp-text-muted mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-mp-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function EquitySection({ accountId }: { accountId: string }) {
  const { chartData, isLoading } = useEquityChart(accountId);

  if (isLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center text-mp-text-muted text-sm">
        Loading chart…
      </div>
    );
  }

  if (!chartData?.length) {
    return (
      <div className="h-[200px] flex items-center justify-center text-mp-text-muted text-sm">
        No equity history yet
      </div>
    );
  }

  const formatted = chartData.map((p) => ({
    ...p,
    label: formatDate(p.time, 'short'),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          width={44}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatUSD(value), name === 'equity' ? 'Equity' : 'Balance']}
          contentStyle={{ background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} name="equity" />
        <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="balance" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TradeTable({ accountId }: { accountId: string }) {
  const { trades, isLoading, error } = useTradeHistory(accountId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-mp-text-muted text-sm gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
        Loading trades…
      </div>
    );
  }

  if (error || !trades?.length) {
    return (
      <div className="flex items-center justify-center py-10 text-mp-text-muted text-sm">
        {error ? 'Failed to load trades' : 'No trades found for this account'}
      </div>
    );
  }

  const closedTrades = trades.filter((t) => t.is_closed);
  const openTrades   = trades.filter((t) => !t.is_closed);

  const totalProfit  = closedTrades.reduce((s, t) => s + (t.net_profit ?? t.profit ?? 0), 0);
  const winCount     = closedTrades.filter((t) => (t.net_profit ?? t.profit ?? 0) > 0).length;
  const winRate      = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <p className="text-xs text-mp-text-muted">Total Trades</p>
          <p className="text-lg font-bold text-mp-text-primary">{closedTrades.length}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <p className="text-xs text-mp-text-muted">Win Rate</p>
          <p className={`text-lg font-bold ${winRate >= 50 ? 'text-mp-green' : 'text-mp-red'}`}>
            {winRate.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <p className="text-xs text-mp-text-muted">Net P/L</p>
          <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
            {formatPL(totalProfit, 'USD')}
          </p>
        </div>
      </div>

      {/* Open positions */}
      {openTrades.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-mp-text-secondary uppercase tracking-wide mb-2">
            Open Positions ({openTrades.length})
          </p>
          <TradeRows trades={openTrades} isOpen />
        </div>
      )}

      {/* Closed trades */}
      <div>
        <p className="text-xs font-semibold text-mp-text-secondary uppercase tracking-wide mb-2">
          Trade History ({closedTrades.length})
        </p>
        <TradeRows trades={closedTrades} />
      </div>
    </div>
  );
}

type Trade = ReturnType<typeof useTradeHistory>['trades'] extends (infer T)[] | undefined ? T : never;

function TradeRows({ trades, isOpen = false }: { trades: Trade[]; isOpen?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-xs min-w-[640px]">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {['#Ticket', 'Symbol', 'Type', 'Lots', 'Open Price', isOpen ? 'Current' : 'Close Price', 'Open Time', isOpen ? 'Float P/L' : 'Net P/L'].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-mp-text-muted uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {trades.map((trade) => {
            const pl = trade.net_profit ?? trade.profit ?? 0;
            return (
              <tr key={trade.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-3 py-2.5 text-mp-text-muted font-mono">{trade.ticket_number}</td>
                <td className="px-3 py-2.5 font-semibold text-mp-text-primary">{trade.symbol}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1 font-semibold ${trade.trade_type === 'BUY' ? 'text-mp-green' : 'text-mp-red'}`}>
                    {trade.trade_type === 'BUY'
                      ? <TrendingUp className="w-3 h-3" />
                      : <TrendingDown className="w-3 h-3" />}
                    {trade.trade_type}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-mp-text-secondary">{formatLots(trade.lot_size)}</td>
                <td className="px-3 py-2.5 text-mp-text-secondary font-mono">{trade.open_price?.toFixed(5) ?? '—'}</td>
                <td className="px-3 py-2.5 text-mp-text-secondary font-mono">
                  {isOpen ? '—' : (trade.close_price?.toFixed(5) ?? '—')}
                </td>
                <td className="px-3 py-2.5 text-mp-text-muted whitespace-nowrap">
                  {formatDate(trade.open_time, 'datetime')}
                </td>
                <td className={`px-3 py-2.5 font-semibold ${pl >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
                  {formatPL(pl, 'USD')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────

export function BrokerDetailModal({ account, isOpen, onClose }: BrokerDetailModalProps) {
  if (!isOpen || !account) return null;

  const metrics  = account.latest_metrics;
  const broker   = account.broker_profiles;
  const pl       = metrics?.floating_profit ?? 0;
  const isOnline =
    metrics != null &&
    account.last_sync_at != null &&
    Date.now() - new Date(account.last_sync_at).getTime() < 10 * 60 * 1000;

  const initialDeposit = account.initial_deposit ?? 0;
  const currentBalance = metrics?.balance ?? 0;
  const totalReturn    = initialDeposit > 0 ? ((currentBalance - initialDeposit) / initialDeposit) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 h-full w-full max-w-2xl bg-[#080f1a] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-mp-text-primary capitalize">
                {broker?.broker_name ?? 'Broker'}
              </h2>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isOnline ? 'bg-mp-green/20 text-mp-green' : 'bg-white/10 text-mp-text-muted'}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-sm text-mp-text-muted">
              #{account.account_number} · {account.account_type} · {account.base_currency} · 1:{account.leverage}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-mp-text-muted hover:text-mp-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* Metrics grid */}
          <div>
            <p className="text-xs font-semibold text-mp-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Account Metrics
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricBox label="Balance" value={formatUSD(metrics?.balance ?? 0)} />
              <MetricBox label="Equity" value={formatUSD(metrics?.equity ?? 0)} />
              <MetricBox
                label="Floating P/L"
                value={formatPL(pl, 'USD')}
                highlight={pl >= 0 ? 'positive' : 'negative'}
              />
              <MetricBox label="Free Margin" value={formatUSD(metrics?.free_margin ?? 0)} />
              <MetricBox label="Margin Level" value={formatPercentage(metrics?.margin_level ?? 0)} />
              <MetricBox label="Open Positions" value={String(metrics?.open_positions ?? 0)} />
            </div>
          </div>

          {/* Return since deposit */}
          {initialDeposit > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs text-mp-text-muted">Initial Deposit</p>
                <p className="text-sm font-semibold text-mp-text-primary">{formatUSD(initialDeposit)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-mp-text-muted">Total Return</p>
                <p className={`text-sm font-bold ${totalReturn >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {/* Equity chart */}
          <div>
            <p className="text-xs font-semibold text-mp-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" /> Equity History
            </p>
            <div className="bg-white/5 rounded-xl border border-white/10 p-3">
              <EquitySection accountId={account.id} />
              <div className="flex items-center gap-4 mt-2 text-[10px] text-mp-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0.5 bg-blue-400 rounded" /> Equity
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 border-t border-dashed border-mp-green" /> Balance
                </span>
              </div>
            </div>
          </div>

          {/* Trade history */}
          <div>
            <p className="text-xs font-semibold text-mp-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Trade History
            </p>
            <TradeTable accountId={account.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
