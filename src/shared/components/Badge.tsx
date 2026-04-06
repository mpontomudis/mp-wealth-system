// src/shared/components/Badge.tsx
import React from 'react';
import { cn } from '@/shared/utils/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border border-green-200 dark:bg-mp-green/10 dark:text-mp-green dark:border-mp-green/20',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-mp-gold/10 dark:text-mp-gold dark:border-mp-gold/20',
  danger:  'bg-red-50 text-red-700 border border-red-200 dark:bg-mp-red/10 dark:text-mp-red dark:border-mp-red/20',
  info:    'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-mp-blue/10 dark:text-mp-blue dark:border-mp-blue/20',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-mp-background dark:text-mp-text-muted dark:border-transparent',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
