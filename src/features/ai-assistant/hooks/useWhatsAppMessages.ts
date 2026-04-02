// src/features/ai-assistant/hooks/useWhatsAppMessages.ts
import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/types/supabase';

export function useWhatsAppMessages(userId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['whatsapp-messages', userId],
    queryFn: async () => {
      const response = await getWhatsAppMessages(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  return {
    messages: data as Tables<'whatsapp_messages'>[] | undefined,
    isLoading,
    error,
  };
}
