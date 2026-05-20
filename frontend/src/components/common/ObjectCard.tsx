'use client';

import Link from 'next/link';
import React from 'react';

type ObjectTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

type ObjectCardProperty = {
  label: string;
  value: React.ReactNode;
  tone?: ObjectTone;
};

type ObjectCardRelation = {
  label: string;
  value: React.ReactNode;
  tone?: ObjectTone;
};

type ObjectCardAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'outline' | 'ghost';
};

type ObjectCardProps = {
  objectType: string;
  objectKey: string;
  title: string;
  subtitle?: string;
  href?: string;
  status?: string;
  statusTone?: ObjectTone;
  avatar?: React.ReactNode;
  properties?: ObjectCardProperty[];
  relations?: ObjectCardRelation[];
  actions?: ObjectCardAction[];
  visibilityLabel?: string;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLElement>;
};

const toneColors: Record<ObjectTone, string> = {
  neutral: 'var(--cv-neutral-600)',
  success: 'var(--cv-success)',
  warning: 'var(--cv-warning)',
  danger: 'var(--cv-danger)',
  info: 'var(--cv-info)',
  primary: 'var(--cv-primary-dark)',
};

function toneBackground(tone: ObjectTone) {
  return `${toneColors[tone]}18`;
}

function actionClass(variant: ObjectCardAction['variant'] = 'outline') {
  if (variant === 'primary') {
    return 'border-[var(--cv-primary)] bg-[var(--cv-primary)] text-white shadow-[var(--cv-shadow-sm)] hover:bg-[var(--cv-primary-dark)]';
  }
  if (variant === 'ghost') {
    return 'border-transparent text-[var(--cv-primary-dark)] hover:bg-[var(--cv-primary-lighter)]';
  }
  return 'border-[var(--cv-border-strong)] text-[var(--cv-primary-dark)] hover:bg-[var(--cv-primary-lighter)]';
}

function ActionButton({ action }: { action: ObjectCardAction }) {
  const className = `inline-flex min-h-9 items-center justify-center rounded-[var(--cv-radius-sm)] border px-3 py-1.5 text-sm font-semibold transition-colors ${actionClass(action.variant)}`;
  if (action.href) {
    return <Link href={action.href} className={className}>{action.label}</Link>;
  }
  return (
    <button type="button" className={className} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

function CardBody({
  objectType,
  objectKey,
  title,
  subtitle,
  status,
  statusTone = 'neutral',
  avatar,
  properties = [],
  relations = [],
  actions = [],
  visibilityLabel,
}: Omit<ObjectCardProps, 'href' | 'draggable' | 'onDragStart'>) {
  return (
    <div className="group h-full rounded-[var(--cv-radius-lg)] border bg-[var(--cv-surface-2)] p-4 shadow-[var(--cv-shadow-sm)] transition-all duration-200 hover:border-[color:var(--cv-border-strong)] hover:shadow-[var(--cv-shadow-md)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {avatar ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--cv-radius-md)] bg-[var(--cv-primary-lighter)] text-sm font-bold text-[var(--cv-primary-dark)]">
              {avatar}
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
              {objectType} - {objectKey}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {status ? (
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: toneBackground(statusTone), color: toneColors[statusTone] }}
          >
            {status}
          </span>
        ) : null}
      </div>

      {properties.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {properties.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                {item.label}
              </p>
              <p className="mt-1 line-clamp-2 text-sm" style={{ color: item.tone ? toneColors[item.tone] : 'var(--cv-neutral-700)' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {relations.length ? (
        <div className="mt-4 rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
            Collegamenti
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {relations.map((item) => (
              <span
                key={item.label}
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: toneBackground(item.tone || 'neutral'), color: toneColors[item.tone || 'neutral'] }}
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
        <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
          {visibilityLabel || 'Visibile in base ai permessi utente'}
        </p>
        {actions.length ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {actions.map((action) => <ActionButton key={action.label} action={action} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ObjectCard({ href, draggable, onDragStart, ...props }: ObjectCardProps) {
  if (href) {
    return (
      <Link href={href} draggable={draggable} onDragStart={onDragStart as React.DragEventHandler<HTMLAnchorElement> | undefined} className="block h-full">
        <CardBody {...props} />
      </Link>
    );
  }

  return (
    <article draggable={draggable} onDragStart={onDragStart} className="h-full">
      <CardBody {...props} />
    </article>
  );
}
