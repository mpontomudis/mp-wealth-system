// src/shared/components/CurrencyDisplay.tsx
import { cn } from '@/shared/utils/cn';

type CurrencySize = 'sm' | 'md' | 'lg';

interface CurrencyDisplayProps {
  usd?: number;
  idr?: number;
  size?: CurrencySize;
  showBoth?: boolean;
  exchangeRate?: number;
  className?: string;
}

const usdSizeClasses: Record<CurrencySize, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
};

const idrSizeClasses: Record<CurrencySize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

function formatUSD(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatIDR(value: number): string {
  return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CurrencyDisplay({
  usd,
  idr,
  size = 'md',
  showBoth = true,
  exchangeRate = 15750,
  className,
}: CurrencyDisplayProps) {
  const usdValue = usd ?? (idr !== undefined ? idr / exchangeRate : undefined);
  const idrValue = idr ?? (usd !== undefined ? usd * exchangeRate : undefined);

  return (
    <div className={cn('flex flex-col', className)}>
      {usdValue !== undefined && (
        <span className={cn('text-mp-blue', usdSizeClasses[size])}>
          {formatUSD(usdValue)}
        </span>
      )}
      {showBoth && idrValue !== undefined && (
        <span className={cn('text-mp-text-muted', idrSizeClasses[size])}>
          {formatIDR(idrValue)}
        </span>
      )}
    </div>
  );
}
