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
  success: 'bg-mp-green/10 text-mp-green',
  warning: 'bg-mp-gold/10 text-mp-gold',
  danger: 'bg-mp-red/10 text-mp-red',
  info: 'bg-mp-blue/10 text-mp-blue',
  neutral: 'bg-mp-background text-mp-text-muted',
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
