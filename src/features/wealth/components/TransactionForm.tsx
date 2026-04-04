// src/features/wealth/components/TransactionForm.tsx
import { useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { CustomSelect, type CustomSelectOption } from '@/shared/components/CustomSelect';
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

const TYPE_OPTIONS: CustomSelectOption[] = [
  { value: 'expense', label: 'Expense',  prefix: '📤' },
  { value: 'income',  label: 'Income',   prefix: '📥' },
  { value: 'transfer',label: 'Transfer', prefix: '🔄' },
];

const CURRENCY_OPTIONS: CustomSelectOption[] = [
  { value: 'IDR', label: 'IDR — Rupiah',  prefix: '🇮🇩' },
  { value: 'USD', label: 'USD — Dollar',  prefix: '🇺🇸' },
];

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
    formState: { errors, isSubmitting },
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

  const assetOptions: CustomSelectOption[] = [
    { value: '', label: '— None —' },
    ...(assets ?? []).map((a) => ({
      value: a.id,
      label: `${a.name}${a.institution ? ` · ${a.institution}` : ''}`,
      prefix: '🏦',
    })),
  ];

  const onSubmit = (data: FormData) => {
    if (create.isPending || update.isPending) return;
    const payload = {
      ...data,
      amount: Number(data.amount),
      fee: data.fee ? Number(data.fee) : null,
      from_asset_id: data.from_asset_id || null,
      to_asset_id: data.to_asset_id || null,
    };
    if (isEdit && transaction) {
      update.mutate({ id: transaction.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate({ ...payload, source: 'manual' }, { onSuccess: onClose });
    }
  };

  const isPending = create.isPending || update.isPending || remove.isPending;
  const mutationError = create.error || update.error || remove.error;

  const handleDelete = () => {
    if (transaction && window.confirm('Delete this transaction?')) {
      remove.mutate(transaction.id, { onSuccess: onClose });
    }
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-mp-text-muted focus:border-mp-primary focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-medium text-mp-text-secondary mb-1.5';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'New Transaction'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* ── Type ─────────────────────────────────────── */}
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Type"
              options={TYPE_OPTIONS}
              value={field.value}
              onChange={(v) => field.onChange(v as TransactionType)}
            />
          )}
        />

        {/* ── Amount + Currency ────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="any"
            min="0"
            placeholder="0"
            {...register('amount', { required: 'Required', valueAsNumber: true })}
            error={errors.amount?.message}
          />
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* ── From / To Account ────────────────────────── */}
        {txType === 'transfer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Controller
              name="from_asset_id"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="From Account"
                  options={assetOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="— Select —"
                />
              )}
            />
            <Controller
              name="to_asset_id"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="To Account"
                  options={assetOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="— Select —"
                />
              )}
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
          <Controller
            name="from_asset_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="From Account"
                options={assetOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="— Select account —"
              />
            )}
          />
        )}
        {txType === 'income' && (
          <Controller
            name="to_asset_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="To Account"
                options={assetOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="— Select account —"
              />
            )}
          />
        )}

        {/* Balance hint */}
        {(txType === 'income' || txType === 'expense') && (
          <p className="text-xs text-yellow-400/80 -mt-1">
            ⚠️ Pilih {txType === 'income' ? 'To Account' : 'From Account'} agar saldo aset otomatis terupdate.
          </p>
        )}

        {/* ── Description ──────────────────────────────── */}
        <Input
          label="Description"
          placeholder="What was this for?"
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
        />

        {/* ── Date ─────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Date</label>
          <input
            {...register('transaction_date', { required: 'Date is required' })}
            type="date"
            className={inputClass}
          />
          {errors.transaction_date && (
            <p className="mt-1 text-xs text-mp-red">{errors.transaction_date.message}</p>
          )}
        </div>

        {/* ── Notes ────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            {...register('notes')}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Additional notes..."
          />
        </div>

        {mutationError && (
          <p className="text-xs text-mp-red">
            {(mutationError as { message?: string })?.message ?? 'Failed to save. Please try again.'}
          </p>
        )}

        {/* ── Actions ──────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          {isEdit && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={remove.isPending}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || isPending} className="flex-1 sm:flex-none">
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}


