// src/features/wealth/components/BudgetVsActuals.tsx
import { useMemo } from 'react';
import { Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatIDR } from '@/shared/utils/formatters';
import { cn } from '@/shared/utils/cn';
import type { Budget } from '../services/budget.service';
import type { TransactionWithCategory } from '../services/wealth.service';

interface BudgetVsActualsProps {
  budgets: Budget[];
  transactions: TransactionWithCategory[];
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
}

const USD_RATE = 15750;
function toIdr(amount: number, currency: string | null) {
  return currency === 'USD' ? amount * USD_RATE : amount;
}

function getPeriodRange(period: string, _startDate: string): { start: string; end: string } {
  const now = new Date();

  if (period === 'daily') {
    const s = now.toISOString().split('T')[0];
    return { start: s, end: s };
  }
  if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now); mon.setDate(diff); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return {
      start: mon.toISOString().split('T')[0],
      end: sun.toISOString().split('T')[0],
    };
  }
  if (period === 'yearly') {
    return {
      start: `${now.getFullYear()}-01-01`,
      end: `${now.getFullYear()}-12-31`,
    };
  }
  // monthly (default)
  const y = now.getFullYear(); const m = now.getMonth() + 1;
  return {
    start: `${y}-${String(m).padStart(2,'0')}-01`,
    end: `${y}-${String(m).padStart(2,'0')}-${new Date(y, m, 0).getDate()}`,
  };
}

export function BudgetVsActuals({ budgets, transactions, onEdit, onDelete }: BudgetVsActualsProps) {
  const items = useMemo(() => {
    return budgets.map((budget) => {
      const { start, end } = getPeriodRange(budget.period, budget.start_date);

      const actual = transactions
        .filter((tx) => {
          if (tx.type !== 'expense') return false;
          const txDate = tx.transaction_date ?? '';
          if (txDate < start || txDate > end) return false;
          if (budget.category_id) {
            return tx.category_id === budget.category_id;
          }
          return true; // no category filter = all expenses
        })
        .reduce((sum, tx) => sum + toIdr(Number(tx.amount), tx.currency), 0);

      const budgetAmt = Number(budget.amount);
      const pct = budgetAmt > 0 ? Math.min((actual / budgetAmt) * 100, 100) : 0;
      const overBudget = actual > budgetAmt;

      return { budget, actual, budgetAmt, pct, overBudget, start, end };
    });
  }, [budgets, transactions]);

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-mp-text-muted text-sm">
        No active budgets. Add one to start tracking.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map(({ budget, actual, budgetAmt, pct, overBudget, start, end }) => {
        const catName = budget.categories?.name ?? 'All Expenses';
        const catIcon = budget.categories?.icon ?? '💰';
        const remaining = budgetAmt - actual;

        return (
          <div
            key={budget.id}
            className={cn(
              'rounded-xl border p-4 transition-all',
              overBudget
                ? 'border-mp-red/30 bg-mp-red/5'
                : 'border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.03]'
            )}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg leading-none shrink-0">{catIcon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-mp-text-primary truncate">{catName}</p>
                  <p className="text-[10px] text-mp-text-muted capitalize">
                    {budget.period} · {start} → {end}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {overBudget ? (
                  <AlertTriangle size={14} className="text-mp-red" />
                ) : (
                  <CheckCircle size={14} className="text-mp-green" />
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(budget)}
                    className="p-1.5 rounded-lg text-mp-text-muted hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                    title="Edit budget"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(budget.id)}
                    className="p-1.5 rounded-lg text-mp-text-muted hover:text-mp-red hover:bg-mp-red/10 transition-colors"
                    title="Delete budget"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  overBudget ? 'bg-mp-red' : pct > 75 ? 'bg-mp-gold' : 'bg-mp-green'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-mp-text-muted">
                Spent: <span className={cn('font-medium', overBudget ? 'text-mp-red' : 'text-mp-text-primary')}>{formatIDR(actual)}</span>
              </span>
              <span className="text-mp-text-muted">
                {overBudget ? 'Over by ' : 'Remaining: '}
                <span className={cn('font-medium', overBudget ? 'text-mp-red' : 'text-mp-green')}>
                  {formatIDR(Math.abs(remaining))}
                </span>
              </span>
              <span className="text-mp-text-muted">
                Budget: <span className="font-medium text-mp-text-primary">{formatIDR(budgetAmt)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
