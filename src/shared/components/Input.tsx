// src/shared/components/Input.tsx
import React from 'react';
import { cn } from '@/shared/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-mp-text-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-mp-text-muted pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border text-sm text-mp-text-primary',
              'placeholder:text-mp-text-muted transition-all duration-200',
              'focus:outline-none focus:ring-2',
              // light
              'bg-white border-slate-300',
              // dark
              'dark:bg-mp-surface/50 dark:backdrop-blur-sm dark:border-mp-border',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              'py-2.5',
              error
                ? 'border-red-400 focus:ring-red-400/25 focus:border-red-400 dark:border-mp-red/60 dark:focus:ring-mp-red/25 dark:focus:border-mp-red'
                : 'focus:ring-[#4A90E2]/25 focus:border-[#4A90E2] dark:focus:ring-[#4A90E2]/25 dark:focus:border-[#4A90E2]/70',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-mp-text-muted pointer-events-none">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-mp-red">{error}</p>}
        {!error && hint && <p className="text-xs text-mp-text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
