// src/features/wealth/hooks/useAssets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../services/wealth.service';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

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

  const create = useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'assets'>, 'user_id'>) => {
      const response = await createAsset(payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
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

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteAsset(id);
      if (response.error) throw response.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    assets: data as Tables<'assets'>[] | undefined,
    isLoading,
    error,
    create,
    update,
    remove,
  };
}
