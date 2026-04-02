// src/features/wealth/hooks/useMonthlySummary.ts
import { useQuery } from '@tanstack/react-query';
import type { MonthlySummary } from '../services/wealth.service';

export function useMonthlySummary(userId: string, year?: number, month?: number) {
  const now = new Date();
  const resolvedYear = year ?? now.getFullYear();
  const resolvedMonth = month ?? now.getMonth() + 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-summary', userId, resolvedYear, resolvedMonth],
    queryFn: async () => {
      const response = await getMonthlySummary(userId, resolvedYear, resolvedMonth);
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  return {
    summary: data as MonthlySummary | null | undefined,
    isLoading,
    error,
    year: resolvedYear,
    month: resolvedMonth,
  };
}
