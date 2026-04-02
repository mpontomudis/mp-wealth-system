// src/pages/AssetsPage.tsx
import { AssetList } from '@/features/wealth/components/AssetList';

export default function AssetsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-mp-text-primary mb-6">Assets</h1>
      <div className="bg-mp-surface rounded-xl shadow-md p-6">
        <AssetList />
      </div>
    </div>
  );
}
