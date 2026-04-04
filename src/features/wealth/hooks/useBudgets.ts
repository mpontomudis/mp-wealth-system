// src/features/wealth/hooks/useBudgets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  type BudgetInsert,
  type BudgetUpdate,
} from '../services/budget.service';

export function useBudgets(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['budgets', userId] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getBudgets(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: async (payload: BudgetInsert) => {
      const response = await createBudget(payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: BudgetUpdate }) => {
      const response = await updateBudget(id, payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteBudget(id);
      if (response.error) throw response.error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  return { budgets: data, isLoading, error, create, update, remove };
}
