// src/pages/WealthPage.tsx
import { WealthDashboard } from '@/features/wealth/components/WealthDashboard';

export default function WealthPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-mp-text-primary mb-6">Wealth</h1>
      <WealthDashboard />
    </div>
  );
}
