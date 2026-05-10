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
        bg-white rounded-lg border border-[var(--cv-neutral-300)]
        shadow-sm
        ${hover ? 'hover:shadow-md hover:border-[var(--cv-primary-light)] transition-all duration-200 cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
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
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--cv-neutral-900)]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--cv-neutral-600)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
