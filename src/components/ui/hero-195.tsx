// src/components/ui/hero-195.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Hero195Props {
  badge?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Hero195({
  badge = 'MP Wealth System',
  title = 'Your Financial Command Center',
  subtitle = 'Track portfolios, manage wealth, and monitor trading — all in one place.',
  className,
  children,
}: Hero195Props) {
  return (
    <div className={cn('relative flex flex-col items-center justify-center text-center px-4 py-20', className)}>
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-violet-500/08 blur-[100px]" />
      </div>

      {/* Badge */}
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-slow" />
          {badge}
        </motion.div>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 mb-4 max-w-3xl text-4xl font-bold tracking-tight text-mp-text-primary sm:text-5xl md:text-6xl"
      >
        {title.split(' ').map((word, i) => (
          <span
            key={i}
            className={
              i >= title.split(' ').length - 2
                ? 'bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent'
                : ''
            }
          >
            {word}{' '}
          </span>
        ))}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mb-8 max-w-xl text-base text-mp-text-muted sm:text-lg"
      >
        {subtitle}
      </motion.p>

      {/* CTA slot */}
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
