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
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10',
        'bg-white/5 backdrop-blur-xl',
        'shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6',
        'transition-all duration-300',
        'hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_0_60px_rgba(0,0,0,0.4)]',
        'animate-fade-in',
        className,
      )}
    >
      {/* Glow gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"
      />
      {/* Top highlight line */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div
              className={cn(
                'inline-flex items-center gap-1 mt-2.5 text-xs font-medium px-2 py-0.5 rounded-full',
                isPositive
                  ? 'text-mp-green bg-mp-green/10 border border-mp-green/20'
                  : 'text-mp-red bg-mp-red/10 border border-mp-red/20',
              )}
            >
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {isPositive ? '+' : ''}
                {trend.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 text-mp-primary border border-white/10 shrink-0 ml-4 backdrop-blur-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
