// src/shared/components/Card.tsx
import React from 'react';
import { cn } from '@/shared/utils/cn';

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({ title, subtitle, className, children, actions }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-300 p-6',
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
      {/* Glow overlay — dark only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/5 dark:to-purple-500/5 opacity-0 dark:opacity-100"
      />
      {/* Top highlight line */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-white/10"
      />

      <div className="relative">
        {(title || actions) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
