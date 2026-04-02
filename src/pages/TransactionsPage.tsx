// src/pages/TransactionsPage.tsx
import { useState } from 'react';
import { TransactionList } from '@/features/wealth/components/TransactionList';
import { TransactionForm } from '@/features/wealth/components/TransactionForm';
import { Button } from '@/shared/components/Button';

export default function TransactionsPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-mp-text-primary">Transactions</h1>
        <Button onClick={() => setShowAdd(true)} leftIcon={<PlusCircle size={16} />}>
          Add Transaction
        </Button>
      </div>
      <div className="bg-mp-surface rounded-xl shadow-md p-6">
        <TransactionList showFilters={true} />
      </div>
      <TransactionForm isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
