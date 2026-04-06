// src/shared/components/CustomSelect.tsx
import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface CustomSelectOption {
  value: string;
  label: string;
  prefix?: string; // emoji or short text shown before label
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '— Select —',
  label,
  error,
  disabled,
  onAddNew,
  addNewLabel = 'Add new…',
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label htmlFor={uid} className="block text-xs font-medium text-mp-text-secondary mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        id={uid}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200',
          'border text-left focus:outline-none focus:ring-1 focus:ring-mp-primary/60',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // light
          'bg-white text-slate-900 border-slate-300 hover:border-slate-400',
          // dark
          'dark:bg-white/[0.04] dark:text-mp-text-primary',
          error
            ? 'border-red-400 dark:border-mp-red/50 focus:border-red-500 dark:focus:border-mp-red'
            : open
            ? 'border-blue-400 dark:border-mp-primary/60 dark:bg-white/[0.06]'
            : 'dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.06]',
        )}
      >
        <span className={cn('flex items-center gap-2 truncate', !selected && 'text-mp-text-muted')}>
          {selected?.prefix && <span className="text-base leading-none shrink-0">{selected.prefix}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-mp-text-muted transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 rounded-xl border overflow-hidden animate-fade-in bg-white border-slate-200 shadow-lg dark:bg-mp-surface dark:border-mp-border dark:shadow-card"
          style={{ maxHeight: '220px', overflowY: 'auto' }}
        >
          {options.length === 0 && !onAddNew && (
            <div className="px-4 py-3 text-sm text-mp-text-muted text-center">No options</div>
          )}

          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors',
                opt.value === value
                  ? 'bg-blue-50 text-blue-900 dark:bg-mp-primary/15 dark:text-white'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-mp-text-secondary dark:hover:bg-white/[0.06] dark:hover:text-white',
              )}
            >
              {opt.prefix && <span className="text-base leading-none w-5 text-center shrink-0">{opt.prefix}</span>}
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.value === value && <Check size={13} className="shrink-0 text-mp-primary" />}
            </button>
          ))}

          {/* Add new */}
          {onAddNew && (
            <button
              type="button"
              onClick={() => { onAddNew(); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-mp-primary hover:bg-mp-primary/10 transition-colors border-t border-mp-border"
            >
              <Plus size={14} className="shrink-0" />
              <span>{addNewLabel}</span>
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-mp-red">{error}</p>}
    </div>
  );
}
