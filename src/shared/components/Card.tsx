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
        'relative overflow-hidden rounded-2xl border border-white/10',
        'bg-white/5 backdrop-blur-xl',
        'shadow-[0_0_40px_rgba(0,0,0,0.3)]',
        'transition-all duration-300',
        'hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_0_60px_rgba(0,0,0,0.4)]',
        'p-6',
        className,
      )}
    >
      {/* Glow overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"
      />
      {/* Top highlight line */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="relative">
        {(title || actions) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
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
