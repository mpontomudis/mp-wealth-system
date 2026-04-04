// src/features/wealth/components/TransactionForm.tsx
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '@/config/constants';
import type { Tables, TransactionType } from '@/types/supabase';

type Transaction = Tables<'transactions'>;

interface TransactionFormProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

type FormData = {
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  from_asset_id?: string;
  to_asset_id?: string;
  fee?: number;
  notes?: string;
};

const TYPE_OPTIONS = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
];

// Fallback category labels for display only (category_id FK requires category lookup service)
const _ALL_CATEGORY_NAMES = [
  ...DEFAULT_INCOME_CATEGORIES.map((c) => c.name),
  ...DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name),
];
void _ALL_CATEGORY_NAMES; // available for future category-name lookup UI

export function TransactionForm({ transaction, isOpen, onClose }: TransactionFormProps) {
  const { user } = useAuth();
  const { create, update, remove } = useTransactions(user?.id ?? '');
  const { assets } = useAssets(user?.id ?? '');
  const isEdit = Boolean(transaction);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      type: 'expense',
      currency: 'IDR',
      transaction_date: new Date().toISOString().split('T')[0],
    },
  });

  const txType = useWatch({ control, name: 'type' });

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type as TransactionType,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description ?? '',
        transaction_date:
          transaction.transaction_date?.split('T')[0] ??
          new Date().toISOString().split('T')[0],
        from_asset_id: transaction.from_asset_id ?? '',
        to_asset_id: transaction.to_asset_id ?? '',
        fee: transaction.fee ?? undefined,
        notes: transaction.notes ?? '',
      });
    } else {
      reset({
        type: 'expense',
        currency: 'IDR',
        transaction_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [transaction, reset]);

  const assetOptions = [
    { value: '', label: '— None —' },
    ...(assets ?? []).map((a) => ({
      value: a.id,
      label: `${a.name}${a.institution ? ` (${a.institution})` : ''}`,
    })),
  ];

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      amount: Number(data.amount),
      fee: data.fee ? Number(data.fee) : null,
      from_asset_id: data.from_asset_id || null,
      to_asset_id: data.to_asset_id || null,
    };

    if (isEdit && transaction) {
      update.mutate(
        { id: transaction.id, payload },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        { ...payload, source: 'manual' },
        { onSuccess: onClose },
      );
    }
  };

  const isPending = create.isPending || update.isPending || remove.isPending;
  const mutationError = create.error || update.error || remove.error;

  const handleDelete = () => {
    if (transaction && window.confirm('Delete this transaction?')) {
      remove.mutate(transaction.id, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'New Transaction'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          {...register('type', { required: 'Required' })}
          error={errors.type?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="any"
            min="0"
            {...register('amount', { required: 'Required', valueAsNumber: true })}
            error={errors.amount?.message}
          />
          <Select label="Currency" options={CURRENCY_OPTIONS} {...register('currency')} />
        </div>

        {/* From / To Account — shown contextually */}
        {txType === 'transfer' && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="From Account"
              options={assetOptions}
              {...register('from_asset_id')}
            />
            <Select
              label="To Account"
              options={assetOptions}
              {...register('to_asset_id')}
            />
          </div>
        )}
        {txType === 'transfer' && (
          <Input
            label="Transfer Fee (opsional)"
            type="number"
            step="any"
            min="0"
            placeholder="mis. 2500"
            {...register('fee', { valueAsNumber: true })}
          />
        )}
        {txType === 'expense' && (
          <Select
            label="From Account"
            options={assetOptions}
            {...register('from_asset_id')}
          />
        )}
        {txType === 'income' && (
          <Select
            label="To Account"
            options={assetOptions}
            {...register('to_asset_id')}
          />
        )}

        <Input
          label="Description"
          placeholder="What was this for?"
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
        />
        <Input
          label="Date"
          type="date"
          {...register('transaction_date', { required: 'Date is required' })}
          error={errors.transaction_date?.message}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-mp-text-secondary">Notes (optional)</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full rounded-lg border border-mp-border bg-mp-background px-3 py-2 text-sm text-mp-text-primary placeholder:text-mp-text-muted focus:border-mp-primary focus:outline-none focus:ring-1 focus:ring-mp-primary resize-none"
            placeholder="Additional notes..."
          />
        </div>
        {mutationError && (
          <p className="text-xs text-red-500">
            {(mutationError as { message?: string })?.message ?? 'Failed to save. Please try again.'}
          </p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          {isEdit && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={remove.isPending}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
