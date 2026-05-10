import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#00804018', text: '#008040' },
  warning: { bg: '#CC840018', text: '#CC8400' },
  danger:  { bg: '#CC334418', text: '#CC3344' },
  info:    { bg: '#5B8FCC18', text: '#5B8FCC' },
  neutral: { bg: '#74809018', text: '#5D7083' },
  primary: { bg: '#33996618', text: '#22734D' },
};

export function Badge({ variant = 'neutral', children, size = 'md', dot = false }: BadgeProps) {
  const { bg, text } = variantMap[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      style={{ background: bg, color: text }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: text }}
        />
      )}
      {children}
    </span>
  );
}
