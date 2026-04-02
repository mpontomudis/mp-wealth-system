// src/features/ai-assistant/hooks/useOCRResults.ts
import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/types/supabase';

export function useOCRResults(aiLogId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ocr-results', aiLogId],
    queryFn: async () => {
      const response = await getOCRResults(aiLogId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(aiLogId),
    staleTime: 5 * 60_000,
  });

  return {
    results: data as Tables<'ocr_results'>[] | undefined,
    isLoading,
    error,
  };
}
