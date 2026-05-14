'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SectionLead } from '@/components/common/SectionLead';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { api } from '@/lib/api';

type VehicleTypeOption = {
  id: number;
  name: string;
};

type VehicleItem = {
  id: number;
  targa: string;
  marca: string;
  modello: string;
  tipo: string;
  stato?: string | null;
  km_attuali: number;
  scadenza_assicurazione?: string | null;
  scadenza_revisione?: string | null;
  ultima_revisione?: string | null;
  localizzazione_corrente?: string | null;
  vehicle_type_name?: string | null;
  current_assignee?: string | null;
  open_incidents: number;
};

type VehicleListResponse = {
  items: VehicleItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('it-IT');
}

function statusTone(status?: string | null) {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('manca') || normalized.includes('fermo')) return 'var(--cv-danger)';
  if (normalized.includes('manut')) return 'var(--cv-warning)';
  return 'var(--cv-primary-dark)';
}

export default function FleetRegistryClientPage() {
  const [search, setSearch] = useState('');
  const [stato, setStato] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [page, setPage] = useState(1);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [payload, setPayload] = useState<VehicleListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    api.get<Array<{ id: number; name: string }>>('/fleet/types')
      .then((items) => setVehicleTypes(items))
      .catch(() => setVehicleTypes([]));
  }, []);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({
      page: String(page),
      page_size: '12',
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (stato) params.set('stato', stato);
    if (vehicleTypeId) params.set('vehicle_type_id', vehicleTypeId);

    api.get<VehicleListResponse>(`/fleet/vehicles?${params.toString()}`)
      .then((response) => {
        if (!alive) return;
        setPayload(response);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Impossibile caricare i mezzi.');
      });

    return () => {
      alive = false;
    };
  }, [debouncedSearch, stato, vehicleTypeId, page]);

  const stateOptions = useMemo(() => ([
    { value: '', label: 'Tutti gli stati' },
    { value: 'operativo', label: 'Operativo' },
    { value: 'manutenzione', label: 'In manutenzione' },
    { value: 'fuori_servizio', label: 'Fuori servizio' },
    { value: 'manca copertura assicurativa o revisione', label: 'Copertura o revisione mancante' },
  ]), []);

  return (
    <div className="space-y-6">
      <SectionLead
        description="Archivio unico di tutti i mezzi con storico dinamico."
        detail="Ogni scheda mezzo raccoglie dati tecnici, coperture, revisioni, assegnazioni, sinistri e documenti."
      />

      <Card padding="md">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Ricerca"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Targa, marca, modello o tipo..."
          />
          <Select
            label="Stato"
            value={stato}
            onChange={(event) => {
              setPage(1);
              setStato(event.target.value);
            }}
            options={stateOptions}
          />
          <Select
            label="Tipologia mezzo"
            value={vehicleTypeId}
            onChange={(event) => {
              setPage(1);
              setVehicleTypeId(event.target.value);
            }}
            options={[
              { value: '', label: 'Tutte le tipologie' },
              ...vehicleTypes.map((item) => ({ value: String(item.id), label: item.name })),
            ]}
          />
          <div className="flex items-end">
            <button
              type="button"
              className="text-sm font-medium"
              style={{ color: 'var(--cv-primary)' }}
              onClick={() => {
                setPage(1);
                setSearch('');
                setStato('');
                setVehicleTypeId('');
              }}
            >
              Reset filtri
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <NoticeBanner title="Errore caricamento" message={error} />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {(payload?.items || []).map((vehicle) => (
          <Link key={vehicle.id} href={`/fleet/dettaglio?id=${vehicle.id}`} className="block">
            <Card padding="md" className="h-full transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    {vehicle.targa}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                    {vehicle.marca} {vehicle.modello}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    {vehicle.vehicle_type_name || vehicle.tipo}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: `${statusTone(vehicle.stato)}14`,
                    color: statusTone(vehicle.stato),
                  }}
                >
                  {vehicle.stato || 'Non definito'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    Assicurazione
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                    {formatDate(vehicle.scadenza_assicurazione)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    Revisione
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                    {formatDate(vehicle.scadenza_revisione)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    Km attuali
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                    {vehicle.km_attuali.toLocaleString('it-IT')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    Utilizzatore attivo
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                    {vehicle.current_assignee || 'Non assegnato'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                <span>{vehicle.localizzazione_corrente || 'Localizzazione non registrata'}</span>
                <span>{vehicle.open_incidents} sinistri aperti</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!error && payload && payload.items.length === 0 && (
        <Card padding="md">
          <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
            Nessun mezzo disponibile per i filtri correnti.
          </p>
        </Card>
      )}

      {payload && payload.pages > 1 && (
        <PaginationBar
          label={`Totale mezzi: ${payload.total}`}
          page={payload.page}
          pages={payload.pages}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(payload.pages, current + 1))}
        />
      )}
    </div>
  );
}
