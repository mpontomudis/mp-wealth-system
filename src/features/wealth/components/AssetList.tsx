// src/features/wealth/components/AssetList.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import { Modal } from '@/shared/components/Modal';
import { Badge } from '@/shared/components/Badge';
import { PageLoader } from '@/shared/components/LoadingSpinner';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatIDR, formatUSD } from '@/shared/utils/formatters';
import type { AssetType, TablesUpdate } from '@/types/supabase';

const ASSET_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'trading', label: 'Trading' },
  { value: 'investment', label: 'Investment' },
  { value: 'crypto', label: 'Crypto' },
];

const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
];

const ASSET_TYPE_BADGE: Record<AssetType, 'success' | 'info' | 'neutral' | 'warning' | 'danger'> = {
  cash: 'success',
  bank: 'info',
  trading: 'neutral',
  investment: 'warning',
  crypto: 'danger',
};

type AssetFormData = {
  name: string;
  type: AssetType;
  balance: number;
  currency: string;
};

export function AssetList() {
  const { user } = useAuth();
  const { assets, isLoading, update } = useAssets(user?.id ?? '');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetFormData>({
    defaultValues: { currency: 'IDR', type: 'cash' },
  });

  const onSubmit = (data: AssetFormData) => {
    if (editingId) {
      const payload: TablesUpdate<'assets'> = {
        name: data.name,
        type: data.type,
        balance: Number(data.balance),
        currency: data.currency,
      };
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
    }
    // TODO: useCreateAsset for new assets
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-mp-text-primary">{asset.name}</p>
                  <Badge
                    variant={ASSET_TYPE_BADGE[asset.type as AssetType] ?? 'neutral'}
                    className="mt-1"
                  >
                    {asset.type}
                  </Badge>
                </div>
                {/* TODO: delete */}
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-mp-text-primary">
                  {asset.currency === 'IDR'
                    ? formatIDR(asset.balance ?? 0)
                    : formatUSD(asset.balance ?? 0)}
                </div>
                {asset.balance_usd != null && (
                  <div className="text-sm text-mp-text-muted">≈ {formatUSD(asset.balance_usd)}</div>
                )}
                <div className="text-xs text-mp-text-muted mt-1">{asset.currency}</div>
              </div>
            </Card>
          ))}
        </div>
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
            <Button type="submit" loading={update.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
