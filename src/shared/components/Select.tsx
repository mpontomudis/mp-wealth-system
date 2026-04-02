// src/shared/components/Select.tsx
import React from 'react';
import { cn } from '@/shared/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-mp-text-primary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-lg border bg-mp-surface text-mp-text-primary text-sm px-3 py-2 transition-colors focus:outline-none focus:ring-2 appearance-none',
            error
              ? 'border-mp-red focus:ring-mp-red/30 focus:border-mp-red'
              : 'border-mp-border focus:ring-mp-primary/30 focus:border-mp-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-mp-red">{error}</p>}
        {!error && hint && <p className="text-xs text-mp-text-muted">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
