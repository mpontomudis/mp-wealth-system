// src/features/trading/hooks/useEquityChart.ts
import { useQuery } from '@tanstack/react-query';

export type EquityChartPoint = {
  time: string;
  equity: number;
  balance: number;
};

export function useEquityChart(accountId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['equity-chart', accountId],
    queryFn: async () => {
      const response = await getEquityHistory(accountId, 100);
      if (response.error) throw response.error;

      return (response.data ?? []).map(
        (point): EquityChartPoint => ({
          time: point.snapshot_time,
          equity: point.equity,
          balance: point.balance,
        })
      );
    },
    enabled: Boolean(accountId),
    staleTime: 60_000,
  });

  return {
    chartData: data as EquityChartPoint[] | undefined,
    isLoading,
    error,
  };
}
