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
        'relative overflow-hidden rounded-2xl border transition-all duration-300',
        'p-5 animate-fade-in h-full flex flex-col',
        // light
        'bg-white border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]',
        'hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-slate-300',
        // dark
        'dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10',
        'dark:shadow-[0_0_40px_rgba(0,0,0,0.3)]',
        'dark:hover:scale-[1.01] dark:hover:border-white/20 dark:hover:shadow-[0_0_60px_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      {/* Glow gradient — dark only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl opacity-0 dark:opacity-100"
      />
      {/* Top highlight line */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-white/20"
      />

      <div className="relative flex items-start justify-between flex-1">
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {/* Push trend badge to bottom so all cards have same height */}
          <div className="mt-auto pt-3">
            {trend !== undefined ? (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
                  isPositive
                    ? 'text-green-700 bg-green-50 border-green-200 dark:text-mp-green dark:bg-mp-green/10 dark:border-mp-green/20'
                    : 'text-red-700 bg-red-50 border-red-200 dark:text-mp-red dark:bg-mp-red/10 dark:border-mp-red/20',
                )}
              >
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>
                  {isPositive ? '+' : ''}
                  {trend.toFixed(2)}%
                </span>
              </div>
            ) : (
              <div className="h-[22px]" />
            )}
          </div>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-11 h-11 rounded-xl text-mp-primary shrink-0 ml-4 border bg-slate-100 border-slate-200 dark:bg-white/10 dark:border-white/10 dark:backdrop-blur-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
