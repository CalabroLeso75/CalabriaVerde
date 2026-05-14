'use client';

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  helpText,
  options,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-semibold"
          style={{ color: 'var(--cv-neutral-800)' }}
        >
          {label}
          {props.required && (
            <span style={{ color: 'var(--cv-danger)' }} className="ml-0.5">*</span>
          )}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-10 appearance-none rounded-[var(--cv-radius-md)] border bg-white/95 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${className}`}
        style={{
          borderColor: error ? 'var(--cv-danger)' : 'var(--cv-border-subtle)',
          color: 'var(--cv-neutral-900)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23748A9D' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '16px',
          paddingRight: '36px',
          boxShadow: 'inset 0 1px 1px rgba(24,33,30,0.02)',
        }}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm flex items-center gap-1" style={{ color: 'var(--cv-danger)' }} role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{helpText}</p>
      )}
    </div>
  );
}
