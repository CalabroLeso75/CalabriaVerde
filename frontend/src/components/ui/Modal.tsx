'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  // Chiudi con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          className={`relative flex w-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden ${sizeClasses[size]} rounded-xl bg-white shadow-2xl animate-fade-in`}
          style={{ borderTop: '4px solid var(--cv-primary)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              <h2
                id="modal-title"
                className="text-xl font-bold"
                style={{ color: 'var(--cv-neutral-900)' }}
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-600)' }}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0 ml-4"
              style={{ color: 'var(--cv-neutral-500)' }}
              aria-label="Chiudi"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 rounded-b-xl"
              style={{
                borderTop: '1px solid var(--cv-neutral-200)',
                background: 'var(--cv-neutral-100)',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
