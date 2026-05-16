'use client';

import { useEffect, useMemo, useState } from 'react';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { SectionLead } from '@/components/common/SectionLead';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { api } from '@/lib/api';

type VehicleTrim = {
  id: number;
  production_year?: number | null;
  engine_type: string;
  displacement_cc?: number | null;
  horsepower_hp?: number | null;
  source: string;
  model?: {
    id: number;
    name: string;
    vehicle_category: string;
    brand?: {
      id: number;
      name: string;
    } | null;
  } | null;
};

type CreateVehicleResponse = {
  id: number;
  license_plate: string;
  trim_id: number;
  brand_name: string;
  model_name: string;
  created_from: string;
};

const categoryOptions = [
  { value: 'Car', label: 'Autovettura' },
  { value: 'Light_Commercial', label: 'Commerciale leggero' },
  { value: 'Heavy_Duty', label: 'Mezzo pesante' },
  { value: 'Motorcycle', label: 'Motociclo' },
];

const engineOptions = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Petrol', label: 'Benzina' },
  { value: 'Electric', label: 'Elettrico' },
  { value: 'Hybrid', label: 'Ibrido' },
  { value: 'Plug-in', label: 'Plug-in' },
  { value: 'CNG', label: 'Metano/CNG' },
];

function trimLabel(trim: VehicleTrim) {
  const brand = trim.model?.brand?.name || 'Marca';
  const model = trim.model?.name || 'Modello';
  const details = [
    trim.production_year || null,
    trim.engine_type,
    trim.displacement_cc ? `${trim.displacement_cc} cc` : null,
    trim.horsepower_hp ? `${trim.horsepower_hp} CV` : null,
  ].filter(Boolean).join(' - ');
  return `${brand} ${model}${details ? ` - ${details}` : ''}`;
}

export default function FleetCatalogClientPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [trims, setTrims] = useState<VehicleTrim[]>([]);
  const [selectedTrimId, setSelectedTrimId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [trimForm, setTrimForm] = useState({
    brand_name: '',
    model_name: '',
    vehicle_category: 'Light_Commercial',
    production_year: '',
    engine_type: 'Diesel',
    displacement_cc: '',
    horsepower_hp: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    license_plate: '',
    vin_code: '',
    status: 'Active',
    km_attuali: '',
    color: '',
    ownership_type: '',
    note: '',
  });

  const loadTrims = async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    const response = await api.get<VehicleTrim[]>(`/fleet/catalog/trims?${params.toString()}`);
    setTrims(response);
    setError(null);
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadTrims().catch((err) => setError(err.message || 'Impossibile caricare il catalogo tecnico.'));
    });
  }, [debouncedSearch]);

  const trimOptions = useMemo(
    () => [
      { value: '', label: 'Seleziona allestimento tecnico' },
      ...trims.map((trim) => ({ value: String(trim.id), label: trimLabel(trim) })),
    ],
    [trims],
  );

  const createTrim = async () => {
    const response = await api.post<VehicleTrim>('/fleet/catalog/trims', {
      brand_name: trimForm.brand_name,
      model_name: trimForm.model_name,
      vehicle_category: trimForm.vehicle_category,
      production_year: trimForm.production_year ? Number(trimForm.production_year) : null,
      engine_type: trimForm.engine_type,
      displacement_cc: trimForm.displacement_cc ? Number(trimForm.displacement_cc) : null,
      horsepower_hp: trimForm.horsepower_hp ? Number(trimForm.horsepower_hp) : null,
      source: 'manuale',
    });
    setSuccess('Allestimento tecnico salvato nel catalogo locale.');
    setSelectedTrimId(String(response.id));
    setTrimForm({
      brand_name: '',
      model_name: '',
      vehicle_category: 'Light_Commercial',
      production_year: '',
      engine_type: 'Diesel',
      displacement_cc: '',
      horsepower_hp: '',
    });
    await loadTrims();
  };

  const createVehicle = async () => {
    const response = await api.post<CreateVehicleResponse>('/fleet/catalog/vehicles', {
      trim_id: selectedTrimId ? Number(selectedTrimId) : null,
      license_plate: vehicleForm.license_plate,
      vin_code: vehicleForm.vin_code || null,
      status: vehicleForm.status,
      km_attuali: vehicleForm.km_attuali ? Number(vehicleForm.km_attuali) : 0,
      color: vehicleForm.color || null,
      ownership_type: vehicleForm.ownership_type || null,
      note: vehicleForm.note || null,
    });
    setSuccess(`Mezzo ${response.license_plate} creato e collegato a ${response.brand_name} ${response.model_name}.`);
    setVehicleForm({
      license_plate: '',
      vin_code: '',
      status: 'Active',
      km_attuali: '',
      color: '',
      ownership_type: '',
      note: '',
    });
  };

  return (
    <div className="space-y-6">
      <SectionLead
        description="Catalogo tecnico locale per marche, modelli e allestimenti motore. Ogni mezzo fisico deve essere collegato a uno di questi record."
        detail="Il sistema cerca prima qui e usa eventuali API esterne solo come fallback esplicito."
      />

      {error && <NoticeBanner title="Errore caricamento" message={error} />}
      {success && <NoticeBanner title="Operazione completata" message={success} tone="success" />}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card padding="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Catalogo allestimenti</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Ricerca per marca o modello. Le righe sono dati tecnici riutilizzabili da piu mezzi fisici.
              </p>
            </div>
            <Input label="Cerca" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Isuzu, Ducato, Transit..." />
            <div className="space-y-2">
              {trims.map((trim) => (
                <button
                  key={trim.id}
                  type="button"
                  className="w-full rounded-[var(--cv-radius-md)] border p-3 text-left transition-colors"
                  style={{
                    borderColor: selectedTrimId === String(trim.id) ? 'var(--cv-primary)' : 'var(--cv-border-subtle)',
                    background: selectedTrimId === String(trim.id) ? 'var(--cv-primary-lighter)' : 'white',
                  }}
                  onClick={() => setSelectedTrimId(String(trim.id))}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>{trimLabel(trim)}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                    Categoria {trim.model?.vehicle_category || 'n.d.'} - Fonte {trim.source}
                  </p>
                </button>
              ))}
              {trims.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun allestimento trovato.</p>
              )}
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Nuovo allestimento tecnico</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Crea prima marca, modello e motore quando non esistono nel catalogo.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Marca" value={trimForm.brand_name} onChange={(event) => setTrimForm((current) => ({ ...current, brand_name: event.target.value }))} />
              <Input label="Modello" value={trimForm.model_name} onChange={(event) => setTrimForm((current) => ({ ...current, model_name: event.target.value }))} />
              <Select label="Categoria" value={trimForm.vehicle_category} onChange={(event) => setTrimForm((current) => ({ ...current, vehicle_category: event.target.value }))} options={categoryOptions} />
              <Input label="Anno produzione" type="number" value={trimForm.production_year} onChange={(event) => setTrimForm((current) => ({ ...current, production_year: event.target.value }))} />
              <Select label="Alimentazione" value={trimForm.engine_type} onChange={(event) => setTrimForm((current) => ({ ...current, engine_type: event.target.value }))} options={engineOptions} />
              <Input label="Cilindrata cc" type="number" value={trimForm.displacement_cc} onChange={(event) => setTrimForm((current) => ({ ...current, displacement_cc: event.target.value }))} />
              <Input label="Cavalli CV" type="number" value={trimForm.horsepower_hp} onChange={(event) => setTrimForm((current) => ({ ...current, horsepower_hp: event.target.value }))} />
            </div>
            <Button type="button" disabled={!trimForm.brand_name || !trimForm.model_name} onClick={() => createTrim().catch((err) => setError(err.message || 'Impossibile salvare l allestimento.'))}>
              Salva allestimento
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Crea mezzo fisico</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Il mezzo viene creato solo se ha un allestimento tecnico collegato.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Select label="Allestimento tecnico" value={selectedTrimId} onChange={(event) => setSelectedTrimId(event.target.value)} options={trimOptions} />
            <Input label="Targa" value={vehicleForm.license_plate} onChange={(event) => setVehicleForm((current) => ({ ...current, license_plate: event.target.value.toUpperCase() }))} />
            <Input label="Telaio / VIN" value={vehicleForm.vin_code} onChange={(event) => setVehicleForm((current) => ({ ...current, vin_code: event.target.value.toUpperCase() }))} />
            <Select
              label="Stato"
              value={vehicleForm.status}
              onChange={(event) => setVehicleForm((current) => ({ ...current, status: event.target.value }))}
              options={[
                { value: 'Active', label: 'Attivo' },
                { value: 'Maintenance', label: 'Manutenzione' },
                { value: 'Sold', label: 'Venduto' },
              ]}
            />
            <Input label="Km attuali" type="number" value={vehicleForm.km_attuali} onChange={(event) => setVehicleForm((current) => ({ ...current, km_attuali: event.target.value }))} />
            <Input label="Colore" value={vehicleForm.color} onChange={(event) => setVehicleForm((current) => ({ ...current, color: event.target.value }))} />
            <Input label="Proprieta" value={vehicleForm.ownership_type} onChange={(event) => setVehicleForm((current) => ({ ...current, ownership_type: event.target.value }))} />
            <Input label="Note" value={vehicleForm.note} onChange={(event) => setVehicleForm((current) => ({ ...current, note: event.target.value }))} />
          </div>
          <Button type="button" disabled={!selectedTrimId || !vehicleForm.license_plate} onClick={() => createVehicle().catch((err) => setError(err.message || 'Impossibile creare il mezzo.'))}>
            Crea mezzo collegato
          </Button>
        </div>
      </Card>
    </div>
  );
}
