// src/shared/components/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type StatCardAccent = 'blue' | 'teal' | 'coral' | 'yellow' | 'green' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
  accent?: StatCardAccent;
}

const ACCENT_ICON: Record<StatCardAccent, string> = {
  blue:   'bg-[#4A90E2]/15 text-[#4A90E2]  dark:bg-[#4A90E2]/20',
  teal:   'bg-[#4ECDC4]/15 text-[#4ECDC4]  dark:bg-[#4ECDC4]/20',
  coral:  'bg-[#FF8B94]/15 text-[#FF8B94]  dark:bg-[#FF8B94]/20',
  yellow: 'bg-[#FFD166]/20 text-[#d49a00]  dark:bg-[#FFD166]/20 dark:text-[#FFD166]',
  green:  'bg-[#10b981]/15 text-[#10b981]  dark:bg-[#10b981]/20',
  purple: 'bg-[#A78BFA]/15 text-[#A78BFA]  dark:bg-[#A78BFA]/20',
};

const ACCENT_BG: Record<StatCardAccent, string> = {
  blue:   'border-l-4 border-l-[#4A90E2]',
  teal:   'border-l-4 border-l-[#4ECDC4]',
  coral:  'border-l-4 border-l-[#FF8B94]',
  yellow: 'border-l-4 border-l-[#FFD166]',
  green:  'border-l-4 border-l-[#10b981]',
  purple: 'border-l-4 border-l-[#A78BFA]',
};

export function StatCard({ title, value, subtitle, icon, trend, className, accent }: StatCardProps) {
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
        'dark:hover:scale-[1.01] dark:hover:border-white/20',
        accent ? ACCENT_BG[accent] : '',
        className,
      )}
    >
      {/* Glow gradient — dark only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl opacity-0 dark:opacity-100"
      />

      <div className="relative flex items-start gap-4 flex-1">
        {icon && (
          <div className={cn(
            'flex items-center justify-center w-12 h-12 rounded-2xl shrink-0',
            accent ? ACCENT_ICON[accent] : 'bg-slate-100 text-mp-primary dark:bg-white/10 dark:text-mp-primary-light',
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate leading-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
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
                <span>{isPositive ? '+' : ''}{trend.toFixed(2)}%</span>
              </div>
            ) : (
              <div className="h-[22px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
