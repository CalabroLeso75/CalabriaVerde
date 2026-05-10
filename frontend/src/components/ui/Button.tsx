'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-[var(--cv-primary)] hover:bg-[var(--cv-primary-dark)] text-white shadow-sm',
  secondary: 'bg-[var(--cv-neutral-700)] hover:bg-[var(--cv-neutral-800)] text-white shadow-sm',
  outline: 'border-2 border-[var(--cv-primary)] text-[var(--cv-primary)] hover:bg-[var(--cv-primary-lighter)]',
  danger: 'bg-[var(--cv-danger)] hover:bg-red-700 text-white shadow-sm',
  ghost: 'text-[var(--cv-neutral-700)] hover:bg-[var(--cv-neutral-200)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
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
        font-semibold transition-all duration-200
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
