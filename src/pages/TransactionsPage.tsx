// src/pages/TransactionsPage.tsx
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { TransactionList } from '@/features/wealth/components/TransactionList';
import { TransactionForm } from '@/features/wealth/components/TransactionForm';
import { Button } from '@/shared/components/Button';

export default function TransactionsPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <Button onClick={() => setShowAdd(true)} leftIcon={<PlusCircle size={16} />}>
          Add Transaction
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="relative">
          <TransactionList showFilters={true} />
        </div>
      </div>
      <TransactionForm isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
