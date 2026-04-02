// src/pages/TradingPage.tsx
import { TradingDashboard } from '@/features/trading/components/TradingDashboard';
import { useAuth } from '@/shared/hooks/useAuth';

export default function TradingPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-mp-text-primary mb-6">Trading</h1>
      <TradingDashboard userId={user?.id ?? ''} />
    </div>
  );
}
