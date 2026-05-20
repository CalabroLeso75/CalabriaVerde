'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { MetricCard } from '@/components/common/MetricCard';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { SectionLead } from '@/components/common/SectionLead';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { withAppBasePath, withBrowserBasePath } from '@/lib/app-path';

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
  compliance_status?: string;
  compliance_label?: string;
  insurance_status?: string;
  revision_status?: string;
};

type VehicleListResponse = {
  items: VehicleListItem[];
};

const statusTone: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Attiva',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  expiring: {
    label: 'In scadenza',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  expired: {
    label: 'Scaduta',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
  missing: {
    label: 'Mancante',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
};

const complianceTone: Record<string, string> = {
  completo_attivo: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  parziale_attivo: 'border-amber-200 bg-amber-50 text-amber-800',
  scaduto: 'border-red-200 bg-red-50 text-red-800',
  solo_targa: 'border-slate-200 bg-slate-50 text-slate-700',
};

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
        setError(null);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Impossibile caricare il riepilogo mezzi.');
      });
    return () => {
      alive = false;
    };
  }, []);

  const groupedTotals = useMemo(() => {
    return vehicles.reduce(
      (acc, vehicle) => {
        const status = vehicle.compliance_status || 'solo_targa';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [vehicles]);

  return (
    <div className="space-y-6">
      <SectionLead
        description="Quadro unico dei mezzi aziendali."
        detail="Apri una tessera o una riga per lavorare su fascicolo, coperture, revisioni, assegnazioni, km e storico operativo."
      />

      {error && (
        <NoticeBanner
          title="Errore caricamento"
          message={error}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mezzi totali" value={summary?.total_vehicles ?? '...'} />
        <MetricCard label="Operativi" value={summary?.operational_vehicles ?? '...'} accent="var(--cv-primary-dark)" />
        <MetricCard label="Assicurazioni entro 30 giorni" value={summary?.insurance_expiring_30d ?? '...'} accent="var(--cv-danger)" />
        <MetricCard label="Revisioni entro 30 giorni" value={summary?.revision_expiring_30d ?? '...'} accent="var(--cv-warning)" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCounter label="Completi" value={groupedTotals.completo_attivo || 0} tone="border-emerald-200 bg-emerald-50 text-emerald-800" />
        <StatusCounter label="Parziali" value={groupedTotals.parziale_attivo || 0} tone="border-amber-200 bg-amber-50 text-amber-800" />
        <StatusCounter label="Scaduti" value={groupedTotals.scaduto || 0} tone="border-red-200 bg-red-50 text-red-800" />
        <StatusCounter label="Solo targa" value={groupedTotals.solo_targa || 0} tone="border-slate-200 bg-slate-50 text-slate-700" />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: 'var(--cv-border-subtle)' }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
              Mezzi in ordine operativo
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Le situazioni complete sono in alto; seguono mezzi parziali, scaduti e targhe da completare.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={withAppBasePath('/fleet/anagrafica')}
              className="rounded-[var(--cv-radius-md)] border px-3 py-2 text-sm font-medium"
              style={{ borderColor: 'var(--cv-border-subtle)', color: 'var(--cv-primary)' }}
            >
              Tutti i mezzi
            </Link>
            <Link
              href={withAppBasePath('/fleet/catalogo')}
              className="rounded-[var(--cv-radius-md)] border px-3 py-2 text-sm font-medium"
              style={{ borderColor: 'var(--cv-border-subtle)', color: 'var(--cv-primary)' }}
            >
              Catalogo modelli
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--cv-border-subtle)' }}>
            <thead className="bg-slate-50">
              <tr>
                <Column>Mezzo</Column>
                <Column>Completezza</Column>
                <Column>Assicurazione</Column>
                <Column>Revisione</Column>
                <Column>Assegnazione</Column>
                <Column>Operatività</Column>
              </tr>
            </thead>
            <tbody className="divide-y bg-white" style={{ borderColor: 'var(--cv-border-subtle)' }}>
              {vehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="cursor-pointer transition hover:bg-[var(--cv-primary-soft)]"
                  onClick={() => {
                    window.location.href = withBrowserBasePath(`/fleet/dettaglio?id=${vehicle.id}`);
                  }}
                >
                  <Cell>
                    <div className="font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>{vehicle.targa}</div>
                    <div className="mt-1 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                      {vehicle.marca || '-'} {vehicle.modello || ''} - {vehicle.tipo || 'Tipo non definito'}
                    </div>
                  </Cell>
                  <Cell>
                    <Badge
                      label={vehicle.compliance_label || 'Solo targa'}
                      className={complianceTone[vehicle.compliance_status || 'solo_targa'] || complianceTone.solo_targa}
                    />
                  </Cell>
                  <Cell>
                    <DocumentStatus
                      status={vehicle.insurance_status || 'missing'}
                      date={vehicle.scadenza_assicurazione}
                    />
                  </Cell>
                  <Cell>
                    <DocumentStatus
                      status={vehicle.revision_status || 'missing'}
                      date={vehicle.scadenza_revisione}
                    />
                  </Cell>
                  <Cell>
                    <div className="font-medium" style={{ color: 'var(--cv-neutral-800)' }}>
                      {vehicle.current_assignee || 'Non assegnato'}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                      {vehicle.localizzazione_corrente || 'Sede non indicata'}
                    </div>
                  </Cell>
                  <Cell>
                    <div className="text-xs" style={{ color: 'var(--cv-neutral-700)' }}>
                      Km {formatNumber(vehicle.km_attuali)}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: vehicle.open_incidents > 0 ? 'var(--cv-danger)' : 'var(--cv-neutral-600)' }}>
                      {vehicle.open_incidents > 0 ? `${vehicle.open_incidents} sinistri aperti` : 'Nessun sinistro aperto'}
                    </div>
                  </Cell>
                </tr>
              ))}

              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    Nessun mezzo disponibile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusCounter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[var(--cv-radius-lg)] border px-4 py-3 ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Column({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cv-neutral-600)' }}>
      {children}
    </th>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 align-top">{children}</td>;
}

function DocumentStatus({ status, date }: { status: string; date?: string | null }) {
  const tone = statusTone[status] || statusTone.missing;
  return (
    <div className="space-y-1">
      <Badge label={tone.label} className={tone.className} />
      <div className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
        {date ? formatDate(date) : 'Data assente'}
      </div>
    </div>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('it-IT').format(value || 0);
}
