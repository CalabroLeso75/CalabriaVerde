'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
}: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--cv-radius-md)] border
        bg-[var(--cv-surface-2)] backdrop-blur-sm
        shadow-[var(--cv-shadow-sm)]
        ${hover ? 'hover:-translate-y-[1px] hover:shadow-[var(--cv-shadow-md)] hover:border-[color:var(--cv-border-strong)] transition-all duration-200 cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
      style={{
        borderColor: 'var(--cv-border-subtle)',
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-[var(--cv-neutral-900)]">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--cv-neutral-600)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
