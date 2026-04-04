// src/shared/components/Modal.tsx
import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog — bottom sheet on mobile, centered card on sm+ */}
      <div
        className={cn(
          'relative w-full z-10 overflow-hidden flex flex-col',
          'bg-white/5 backdrop-blur-2xl border border-white/10',
          'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[92dvh] sm:max-h-[90dvh]',
          sizeClasses[size],
        )}
      >
        {/* Top highlight */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
        />

        {/* Drag handle pill (mobile only) */}
        <div aria-hidden className="sm:hidden mx-auto mt-2.5 mb-0 w-10 h-1 rounded-full bg-white/20 shrink-0" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/10 shrink-0">
            <h2 id="modal-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 z-10"
            aria-label="Close modal"
          >
            <X size={17} />
          </button>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
