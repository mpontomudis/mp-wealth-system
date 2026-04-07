// src/shared/components/Card.tsx
import React from 'react';
import { cn } from '@/shared/utils/cn';

type CardGradient = 'visa' | 'mastercard' | 'teal' | 'green' | 'blue' | 'purple';

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  gradient?: CardGradient;
}

const GRADIENT_CLASSES: Record<CardGradient, string> = {
  visa:       'card-gradient-visa border-transparent shadow-lg shadow-purple-300/30',
  mastercard: 'card-gradient-mastercard border-transparent shadow-lg shadow-pink-300/30',
  teal:       'card-gradient-teal border-transparent shadow-lg shadow-teal-300/30',
  green:      'card-gradient-green border-transparent shadow-lg shadow-green-300/30',
  blue:       'card-gradient-blue border-transparent shadow-lg shadow-blue-300/30',
  purple:     'card-gradient-purple border-transparent shadow-lg shadow-purple-300/30',
};

export function Card({ title, subtitle, className, children, actions, gradient }: CardProps) {
  const isGradient = Boolean(gradient);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-300 p-6',
        isGradient
          ? [GRADIENT_CLASSES[gradient!], 'hover:scale-[1.01]']
          : [
              // light
              'bg-white border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]',
              'hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-slate-300',
              // dark — solid opaque surface so chart/table backgrounds are clearly dark
              'dark:bg-mp-surface dark:border-white/10',
              'dark:shadow-[0_1px_6px_rgba(0,0,0,0.4),0_4px_24px_rgba(0,0,0,0.3)]',
              'dark:hover:scale-[1.01] dark:hover:border-white/20 dark:hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]',
            ],
        className,
      )}
    >
      {/* Subtle pattern overlay for gradient cards */}
      {isGradient && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />
      )}

      {/* Glow overlay — dark non-gradient only */}
      {!isGradient && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/5 dark:to-purple-500/5 opacity-0 dark:opacity-100"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-white/10"
          />
        </>
      )}

      <div className="relative">
        {(title || actions) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <h3 className={cn(
                  'text-base font-semibold',
                  isGradient ? 'text-white' : 'text-slate-900 dark:text-white',
                )}>{title}</h3>
              )}
              {subtitle && (
                <p className={cn(
                  'text-sm mt-0.5',
                  isGradient ? 'text-white/75' : 'text-slate-500 dark:text-gray-400',
                )}>{subtitle}</p>
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
