'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
}

interface ConfirmModalProps extends ConfirmModalConfig {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Focus confirm button when modal opens
      setTimeout(() => confirmButtonRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      confirmBg: 'bg-amber-500 hover:bg-amber-400',
      confirmText: 'text-slate-900',
    },
    danger: {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      confirmBg: 'bg-red-500 hover:bg-red-400',
      confirmText: 'text-white',
    },
    info: {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      confirmBg: 'bg-blue-500 hover:bg-blue-400',
      confirmText: 'text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Content */}
        <div className="p-6">
          <div className="flex gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center ${style.iconColor}`}>
              {style.icon}
            </div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 
                id="confirm-modal-title"
                className="text-lg font-semibold text-slate-100 mb-2"
              >
                {title}
              </h3>
              <p className="text-sm text-slate-400 whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-800/50 border-t border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg ${style.confirmBg} ${style.confirmText} font-medium transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing confirm modal state
export function useConfirmModal() {
  const [config, setConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: Omit<ConfirmModalConfig, 'isOpen'>): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfig({
        ...options,
        isOpen: true,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    config,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

import { useState } from 'react';

