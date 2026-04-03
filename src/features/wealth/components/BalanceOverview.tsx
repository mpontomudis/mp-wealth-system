// src/features/wealth/components/BalanceOverview.tsx
import { useAuth } from '@/shared/hooks/useAuth';
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { PageLoader } from '@/shared/components/LoadingSpinner';
import { formatIDR, formatUSD } from '@/shared/utils/formatters';
import type { AssetType } from '@/types/supabase';

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  cash: 'bg-green-500/10 text-mp-green',
  bank: 'bg-blue-500/10 text-mp-blue',
  trading: 'bg-purple-500/10 text-purple-400',
  investment: 'bg-yellow-500/10 text-mp-gold',
  crypto: 'bg-orange-500/10 text-orange-400',
};

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  cash: 'Cash',
  bank: 'Bank',
  trading: 'Trading',
  investment: 'Investment',
  crypto: 'Crypto',
};

export function BalanceOverview() {
  const { user } = useAuth();
  const { assets, isLoading } = useAssets(user?.id ?? '');

  if (isLoading) return <PageLoader />;

  const totalIDR =
    assets?.reduce((sum, a) => {
      if (a.currency === 'IDR') return sum + (a.balance ?? 0);
      return sum + (a.balance_usd ?? 0) * 16000;
    }, 0) ?? 0;

  const totalUSD = assets?.reduce((sum, a) => sum + (a.balance_usd ?? 0), 0) ?? 0;

  const byType = (assets ?? []).reduce<Partial<Record<AssetType, number>>>((acc, a) => {
    const type = a.type as AssetType;
    const balanceIDR =
      a.currency === 'IDR' ? (a.balance ?? 0) : (a.balance_usd ?? 0) * 16000;
    acc[type] = (acc[type] ?? 0) + balanceIDR;
    return acc;
  }, {});

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6">
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"
      />
      <div className="relative">
        <p className="text-sm text-gray-400">Total Net Worth</p>
        <div className="mt-1 text-3xl font-bold text-white">{formatIDR(totalIDR)}</div>
        <div className="mt-0.5 text-sm text-gray-400">≈ {formatUSD(totalUSD)}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.entries(byType) as [AssetType, number][]).map(([type, total]) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-white/10 ${ASSET_TYPE_COLORS[type] ?? 'bg-white/5 text-gray-400'}`}
            >
              {ASSET_TYPE_LABELS[type] ?? type}: {formatIDR(total)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
