// src/features/trading/hooks/useBrokerProfiles.ts
import { useQuery } from '@tanstack/react-query';
import { getBrokerProfiles } from '../services/trading.service';
import type { Tables } from '@/types/supabase';

export function useBrokerProfiles() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['broker-profiles'],
    queryFn: async () => {
      const response = await getBrokerProfiles();
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  return {
    brokers: data as Tables<'broker_profiles'>[] | undefined,
    isLoading,
    error,
  };
}
