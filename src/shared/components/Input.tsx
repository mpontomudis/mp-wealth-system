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
      <div className="flex flex-col gap-1">
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
              'w-full rounded-lg border bg-mp-surface text-mp-text-primary text-sm placeholder:text-mp-text-muted transition-colors focus:outline-none focus:ring-2',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              'py-2',
              error
                ? 'border-mp-red focus:ring-mp-red/30 focus:border-mp-red'
                : 'border-mp-border focus:ring-mp-primary/30 focus:border-mp-primary',
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
