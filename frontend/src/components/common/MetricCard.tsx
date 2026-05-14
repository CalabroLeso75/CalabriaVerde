import React from 'react';

import { Card } from '@/components/ui/Card';

type MetricCardProps = {
  label: string;
  value: number | string;
  accent?: string;
};

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <Card padding="sm">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold" style={{ color: accent || 'var(--cv-primary)' }}>
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </p>
    </Card>
  );
}
