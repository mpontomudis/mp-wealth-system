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
    <div className={cn('bg-mp-surface rounded-xl shadow-md p-6', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-mp-text-primary">{title}</h3>}
            {subtitle && <p className="text-sm text-mp-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
