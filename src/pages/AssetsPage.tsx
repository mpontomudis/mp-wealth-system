// src/pages/AssetsPage.tsx
import { AssetList } from '@/features/wealth/components/AssetList';

export default function AssetsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Assets</h1>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="relative">
          <AssetList />
        </div>
      </div>
    </div>
  );
}
