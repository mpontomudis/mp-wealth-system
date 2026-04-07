// src/features/wealth/components/AssetList.tsx
import { useState } from 'react';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import { Modal } from '@/shared/components/Modal';
import { PageLoader } from '@/shared/components/LoadingSpinner';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatIDR, formatUSD } from '@/shared/utils/formatters';
import type { AssetType } from '@/types/supabase';

const ASSET_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'e_wallet', label: 'E-Wallet (GoPay, OVO, dll)' },
  { value: 'trading', label: 'Trading' },
  { value: 'investment', label: 'Investment' },
  { value: 'crypto', label: 'Crypto' },
];

const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
];

// Teofin gradient per asset type
const ASSET_GRADIENT: Record<AssetType, string> = {
  bank:       'card-gradient-visa',
  e_wallet:   'card-gradient-teal',
  cash:       'card-gradient-green',
  trading:    'card-gradient-blue',
  investment: 'card-gradient-mastercard',
  crypto:     'card-gradient-purple',
};

const ASSET_EMOJI: Record<AssetType, string> = {
  bank:       '🏦',
  e_wallet:   '📱',
  cash:       '💵',
  trading:    '📈',
  investment: '💼',
  crypto:     '🪙',
};

type AssetFormData = {
  name: string;
  type: AssetType;
  balance: number;
  currency: string;
};

export function AssetList() {
  const { user } = useAuth();
  const { assets, isLoading, create, update, remove } = useAssets(user?.id ?? '');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AssetFormData>({
    defaultValues: { currency: 'IDR', type: 'cash' },
  });

  const onSubmit = (data: AssetFormData) => {
    const payload = {
      name: data.name,
      type: data.type,
      balance: Number(data.balance),
      currency: data.currency,
    };

    if (editingId) {
      update.mutate(
        { id: editingId, payload },
        {
          onSuccess: () => {
            reset();
            setShowModal(false);
            setEditingId(null);
          },
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          reset();
          setShowModal(false);
        },
      });
    }
  };

  const openAdd = () => {
    setEditingId(null);
    reset({ currency: 'IDR', type: 'cash' });
    setShowModal(true);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-mp-text-primary">Assets</h3>
        <Button size="sm" onClick={openAdd} leftIcon={<PlusCircle size={16} />}>
          Add Asset
        </Button>
      </div>

      {!assets || assets.length === 0 ? (
        <EmptyState title="No assets yet" description="Add your first asset to get started" />
      ) : (
        <>
          {/* ─── Total Summary ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {(() => {
              const IDR_RATE = 15750;
              const totalIdr = assets.reduce((sum, a) => {
                const bal = Number(a.balance ?? 0);
                return sum + (a.currency === 'USD' ? bal * IDR_RATE : bal);
              }, 0);
              const totalUsd = totalIdr / IDR_RATE;
              const byType = assets.reduce<Record<string, number>>((acc, a) => {
                const bal = Number(a.balance ?? 0);
                const idr = a.currency === 'USD' ? bal * IDR_RATE : bal;
                acc[a.type] = (acc[a.type] ?? 0) + idr;
                return acc;
              }, {});
              const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
              return (
                <>
                  <div className="rounded-xl bg-mp-primary/10 border border-mp-primary/20 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2 sm:gap-0">
                    <p className="text-xs text-mp-text-muted">Total Balance</p>
                    <div className="text-right sm:text-center">
                      <p className="text-sm font-bold text-mp-primary">{formatIDR(totalIdr)}</p>
                      <p className="text-xs text-mp-text-muted">≈ {formatUSD(totalUsd)}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-white/[0.04] dark:border-white/10 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2 sm:gap-0">
                    <p className="text-xs text-mp-text-muted">Total Assets</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{assets.length} akun</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-white/[0.04] dark:border-white/10 px-4 py-3 flex sm:flex-col items-center sm:text-center justify-between sm:justify-center gap-2 sm:gap-0">
                    <p className="text-xs text-mp-text-muted">Terbesar</p>
                    <div className="text-right sm:text-center">
                      <p className="text-xs text-slate-800 dark:text-white font-semibold capitalize">{topType?.[0] ?? '—'}</p>
                      <p className="text-xs text-mp-text-muted">{topType ? formatIDR(topType[1]) : '—'}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const gradClass = ASSET_GRADIENT[asset.type as AssetType] ?? 'card-gradient-blue';
            const emoji = ASSET_EMOJI[asset.type as AssetType] ?? '💰';
            return (
              <div key={asset.id} className={`${gradClass} rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:scale-[1.02] dark:saturate-[0.75] dark:brightness-90`}>
                {/* Decorative circles */}
                <div aria-hidden className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div aria-hidden className="absolute right-6 bottom-2 w-14 h-14 rounded-full bg-white/10" />

                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="font-semibold text-white text-sm leading-tight">{asset.name}</p>
                      <p className="text-xs text-white/70 capitalize mt-0.5">{asset.type.replace('_', '-')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                      title="Edit"
                      onClick={() => {
                        setValue('name', asset.name ?? '');
                        setValue('type', asset.type as AssetType);
                        setValue('balance', asset.balance ?? 0);
                        setValue('currency', asset.currency ?? 'IDR');
                        setEditingId(asset.id);
                        setShowModal(true);
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/15 hover:bg-red-500/40 text-white transition-colors"
                      title="Delete"
                      onClick={() => {
                        if (window.confirm(`Delete "${asset.name}"?`)) {
                          remove.mutate(asset.id);
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="relative mt-4">
                  <p className="text-2xl font-bold text-white leading-tight">
                    {asset.currency === 'IDR'
                      ? formatIDR(asset.balance ?? 0)
                      : formatUSD(asset.balance ?? 0)}
                  </p>
                  {asset.balance_usd != null && asset.currency !== 'USD' && (
                    <p className="text-xs text-white/70 mt-0.5">≈ {formatUSD(asset.balance_usd)}</p>
                  )}
                  {asset.institution && (
                    <p className="text-xs text-white/60 mt-1">{asset.institution}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          reset();
        }}
        title={editingId ? 'Edit Asset' : 'Add Asset'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Select
            label="Asset Type"
            options={ASSET_TYPE_OPTIONS}
            {...register('type', { required: 'Required' })}
            error={errors.type?.message}
          />
          <Input
            label="Balance"
            type="number"
            step="any"
            {...register('balance', { required: 'Required', valueAsNumber: true })}
            error={errors.balance?.message}
          />
          <Select label="Currency" options={CURRENCY_OPTIONS} {...register('currency')} />
          {(create.error || update.error) && (
            <p className="text-xs text-red-400 bg-red-900/20 rounded p-2 break-all">
              {(() => {
                const err = (create.error || update.error) as unknown as Record<string, unknown>;
                return err?.message
                  ? `Error: ${String(err.message)}${err.details ? ` — ${String(err.details)}` : ''}${err.hint ? ` (Hint: ${String(err.hint)})` : ''}`
                  : 'Save failed. Check browser console for details.';
              })()}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
