// src/features/trading/components/BrokerCard.tsx
import React from 'react';
import { Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';
import { formatUSD, formatPercentage, formatDate, formatPL } from '@/shared/utils/formatters';
import type { TradingAccountWithLatestMetrics } from '../services/trading.service';

// ─── Broker accent colors ─────────────────────────────────────

const BROKER_COLORS: Record<string, string> = {
  EXNESS:   '#00b386',
  TICKMILL: '#e63e2a',
  ICM:      '#0066cc',
  XM:       '#ff6600',
  MIFX:     '#8b5cf6',
};

function getBrokerColor(brokerCode?: string | null): string {
  if (!brokerCode) return '#0A1F44';
  return BROKER_COLORS[brokerCode] ?? '#0A1F44';
}

// ─── Props ────────────────────────────────────────────────────

interface BrokerCardProps {
  account: TradingAccountWithLatestMetrics;
  selected?: boolean;
  onClick?: () => void;
}

// ─── Component ───────────────────────────────────────────────

export function BrokerCard({ account, selected = false, onClick }: BrokerCardProps) {
  const broker = account.broker_profiles;
  const brokerName = broker?.broker_name ?? 'Unknown';
  const accentColor = getBrokerColor(broker?.broker_code);

  const metrics = account.latest_metrics;
  const balance = metrics?.balance ?? 0;
  const equity = metrics?.equity ?? 0;
  const pl = metrics?.floating_profit ?? 0;
  const marginLevel = metrics?.margin_level ?? 0;
  const openPositions = metrics?.open_positions ?? 0;
  const totalLots = metrics?.total_lots ?? 0;

  const isOnline =
    account.latest_metrics != null &&
    account.last_sync_at != null &&
    Date.now() - new Date(account.last_sync_at).getTime() < 10 * 60 * 1000;

  const isProfit = pl >= 0;
  const hasOpenPositions = openPositions > 0;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={[
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300',
        onClick ? 'cursor-pointer' : '',
        selected
          ? 'border-mp-primary/40 bg-mp-primary/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 hover:scale-[1.01]',
      ].join(' ')}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-5 pt-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Broker initial avatar */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {brokerName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-mp-text-primary capitalize leading-tight">
                {brokerName}
              </p>
              <p className="text-xs text-mp-text-muted mt-0.5">
                #{account.account_number ?? '—'}
              </p>
            </div>
          </div>

          {/* Online / Offline badge */}
          <span
            className={[
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0',
              isOnline
                ? 'bg-emerald-50 text-mp-green'
                : 'bg-slate-100 text-mp-text-muted',
            ].join(' ')}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* ── Metrics grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Metric label="Balance" value={formatUSD(balance)} />
          <Metric label="Equity"  value={formatUSD(equity)} />

          <Metric
            label="Floating P/L"
            value={formatPL(pl, 'USD')}
            valueClassName={isProfit ? 'text-mp-green' : 'text-mp-red'}
            icon={
              isProfit
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />
            }
          />

          <Metric
            label="Margin Level"
            value={formatPercentage(marginLevel)}
            valueClassName={
              marginLevel < 120
                ? 'text-mp-red'
                : marginLevel < 200
                ? 'text-mp-gold'
                : 'text-mp-text-primary'
            }
          />
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-mp-border">
          <span className="text-xs text-mp-text-muted">
            {hasOpenPositions
              ? `${openPositions} open position${openPositions > 1 ? 's' : ''} · ${totalLots.toFixed(2)} lots`
              : 'No open positions'}
          </span>
          {account.last_sync_at && (
            <span className="text-xs text-mp-text-muted">
              {formatDate(account.last_sync_at, 'relative')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Metric sub-component ─────────────────────────────────────

function Metric({
  label,
  value,
  valueClassName = 'text-mp-text-primary',
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-mp-text-muted mb-0.5">{label}</p>
      <p className={`text-sm font-semibold flex items-center gap-1 ${valueClassName}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}

export default BrokerCard;