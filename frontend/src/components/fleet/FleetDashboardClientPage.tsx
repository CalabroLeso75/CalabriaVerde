'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MetricCard } from '@/components/common/MetricCard';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { SectionLead } from '@/components/common/SectionLead';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

type FleetSummary = {
  total_vehicles: number;
  operational_vehicles: number;
  insurance_expiring_30d: number;
  revision_expiring_30d: number;
  active_assignments: number;
  open_incidents: number;
  tracked_vehicles: number;
};

const sections = [
  {
    title: 'Anagrafica mezzi',
    description: 'Archivio completo dei mezzi con dati tecnici, stato, coperture e storico operativo.',
    href: '/fleet/anagrafica',
    accent: 'var(--cv-primary)',
  },
  {
    title: 'Mappa mezzi',
    description: 'Vista pronta per la localizzazione dei mezzi con API di tracking da attivare successivamente.',
    href: '/fleet/mappa',
    accent: 'var(--cv-info)',
  },
  {
    title: 'Assegnazioni e documenti',
    description: 'Utilizzatori, verbali di assegnazione e restituzione, documentazione di bordo e scadenze.',
    href: '/fleet/anagrafica',
    accent: 'var(--cv-accent)',
  },
  {
    title: 'Sinistri e revisioni',
    description: 'Storico revisioni, coperture assicurative, verifiche di sicurezza e gestione sinistri.',
    href: '/fleet/anagrafica',
    accent: 'var(--cv-danger)',
  },
];

export default function FleetDashboardClientPage() {
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.get<FleetSummary>('/fleet/summary')
      .then((payload) => {
        if (alive) setSummary(payload);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Impossibile caricare il riepilogo mezzi.');
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <SectionLead
        description="Modulo multi-sezione per gestire l'intero ciclo di vita del mezzo."
        detail="Anagrafica, coperture, revisioni, assegnazioni, sinistri e futura localizzazione in mappa."
      />

      {error && (
        <NoticeBanner
          title="Errore caricamento"
          message={error}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mezzi censiti" value={summary?.total_vehicles ?? '...'} />
        <MetricCard label="Operativi" value={summary?.operational_vehicles ?? '...'} accent="var(--cv-primary-dark)" />
        <MetricCard label="Assicurazioni in scadenza" value={summary?.insurance_expiring_30d ?? '...'} accent="var(--cv-danger)" />
        <MetricCard label="Revisioni in scadenza" value={summary?.revision_expiring_30d ?? '...'} accent="var(--cv-warning)" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Assegnazioni attive" value={summary?.active_assignments ?? '...'} />
        <MetricCard label="Sinistri aperti" value={summary?.open_incidents ?? '...'} accent="var(--cv-danger)" />
        <MetricCard label="Tracker attivi" value={summary?.tracked_vehicles ?? '...'} accent="var(--cv-info)" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href + section.title} href={section.href} className="block">
            <Card padding="md" className="h-full transition-transform hover:-translate-y-0.5">
              <div className="space-y-3">
                <div className="h-1 w-10 rounded-full" style={{ background: section.accent }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  {section.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  {section.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
