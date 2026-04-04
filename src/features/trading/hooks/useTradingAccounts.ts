// src/features/trading/hooks/useTradingAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTradingAccountsWithLatestMetrics, deleteTradingAccount } from '../services/trading.service';
import type { TradingAccountWithLatestMetrics } from '../services/trading.service';

export function useTradingAccounts(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['trading-accounts', userId] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getTradingAccountsWithLatestMetrics(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteTradingAccount(id);
      if (response.error) throw response.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    accounts: data as TradingAccountWithLatestMetrics[] | undefined,
    isLoading,
    error,
    remove,
  };
}