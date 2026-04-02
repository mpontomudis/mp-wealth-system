// src/features/trading/hooks/useTradingAccounts.ts
import { useQuery } from '@tanstack/react-query';
import type { TradingAccountWithLatestMetrics } from '../services/trading.service';

export function useTradingAccounts(userId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trading-accounts', userId],
    queryFn: async () => {
      const response = await getTradingAccountsWithLatestMetrics(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  return {
    accounts: data as TradingAccountWithLatestMetrics[] | undefined,
    isLoading,
    error,
  };
}