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
            'w-full rounded-xl border text-sm px-3 py-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 appearance-none cursor-pointer',
            // light
            'bg-white text-slate-900 border-slate-300 focus:ring-[#4A90E2]/25 focus:border-[#4A90E2]',
            // dark
            'dark:bg-[#0f172a] dark:text-white dark:border-white/10 dark:focus:ring-[#4A90E2]/25 dark:focus:border-[#4A90E2]/70',
            error
              ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500 dark:border-mp-red/60 dark:focus:ring-mp-red/30 dark:focus:border-mp-red'
              : '',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-white text-slate-400 dark:bg-[#0f172a] dark:text-gray-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-slate-900 dark:bg-[#0f172a] dark:text-white">
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
