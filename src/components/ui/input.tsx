// src/components/ui/input.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-mp-border bg-mp-surface/50 px-3 py-1 text-sm text-mp-text-primary shadow-sm transition-colors',
          'placeholder:text-mp-text-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mp-primary/40 focus-visible:border-mp-primary/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'backdrop-blur-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
