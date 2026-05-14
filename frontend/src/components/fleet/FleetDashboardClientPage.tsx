'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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

type VehicleListItem = {
  id: number;
  targa: string;
  marca: string;
  modello: string;
  tipo: string;
  stato?: string | null;
  km_attuali: number;
  scadenza_assicurazione?: string | null;
  scadenza_revisione?: string | null;
  localizzazione_corrente?: string | null;
  current_assignee?: string | null;
  open_incidents: number;
};

type VehicleListResponse = {
  items: VehicleListItem[];
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
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get<FleetSummary>('/fleet/summary'),
      api.get<VehicleListResponse>('/fleet/vehicles?page=1&page_size=200'),
    ])
      .then(([summaryPayload, vehiclePayload]) => {
        if (!alive) return;
        setSummary(summaryPayload);
        setVehicles(vehiclePayload.items || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Impossibile caricare il riepilogo mezzi.');
      });
    return () => {
      alive = false;
    };
  }, []);

  const today = new Date();
  const next30Days = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 30);
    return value;
  }, []);

  const insuranceAttention = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        if (!vehicle.scadenza_assicurazione) return true;
        const expiry = new Date(vehicle.scadenza_assicurazione);
        return expiry <= next30Days;
      }),
    [vehicles, next30Days],
  );

  const revisionAttention = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        if (!vehicle.scadenza_revisione) return true;
        const expiry = new Date(vehicle.scadenza_revisione);
        return expiry <= next30Days;
      }),
    [vehicles, next30Days],
  );

  const assignedVehicles = useMemo(() => vehicles.filter((vehicle) => Boolean(vehicle.current_assignee)), [vehicles]);
  const availableVehicles = useMemo(() => vehicles.filter((vehicle) => !vehicle.current_assignee), [vehicles]);

  const attentionBadge = (value?: string | null) => {
    if (!value) return 'Da inserire';
    const dateValue = new Date(value);
    if (dateValue < today) return 'Scaduta';
    return `Scade ${formatDate(value)}`;
  };

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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Assicurazioni in scadenza o mancanti</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  Da qui apri direttamente il fascicolo del mezzo nella sezione coperture.
                </p>
              </div>
              <Link href="/fleet/anagrafica" className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
                Vai all'anagrafica
              </Link>
            </div>

            <div className="space-y-3">
              {insuranceAttention.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun mezzo con assicurazione in scadenza.</p>}
              {insuranceAttention.slice(0, 8).map((vehicle) => (
                <div key={`insurance-${vehicle.id}`} className="flex items-center justify-between gap-3 rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <div>
                    <p className="text-sm font-semibold">{vehicle.targa} · {vehicle.marca} {vehicle.modello}</p>
                    <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>{attentionBadge(vehicle.scadenza_assicurazione)}</p>
                  </div>
                  <Link href={`/fleet/dettaglio?id=${vehicle.id}&tab=revisioni`} className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
                    Aggiorna copertura
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Revisioni in scadenza o mancanti</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  Qui trovi subito i mezzi senza revisione o con revisione da aggiornare.
                </p>
              </div>
              <Link href="/fleet/anagrafica" className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
                Vai all'anagrafica
              </Link>
            </div>

            <div className="space-y-3">
              {revisionAttention.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun mezzo con revisione in scadenza.</p>}
              {revisionAttention.slice(0, 8).map((vehicle) => (
                <div key={`revision-${vehicle.id}`} className="flex items-center justify-between gap-3 rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <div>
                    <p className="text-sm font-semibold">{vehicle.targa} · {vehicle.marca} {vehicle.modello}</p>
                    <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>{attentionBadge(vehicle.scadenza_revisione)}</p>
                  </div>
                  <Link href={`/fleet/dettaglio?id=${vehicle.id}&tab=revisioni`} className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
                    Aggiorna revisione
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card padding="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Mezzi da assegnare</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Apri il fascicolo direttamente sulla tab assegnazioni.
              </p>
            </div>
            <div className="space-y-3">
              {availableVehicles.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Tutti i mezzi risultano gia assegnati o non disponibili.</p>}
              {availableVehicles.slice(0, 8).map((vehicle) => (
                <div key={`assign-${vehicle.id}`} className="flex items-center justify-between gap-3 rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <div>
                    <p className="text-sm font-semibold">{vehicle.targa} · {vehicle.marca} {vehicle.modello}</p>
                    <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>{vehicle.stato || 'Stato non definito'}</p>
                  </div>
                  <Link href={`/fleet/dettaglio?id=${vehicle.id}&tab=assegnazioni`} className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
                    Assegna mezzo
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Mezzi da restituire o chiudere</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Accedi subito alla restituzione del mezzo o alla chiusura dell'assegnazione attiva.
              </p>
            </div>
            <div className="space-y-3">
              {assignedVehicles.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun mezzo assegnato al momento.</p>}
              {assignedVehicles.slice(0, 8).map((vehicle) => (
                <div key={`return-${vehicle.id}`} className="flex items-center justify-between gap-3 rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <div>
                    <p className="text-sm font-semibold">{vehicle.targa} · {vehicle.marca} {vehicle.modello}</p>
                    <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>In carico a {vehicle.current_assignee}</p>
                  </div>
                  <Link href={`/fleet/dettaglio?id=${vehicle.id}&tab=assegnazioni`} className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
                    Restituisci mezzo
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>
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

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('it-IT');
}
