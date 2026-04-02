// src/shared/hooks/useExchangeRate.ts
import { useQuery } from '@tanstack/react-query';
import { getLatestExchangeRate } from '@/shared/services/currency.service';

export function useExchangeRate() {
  const { data, isLoading } = useQuery({
    queryKey: ['exchange_rate'],
    queryFn: getLatestExchangeRate,
    staleTime: 60 * 60 * 1000,
  });
  return { rate: data?.rate ?? 15750, isLoading };
}
