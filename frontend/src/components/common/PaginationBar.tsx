import React from 'react';

import { Button } from '@/components/ui/Button';

type PaginationBarProps = {
  label: string;
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
};

export function PaginationBar({ label, page, pages, onPrev, onNext }: PaginationBarProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderTop: '1px solid var(--cv-neutral-200)', background: 'var(--cv-neutral-50)' }}
    >
      <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
        {label}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={onPrev}>
          Prec
        </Button>
        <span className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
          Pag. {page} / {pages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={onNext}>
          Succ
        </Button>
      </div>
    </div>
  );
}
