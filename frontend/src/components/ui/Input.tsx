'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({
  label,
  error,
  helpText,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--cv-neutral-800)]"
        >
          {label}
          {props.required && <span className="text-[var(--cv-danger)] ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full min-h-10 rounded-[var(--cv-radius-md)] border px-3 py-2 transition-all duration-200
          bg-white/95 font-normal text-[var(--cv-neutral-900)] shadow-[inset_0_1px_1px_rgba(24,33,30,0.02)]
          placeholder:text-[var(--cv-neutral-500)]
          ${error
            ? 'border-[var(--cv-danger)] focus:ring-[var(--cv-danger)]'
            : 'border-[var(--cv-border-subtle)] focus:border-[var(--cv-primary)] focus:ring-[var(--cv-primary)]'
          }
          focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-[var(--cv-neutral-200)] disabled:text-[var(--cv-neutral-500)] disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-[var(--cv-danger)] flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-sm text-[var(--cv-neutral-600)]">{helpText}</p>
      )}
    </div>
  );
}
