// src/features/wealth/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tables, TablesInsert } from '@/types/supabase';

export function useCategories(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['categories', userId] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getCategories(userId);
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const create = useMutation({
    mutationFn: async (payload: TablesInsert<'categories'>) => {
      const response = await createCategory(payload);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    categories: data as Tables<'categories'>[] | undefined,
    isLoading,
    error,
    create,
  };
}
