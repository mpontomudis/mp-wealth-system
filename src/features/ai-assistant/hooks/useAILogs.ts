// src/features/ai-assistant/hooks/useAILogs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@/types/supabase';

export function useAILogs(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['ai-logs', userId] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getAILogs(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const createTransaction = useMutation({
    mutationFn: async (aiLogId: string) => {
      const response = await createTransactionFromAI(aiLogId);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      void queryClient.invalidateQueries({ queryKey: ['monthly-summary', userId] });
    },
  });

  return {
    logs: data as Tables<'ai_logs'>[] | undefined,
    isLoading,
    error,
    createTransaction,
  };
}
