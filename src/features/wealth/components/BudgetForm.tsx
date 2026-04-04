// src/features/wealth/components/BudgetForm.tsx
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { CustomSelect, type CustomSelectOption } from '@/shared/components/CustomSelect';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useBudgets } from '../hooks/useBudgets';
import type { Budget, BudgetPeriod } from '../services/budget.service';

// ─── Emoji palette for new categories ────────────────────────

const CATEGORY_EMOJIS = [
  '🍔','🚗','🛍️','🎬','💊','📚','⚡','🏠',
  '✈️','💰','💸','📈','🎮','☕','👔','🏋️',
];
const CATEGORY_COLORS = [
  '#ef4444','#f97316','#f59e0b','#10b981',
  '#3b82f6','#8b5cf6','#ec4899','#14b8a6',
];

// ─── Types ───────────────────────────────────────────────────

interface BudgetFormValues {
  category_id: string;
  amount: string;
  period: BudgetPeriod;
  start_date: string;
}

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editBudget?: Budget | null;
}

const PERIOD_OPTIONS: CustomSelectOption[] = [
  { value: 'daily',   label: 'Daily',   prefix: '📅' },
  { value: 'weekly',  label: 'Weekly',  prefix: '📆' },
  { value: 'monthly', label: 'Monthly', prefix: '🗓️' },
  { value: 'yearly',  label: 'Yearly',  prefix: '📊' },
];

// ─── Component ───────────────────────────────────────────────

export function BudgetForm({ isOpen, onClose, editBudget }: BudgetFormProps) {
  const { user } = useAuth();
  const { categories, create: createCategory } = useCategories(user?.id ?? '');
  const { create, update } = useBudgets(user?.id ?? '');

  // Inline create-category state
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍔');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError, setCatError] = useState('');

  const expenseCategories = (categories ?? []).filter((c) => c.type === 'expense' && !c.deleted_at);

  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } =
    useForm<BudgetFormValues>({
      defaultValues: { category_id: '', amount: '', period: 'monthly', start_date: today },
    });

  useEffect(() => {
    if (!isOpen) {
      setShowNewCat(false);
      setNewCatName('');
      setCatError('');
    }
    if (editBudget) {
      reset({
        category_id: editBudget.category_id ?? '',
        amount: String(editBudget.amount),
        period: editBudget.period,
        start_date: editBudget.start_date,
      });
    } else {
      reset({ category_id: '', amount: '', period: 'monthly', start_date: today });
    }
  }, [editBudget, isOpen, reset, today]);

  // Build category options for CustomSelect
  const categoryOptions: CustomSelectOption[] = [
    { value: '', label: 'All Expenses (no filter)', prefix: '💰' },
    ...expenseCategories.map((c) => ({
      value: c.id,
      label: c.name,
      prefix: c.icon ?? '📌',
    })),
  ];

  // Create new category inline
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) { setCatError('Name is required'); return; }
    setCreatingCat(true);
    setCatError('');
    try {
      const result = await createCategory.mutateAsync({
        name: newCatName.trim(),
        type: 'expense',
        icon: newCatEmoji,
        color: newCatColor,
        is_active: true,
      } as never);
      if (result) {
        setValue('category_id', result.id);
      }
      setShowNewCat(false);
      setNewCatName('');
      setNewCatEmoji('🍔');
    } catch {
      setCatError('Failed to create category. Try again.');
    } finally {
      setCreatingCat(false);
    }
  };

  const onSubmit = async (values: BudgetFormValues) => {
    const payload = {
      category_id: values.category_id || null,
      amount: parseFloat(values.amount),
      period: values.period,
      start_date: values.start_date,
      end_date: null as string | null,
      is_active: true,
    };
    if (editBudget) {
      await update.mutateAsync({ id: editBudget.id, payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-mp-text-muted focus:border-mp-primary focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-medium text-mp-text-secondary mb-1.5';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editBudget ? 'Edit Budget' : 'New Budget'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* ── Category ─────────────────────────────────────── */}
        <div>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Category (Expense)"
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="— Select category —"
                onAddNew={() => setShowNewCat((v) => !v)}
                addNewLabel="➕ Create new category"
              />
            )}
          />

          {/* Inline create-category panel */}
          {showNewCat && (
            <div className="mt-3 rounded-xl border border-mp-primary/20 bg-mp-primary/5 p-4 flex flex-col gap-3 animate-fade-in">
              <p className="text-xs font-semibold text-mp-primary uppercase tracking-wide">New Expense Category</p>

              {/* Name */}
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Food, Transport, Netflix…"
                className={inputClass}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateCategory(); } }}
              />
              {catError && <p className="text-xs text-mp-red -mt-1">{catError}</p>}

              {/* Emoji picker */}
              <div>
                <p className="text-[10px] text-mp-text-muted mb-2 uppercase tracking-wide">Icon</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatEmoji(emoji)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border ${
                        newCatEmoji === emoji
                          ? 'border-mp-primary bg-mp-primary/20 scale-110'
                          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-[10px] text-mp-text-muted mb-2 uppercase tracking-wide">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-full transition-all border-2 ${
                        newCatColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCat(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCategory}
                  loading={creatingCat}
                  className="flex-1"
                  disabled={!newCatName.trim()}
                >
                  {creatingCat ? <Loader2 size={14} className="animate-spin" /> : `Create "${newCatName || '…'}"`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Amount ───────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Budget Amount (IDR)</label>
          <input
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 1, message: 'Must be greater than 0' },
              validate: (v) => !isNaN(parseFloat(v)) || 'Must be a number',
            })}
            type="number"
            min="1"
            step="1000"
            placeholder="e.g. 5000000"
            className={inputClass}
          />
          {errors.amount && <p className="mt-1 text-xs text-mp-red">{errors.amount.message}</p>}
        </div>

        {/* ── Period ───────────────────────────────────────── */}
        <Controller
          name="period"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Period"
              options={PERIOD_OPTIONS}
              value={field.value}
              onChange={(v) => field.onChange(v as BudgetPeriod)}
            />
          )}
        />

        {/* ── Start Date ───────────────────────────────────── */}
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            {...register('start_date', { required: 'Start date is required' })}
            type="date"
            className={inputClass}
          />
          {errors.start_date && <p className="mt-1 text-xs text-mp-red">{errors.start_date.message}</p>}
        </div>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} leftIcon={<X size={14} />} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            {editBudget ? 'Update Budget' : 'Create Budget'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
