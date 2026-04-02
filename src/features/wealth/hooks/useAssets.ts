// src/features/wealth/hooks/useAssets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, updateAsset } from '../services/wealth.service';
import type { Tables, TablesUpdate } from '@/types/supabase';

export function useAssets(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['assets', userId] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getAssets(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: TablesUpdate<'assets'>;
    }) => {
      const response = await updateAsset(id, payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    assets: data as Tables<'assets'>[] | undefined,
    isLoading,
    error,
    update,
  };
}
