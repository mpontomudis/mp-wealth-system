// src/features/trading/hooks/useAddTradingAccount.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTradingAccount } from '../services/trading.service';
import type { CreateTradingAccountPayload } from '../services/trading.service';

export function useAddTradingAccount(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateTradingAccountPayload) =>
      createTradingAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-accounts', userId] });
    },
  });

  return {
    addAccount:  mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error:       mutation.error,
    reset:       mutation.reset,
  };
}
