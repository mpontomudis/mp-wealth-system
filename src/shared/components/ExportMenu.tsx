// src/shared/components/ExportMenu.tsx
import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
  className?: string;
}

export function ExportMenu({ onExportCSV, onExportPDF, disabled, className }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-mp-text-secondary hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={13} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 z-50 rounded-xl bg-mp-surface border border-mp-border shadow-card overflow-hidden animate-fade-in">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-mp-text-secondary hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Table size={14} className="text-mp-green" />
            Export CSV
          </button>
          <button
            onClick={() => { onExportPDF(); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-mp-text-secondary hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <FileText size={14} className="text-mp-red" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
