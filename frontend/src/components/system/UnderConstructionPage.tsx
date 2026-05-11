'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type UnderConstructionPageProps = {
  title: string;
  description: string;
  fallbackHref?: string;
  fallbackLabel?: string;
};

export function UnderConstructionPage({
  title,
  description,
  fallbackHref = '/dashboard',
  fallbackLabel = 'Vai alla dashboard',
}: UnderConstructionPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--cv-warning-light, #F5E7A1)', color: 'var(--cv-warning, #9A6B00)' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-2.5L13.73 4c-.77-.83-1.96-.83-2.73 0L3.2 16.5c-.77.83.19 2.5 1.73 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
                {title}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-600)' }}>
                Modulo in preparazione
              </p>
            </div>
          </div>

          <p className="text-sm leading-6" style={{ color: 'var(--cv-neutral-700)' }}>
            {description}
          </p>

          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              background: 'var(--cv-neutral-100)',
              borderColor: 'var(--cv-neutral-300)',
              color: 'var(--cv-neutral-700)',
            }}
          >
            Questa sezione non è ancora operativa nell&apos;ambiente di collaudo.
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" onClick={() => router.back()}>
              Torna alla pagina precedente
            </Button>
            <Link href={fallbackHref} className="sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                {fallbackLabel}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
