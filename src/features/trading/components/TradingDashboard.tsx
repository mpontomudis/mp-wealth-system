// src/features/trading/components/TradingDashboard.tsx
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Wifi, WifiOff, AlertCircle, Plus } from 'lucide-react';
import { useTradingAccounts } from '../hooks/useTradingAccounts';
import { usePortfolioTotal } from '../hooks/usePortfolioTotal';
import { useEquityChart } from '../hooks/useEquityChart';
import { useTradeHistory } from '../hooks/useTradeHistory';
import { formatUSD, formatIDR, formatDate, formatPL, formatLots, formatPercentage } from '@/shared/utils/formatters';
import type { TradingAccountWithLatestMetrics } from '../services/trading.service';
import { AddTradingAccountModal } from './AddTradingAccountModal';

// ─── Shared primitives ────────────────────────────────────────

function Card({
  children,
  className = '',
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 transition-all duration-300 hover:border-white/20 ${className}`}
    >
      {/* Glow overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="relative">
        {title && (
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-mp-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-mp-text-muted">
      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  primary,
  secondary,
  positive,
}: {
  label: string;
  primary: string;
  secondary?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-mp-text-secondary uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-2xl font-bold ${
          positive === undefined
            ? 'text-mp-text-primary'
            : positive
            ? 'text-mp-green'
            : 'text-mp-red'
        }`}
      >
        {primary}
      </span>
      {secondary && (
        <span className="text-sm text-mp-text-muted">{secondary}</span>
      )}
    </div>
  );
}

// ─── Broker Status Badge ──────────────────────────────────────

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
        online
          ? 'bg-mp-green/10 text-mp-green border-mp-green/20'
          : 'bg-white/5 text-gray-400 border-white/10'
      }`}
    >
      {online ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

// ─── Equity Chart Panel ───────────────────────────────────────

function EquityChartPanel({ accountId }: { accountId: string }) {
  const { chartData, isLoading, error } = useEquityChart(accountId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load chart data." />;
  if (!chartData?.length) return <EmptyState message="No equity history available." />;

  const formatted = chartData.map((p) => ({
    ...p,
    label: formatDate(p.time, 'short'),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatUSD(value),
            name === 'equity' ? 'Equity' : 'Balance',
          ]}
          labelFormatter={(label: string) => `Date: ${label}`}
          contentStyle={{
            background: 'rgba(2, 6, 23, 0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            fontSize: 12,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        />
        <Line
          type="monotone"
          dataKey="equity"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 2"
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Trade History Table ──────────────────────────────────────

function TradeHistoryTable({ accountId }: { accountId: string }) {
  const { trades, isLoading, error } = useTradeHistory(accountId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load trade history." />;
  if (!trades?.length) return <EmptyState message="No trades found." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mp-border">
            {['Symbol', 'Type', 'Lots', 'Open Time', 'Profit'].map((h) => (
              <th
                key={h}
                className="pb-3 text-left text-xs font-semibold text-mp-text-secondary uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mp-border">
          {trades.map((trade) => {
            const isProfit = (trade.profit ?? 0) >= 0;
            return (
              <tr key={trade.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-3 font-medium text-mp-text-primary">{trade.symbol}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      trade.trade_type === 'BUY' ? 'text-mp-green' : 'text-mp-red'
                    }`}
                  >
                    {trade.trade_type === 'BUY' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {trade.trade_type}
                  </span>
                </td>
                <td className="py-3 text-mp-text-secondary">{formatLots(trade.lot_size)}</td>
                <td className="py-3 text-mp-text-muted">{formatDate(trade.open_time, 'datetime')}</td>
                <td className={`py-3 font-semibold ${isProfit ? 'text-mp-green' : 'text-mp-red'}`}>
                  {formatPL(trade.profit ?? 0, 'USD')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function isAccountOnline(account: TradingAccountWithLatestMetrics): boolean {
  return (
    account.latest_metrics != null &&
    account.last_sync_at != null &&
    Date.now() - new Date(account.last_sync_at).getTime() < 10 * 60 * 1000
  );
}

// ─── Main Dashboard ───────────────────────────────────────────

interface TradingDashboardProps {
  userId: string;
}

export function TradingDashboard({ userId }: TradingDashboardProps) {
  const { accounts, isLoading: accountsLoading, error: accountsError } = useTradingAccounts(userId);
  const { portfolio, isLoading: portfolioLoading } = usePortfolioTotal(userId);

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Default to first account once loaded
  React.useEffect(() => {
    if (accounts?.length && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const totalPL = portfolio?.total_profit_usd ?? 0;

  const onlineAccounts = accounts?.filter(isAccountOnline).length ?? 0;
  const activeAccounts = accounts?.filter((a) => a.is_active).length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4">

      {/* ── 1. Portfolio Summary ── */}
      <Card title="Portfolio Overview">
        {portfolioLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatCard
              label="Total Equity"
              primary={formatUSD(portfolio?.total_equity_usd ?? 0)}
              secondary={formatIDR(portfolio?.total_equity_idr ?? 0)}
            />
            <StatCard
              label="Total Balance"
              primary={formatUSD(portfolio?.total_balance_usd ?? 0)}
            />
            <StatCard
              label="Floating P/L"
              primary={formatPL(totalPL, 'USD')}
              positive={totalPL >= 0}
            />
            <StatCard
              label="Accounts Online"
              primary={`${onlineAccounts} / ${activeAccounts}`}
            />
          </div>
        )}
      </Card>

      {/* ── 2. Broker Account Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-mp-text-secondary uppercase tracking-wide">
            Broker Accounts
          </h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-mp-primary hover:text-mp-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
        {accountsLoading ? (
          <LoadingSpinner />
        ) : accountsError ? (
          <EmptyState message="Failed to load broker accounts." />
        ) : !accounts?.length ? (
          <EmptyState message="No trading accounts found." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => {
              const broker = account.broker_profiles;
              const isSelected = account.id === selectedAccountId;
              const metrics = account.latest_metrics;
              const pl = metrics?.floating_profit ?? 0;
              const online = isAccountOnline(account);

              return (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`text-left rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                    isSelected
                      ? 'border-mp-primary/40 bg-mp-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-mp-text-primary capitalize">
                        {broker?.broker_name ?? 'Unknown Broker'}
                      </p>
                      <p className="text-xs text-mp-text-muted mt-0.5">
                        #{account.account_number ?? '—'}
                      </p>
                    </div>
                    <StatusBadge online={online} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <p className="text-xs text-mp-text-muted">Balance</p>
                      <p className="font-semibold text-mp-text-primary text-sm">
                        {formatUSD(metrics?.balance ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-mp-text-muted">Equity</p>
                      <p className="font-semibold text-mp-text-primary text-sm">
                        {formatUSD(metrics?.equity ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-mp-text-muted">Floating P/L</p>
                      <p className={`font-semibold text-sm ${pl >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
                        {formatPL(pl, 'USD')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-mp-text-muted">Margin Level</p>
                      <p className="font-semibold text-mp-text-primary text-sm">
                        {formatPercentage(metrics?.margin_level ?? 0)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. Equity Chart ── */}
      {selectedAccountId && (
        <Card title="Equity History">
          <EquityChartPanel accountId={selectedAccountId} />
          <div className="flex items-center gap-4 mt-3 text-xs text-mp-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 bg-mp-blue rounded" />
              Equity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 border-t-2 border-dashed border-mp-green" />
              Balance
            </span>
          </div>
        </Card>
      )}

      {/* ── 4. Trade History ── */}
      {selectedAccountId && (
        <Card title="Recent Trades">
          <TradeHistoryTable accountId={selectedAccountId} />
        </Card>
      )}

      {/* ── 5. Add Account Modal ── */}
      <AddTradingAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userId={userId}
      />
    </div>
  );
}

export default TradingDashboard;