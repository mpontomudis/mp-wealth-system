// src/shared/components/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2
        size={sizeMap[size]}
        className="animate-spin text-mp-primary"
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-screen">
      <Loader2 size={40} className="animate-spin text-mp-primary" />
    </div>
  );
}
