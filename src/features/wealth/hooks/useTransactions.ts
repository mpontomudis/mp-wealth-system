// src/features/wealth/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/wealth.service';
import type { TransactionFilters } from '../services/wealth.service';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export function useTransactions(userId: string, filters?: TransactionFilters) {
  const queryClient = useQueryClient();
  const queryKey = ['transactions', userId, filters ?? {}] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getTransactions(userId, filters);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'transactions'>, 'user_id'>) => {
      const response = await createTransaction(payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      void queryClient.invalidateQueries({ queryKey: ['monthly-summary', userId] });
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: TablesUpdate<'transactions'>;
    }) => {
      const response = await updateTransaction(id, payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      void queryClient.invalidateQueries({ queryKey: ['monthly-summary', userId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteTransaction(id);
      if (response.error) throw response.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      void queryClient.invalidateQueries({ queryKey: ['monthly-summary', userId] });
    },
  });

  return {
    transactions: data as Tables<'transactions'>[] | undefined,
    isLoading,
    error,
    create,
    update,
    remove,
  };
}
