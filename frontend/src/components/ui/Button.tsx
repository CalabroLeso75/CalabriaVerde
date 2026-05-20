'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'border border-[var(--cv-primary)] bg-[var(--cv-primary)] text-white shadow-[var(--cv-shadow-sm)] hover:bg-[var(--cv-primary-dark)] hover:border-[var(--cv-primary-dark)]',
  secondary: 'border border-[var(--cv-neutral-700)] bg-[var(--cv-neutral-700)] text-white shadow-[var(--cv-shadow-sm)] hover:bg-[var(--cv-neutral-800)] hover:border-[var(--cv-neutral-800)]',
  outline: 'border border-[var(--cv-border-strong)] bg-white text-[var(--cv-primary-darker)] hover:border-[var(--cv-primary-light)] hover:bg-[var(--cv-primary-lighter)]',
  danger: 'border border-[var(--cv-danger)] bg-[var(--cv-danger)] text-white shadow-[var(--cv-shadow-sm)] hover:brightness-95',
  ghost: 'border border-transparent text-[var(--cv-neutral-700)] hover:bg-[var(--cv-neutral-200)] hover:text-[var(--cv-neutral-900)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm rounded-[var(--cv-radius-sm)]',
  md: 'min-h-10 px-4 py-2 text-sm rounded-[var(--cv-radius-md)]',
  lg: 'min-h-11 px-5 py-2.5 text-base rounded-[var(--cv-radius-md)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        whitespace-nowrap font-semibold tracking-normal
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cv-primary)] focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
