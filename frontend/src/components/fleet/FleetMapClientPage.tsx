'use client';

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

export default function FleetMapClientPage() {
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<FleetSummary>('/fleet/summary')
      .then((payload) => {
        setSummary(payload);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Impossibile caricare il riepilogo mappa.'));
  }, []);

  return (
    <div className="space-y-6">
      <SectionLead
        description="La mappa mezzi e pronta per ospitare la geolocalizzazione in tempo reale."
        detail="Le API di tracking verranno agganciate successivamente senza cambiare il perimetro del modulo."
      />

      {error && (
        <NoticeBanner title="Errore caricamento" message={error} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Mezzi censiti" value={summary?.total_vehicles ?? '...'} />
        <MetricCard label="Tracker attivi" value={summary?.tracked_vehicles ?? '...'} accent="var(--cv-info)" />
        <MetricCard label="Assegnazioni attive" value={summary?.active_assignments ?? '...'} accent="var(--cv-primary-dark)" />
      </div>

      <Card padding="lg">
        <div
          className="flex min-h-[420px] items-center justify-center rounded-[var(--cv-radius-md)] border border-dashed"
          style={{ borderColor: 'var(--cv-border-subtle)', background: 'var(--cv-neutral-50)' }}
        >
          <div className="max-w-xl text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
              Area mappa pronta per l&apos;integrazione
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Qui confluiranno la posizione del mezzo, il timestamp dell&apos;ultimo segnale, lo stato operativo
              e i filtri per distretto, tipologia e disponibilita.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
