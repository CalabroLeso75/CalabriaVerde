import React from 'react';

type NoticeBannerProps = {
  title: string;
  message: string;
  tone?: 'error' | 'success' | 'info';
};

const TONE_STYLES = {
  error: {
    background: '#CC334408',
    borderColor: '#CC334440',
    color: 'var(--cv-danger)',
  },
  success: {
    background: 'var(--cv-primary-lighter)',
    borderColor: 'var(--cv-primary-light)',
    color: 'var(--cv-primary-dark)',
  },
  info: {
    background: 'var(--cv-neutral-50)',
    borderColor: 'var(--cv-neutral-200)',
    color: 'var(--cv-neutral-700)',
  },
} as const;

export function NoticeBanner({ title, message, tone = 'error' }: NoticeBannerProps) {
  const style = TONE_STYLES[tone];

  return (
    <div className="rounded-lg border px-4 py-3" style={style} role="alert">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs">{message}</p>
    </div>
  );
}
