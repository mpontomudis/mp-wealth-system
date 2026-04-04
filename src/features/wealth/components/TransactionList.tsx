// src/features/wealth/components/TransactionList.tsx
import { useState } from 'react';
import { Cpu, ArrowRight } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTransactions } from '@/features/wealth/hooks/useTransactions';
import { useAssets } from '@/features/wealth/hooks/useAssets';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Badge } from '@/shared/components/Badge';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageLoader } from '@/shared/components/LoadingSpinner';
import { TransactionForm } from './TransactionForm';
import { formatIDR, formatDate } from '@/shared/utils/formatters';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import type { Tables, TransactionType } from '@/types/supabase';

type Transaction = Tables<'transactions'>;

interface TransactionListProps {
  limit?: number;
  showFilters?: boolean;
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

const AMOUNT_COLOR: Record<TransactionType, string> = {
  income: 'text-mp-green',
  expense: 'text-mp-red',
  transfer: 'text-mp-blue',
};

const TYPE_BADGE: Record<TransactionType, 'success' | 'danger' | 'info'> = {
  income: 'success',
  expense: 'danger',
  transfer: 'info',
};

const AMOUNT_PREFIX: Record<TransactionType, string> = {
  income: '+',
  expense: '−',
  transfer: '',
};

export function TransactionList({ limit, showFilters = true }: TransactionListProps) {
  const { user } = useAuth();
  const { transactions, isLoading } = useTransactions(user?.id ?? '');
  const { assets } = useAssets(user?.id ?? '');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Build asset name lookup map
  const assetMap = Object.fromEntries((assets ?? []).map((a) => [a.id, a.name]));

  if (isLoading) return <PageLoader />;

  let filtered = transactions ?? [];

  if (debouncedSearch) {
    const q = debouncedSearch.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description?.toLowerCase().includes(q),
    );
  }

  if (typeFilter !== 'all') {
    filtered = filtered.filter((t) => t.type === typeFilter);
  }

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0);
  const net = totalIncome - totalExpense;

  const pageSize = DEFAULT_PAGE_SIZE;
  const displayItems = limit
    ? filtered.slice(0, limit)
    : filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div>
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[180px]">
            <Input
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-36">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {showFilters && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-mp-green/10 border border-mp-green/20 px-4 py-3 text-center">
            <p className="text-xs text-mp-text-muted mb-1">Total Income</p>
            <p className="text-base font-bold text-mp-green">+{formatIDR(totalIncome)}</p>
          </div>
          <div className="rounded-xl bg-mp-red/10 border border-mp-red/20 px-4 py-3 text-center">
            <p className="text-xs text-mp-text-muted mb-1">Total Expenses</p>
            <p className="text-base font-bold text-mp-red">−{formatIDR(totalExpense)}</p>
          </div>
          <div className={`rounded-xl px-4 py-3 text-center border ${net >= 0 ? 'bg-mp-green/10 border-mp-green/20' : 'bg-mp-red/10 border-mp-red/20'}`}>
            <p className="text-xs text-mp-text-muted mb-1">Net</p>
            <p className={`text-base font-bold ${net >= 0 ? 'text-mp-green' : 'text-mp-red'}`}>
              {net >= 0 ? '+' : '−'}{formatIDR(Math.abs(net))}
            </p>
          </div>
        </div>
      )}

      {displayItems.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="No transactions match the current filters"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mp-border text-mp-text-secondary text-left">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 font-medium">AI</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setEditingTx(tx)}
                  className="border-b border-mp-border/50 hover:bg-mp-background/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4 text-mp-text-muted whitespace-nowrap">
                    {formatDate(tx.transaction_date, 'short')}
                  </td>
                  <td className="py-3 pr-4 text-mp-text-primary max-w-[200px] truncate">
                    <div>{tx.description ?? '—'}</div>
                    {tx.type === 'transfer' && (tx.from_asset_id || tx.to_asset_id) && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-mp-text-muted">
                        <span>{tx.from_asset_id ? assetMap[tx.from_asset_id] ?? '?' : '—'}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span>{tx.to_asset_id ? assetMap[tx.to_asset_id] ?? '?' : '—'}</span>
                      </div>
                    )}
                    {tx.type !== 'transfer' && tx.from_asset_id && (
                      <div className="text-xs text-mp-text-muted mt-0.5">
                        from {assetMap[tx.from_asset_id] ?? '?'}
                      </div>
                    )}
                    {tx.type !== 'transfer' && tx.to_asset_id && (
                      <div className="text-xs text-mp-text-muted mt-0.5">
                        to {assetMap[tx.to_asset_id] ?? '?'}
                      </div>
                    )}
                  </td>
                  <td
                    className={`py-3 pr-4 font-medium text-right whitespace-nowrap ${AMOUNT_COLOR[tx.type as TransactionType] ?? ''}`}
                  >
                    {AMOUNT_PREFIX[tx.type as TransactionType]}
                    {formatIDR(tx.amount)}
                    {tx.fee && tx.fee > 0 && (
                      <div className="text-xs text-mp-text-muted font-normal">
                        fee: {formatIDR(tx.fee)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={TYPE_BADGE[tx.type as TransactionType] ?? 'neutral'}>
                      {tx.type}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {tx.ai_log_id && (
                      <span aria-label="AI processed">
                        <Cpu size={14} className="text-mp-blue" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-mp-text-muted">
            Page {page} of {totalPages} ({filtered.length} total)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editingTx && (
        <TransactionForm
          transaction={editingTx}
          isOpen={Boolean(editingTx)}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
