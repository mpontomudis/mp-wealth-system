// src/pages/BudgetPage.tsx
import { useState, useMemo } from 'react';
import { PlusCircle, Target } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useBudgets } from '@/features/wealth/hooks/useBudgets';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { BudgetForm } from '@/features/wealth/components/BudgetForm';
import { BudgetVsActuals } from '@/features/wealth/components/BudgetVsActuals';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { formatIDR } from '@/shared/utils/formatters';
import type { Budget } from '@/features/wealth/services/budget.service';
import type { TransactionWithCategory } from '@/features/wealth/services/wealth.service';

// Fetch last 12 months for actuals calculation
function getLast12MonthsRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

const USD_RATE = 15750;
function toIdr(amount: number, currency: string | null) {
  return currency === 'USD' ? amount * USD_RATE : amount;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const { budgets, isLoading: budgetsLoading, remove } = useBudgets(user?.id ?? '');
  const { startDate, endDate } = getLast12MonthsRange();
  const { transactions, isLoading: txLoading } = useTransactions(user?.id ?? '', { startDate, endDate });

  // Monthly budget summary
  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const thisMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  const { totalBudgeted, totalSpent } = useMemo(() => {
    const monthlyBudgets = (budgets ?? []).filter((b) => b.period === 'monthly');
    const totalBudgeted = monthlyBudgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalSpent = (transactions ?? [])
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        const d = tx.transaction_date ?? '';
        return d >= thisMonthStart && d <= thisMonthEnd;
      })
      .reduce((sum, tx) => sum + toIdr(Number(tx.amount), tx.currency), 0);
    return { totalBudgeted, totalSpent };
  }, [budgets, transactions, thisMonthStart, thisMonthEnd]);

  const budgetUtilPct = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;

  const handleEdit = (budget: Budget) => {
    setEditBudget(budget);
    setShowForm(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (confirm('Delete this budget?')) {
      await remove.mutateAsync(budgetId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditBudget(null);
  };

  const isLoading = budgetsLoading || txLoading;

  // Cast transactions for BudgetVsActuals
  const txWithCategory = (transactions ?? []) as unknown as TransactionWithCategory[];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-mp-primary/10 border border-mp-primary/20 flex items-center justify-center">
            <Target size={17} className="text-mp-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-mp-text-primary">Budget Tracker</h1>
            <p className="text-xs text-mp-text-muted">Set limits and track actuals</p>
          </div>
        </div>
        <Button
          onClick={() => { setEditBudget(null); setShowForm(true); }}
          leftIcon={<PlusCircle size={15} />}
          size="sm"
        >
          New Budget
        </Button>
      </div>

      {/* Monthly Summary Banner */}
      {(budgets ?? []).some((b) => b.period === 'monthly') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-mp-text-secondary uppercase tracking-widest">
              This Month — Overall
            </p>
            <p className="text-xs text-mp-text-muted">
              {budgetUtilPct.toFixed(0)}% of budget used
            </p>
          </div>
          <div className="h-2.5 w-full bg-white/[0.06] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetUtilPct > 100 ? 'bg-mp-red' : budgetUtilPct > 75 ? 'bg-mp-gold' : 'bg-mp-green'
              }`}
              style={{ width: `${budgetUtilPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-mp-text-muted">
              Spent: <span className="font-semibold text-white">{formatIDR(totalSpent)}</span>
            </span>
            <span className="text-mp-text-muted">
              Budgeted: <span className="font-semibold text-white">{formatIDR(totalBudgeted)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Budget cards */}
      <Card title={`Active Budgets (${(budgets ?? []).length})`}>
        {isLoading ? (
          <div className="py-8 flex items-center justify-center text-mp-text-muted text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white/10 border-t-mp-primary animate-spin" />
              Loading…
            </div>
          </div>
        ) : (
          <BudgetVsActuals
            budgets={budgets ?? []}
            transactions={txWithCategory}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Card>

      <BudgetForm
        isOpen={showForm}
        onClose={handleCloseForm}
        editBudget={editBudget}
      />
    </div>
  );
}
