// src/features/trading/hooks/useTradeHistory.ts
import { useQuery } from '@tanstack/react-query';
import { getTradeHistory } from '../services/trading.service';
import type { Tables } from '@/types/supabase';

export function useTradeHistory(accountId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trade-history', accountId],
    queryFn: async () => {
      const response = await getTradeHistory(accountId, 50);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(accountId),
    staleTime: 60_000,
  });

  return {
    trades: data as Tables<'trade_history'>[] | undefined,
    isLoading,
    error,
  };
}
