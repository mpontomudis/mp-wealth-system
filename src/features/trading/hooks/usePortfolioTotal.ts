// src/features/trading/hooks/usePortfolioTotal.ts
import { useQuery } from '@tanstack/react-query';
import type { PortfolioTotal } from '../services/trading.service';

export function usePortfolioTotal(userId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio-total', userId],
    queryFn: async () => {
      const response = await getPortfolioTotal(userId);
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  return {
    portfolio: data as PortfolioTotal | null | undefined,
    isLoading,
    error,
  };
}
