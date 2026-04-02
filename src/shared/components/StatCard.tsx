// src/shared/components/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className={cn('bg-mp-surface rounded-xl shadow-md p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-mp-text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-mp-text-primary truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-mp-text-muted mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div
              className={cn(
                'inline-flex items-center gap-1 mt-2 text-xs font-medium',
                isPositive ? 'text-mp-green' : 'text-mp-red',
              )}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                {isPositive ? '+' : ''}
                {trend.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-mp-primary/10 text-mp-primary shrink-0 ml-4">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
