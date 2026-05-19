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
import { providerDisplayFields } from '@/lib/provider-payload';

type VehicleTrim = {
  id: number;
  commercial_name?: string | null;
  production_year?: number | null;
  engine_type: string;
  engine_code?: string | null;
  displacement_cc?: number | null;
  horsepower_hp?: number | null;
  torque_nm?: number | null;
  transmission?: string | null;
  drive_type?: string | null;
  body_style?: string | null;
  doors?: number | null;
  seats?: number | null;
  euro_class?: string | null;
  co2_g_km?: number | null;
  fuel_consumption_l_100km?: string | number | null;
  wheelbase_mm?: number | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  gross_weight_kg?: number | null;
  tow_capacity_kg?: number | null;
  source: string;
  raw_payload?: Record<string, unknown> | null;
  tire_fitments: Array<{
    id: number;
    position: string;
    tire_size: string;
    rim_size?: string | null;
    load_index?: string | null;
    speed_rating?: string | null;
    pressure_bar?: string | number | null;
    is_default: boolean;
    notes?: string | null;
  }>;
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

type VehicleBrand = {
  id: number;
  name: string;
  normalized_name: string;
};

type VehicleModel = {
  id: number;
  brand_id: number;
  name: string;
  vehicle_category: string;
  brand?: VehicleBrand | null;
};

type CreateVehicleResponse = {
  id: number;
  license_plate: string;
  trim_id: number;
  brand_name: string;
  model_name: string;
  created_from: string;
};

type ProviderStatus = {
  code: string;
  label: string;
  lookup_type: string;
  enabled: boolean;
  configured: boolean;
  needs_api_key: boolean;
  note: string;
};

type ExternalLookupResponse = {
  provider: string;
  lookup_type: string;
  lookup_key: string;
  status: string;
  error_message?: string | null;
  trim?: VehicleTrim | null;
  source_notes: string[];
};

type CatalogImportResponse = {
  provider: string;
  imported_brands: number;
  imported_models: number;
  skipped_models: number;
  errors: string[];
};

type CatalogStats = {
  brands: number;
  models: number;
  trims: number;
};

type ConventionalImportResponse = {
  created_vehicles: number;
  created_or_reused_trims: number;
  skipped_existing_plates: number;
  errors: string[];
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

function trimTechnicalFields(trim?: VehicleTrim | null) {
  if (!trim) return [];
  return [
    { label: 'Marca', value: trim.model?.brand?.name || '-' },
    { label: 'Modello', value: trim.model?.name || '-' },
    { label: 'Categoria', value: trim.model?.vehicle_category || '-' },
    { label: 'Versione', value: trim.commercial_name || '-' },
    { label: 'Anno', value: trim.production_year ? String(trim.production_year) : '-' },
    { label: 'Alimentazione', value: trim.engine_type || '-' },
    { label: 'Codice motore', value: trim.engine_code || '-' },
    { label: 'Cilindrata', value: trim.displacement_cc ? `${trim.displacement_cc} cc` : '-' },
    { label: 'Potenza', value: trim.horsepower_hp ? `${trim.horsepower_hp} CV` : '-' },
    { label: 'Coppia', value: trim.torque_nm ? `${trim.torque_nm} Nm` : '-' },
    { label: 'Cambio', value: trim.transmission || '-' },
    { label: 'Trazione', value: trim.drive_type || '-' },
    { label: 'Classe euro', value: trim.euro_class || '-' },
    { label: 'Porte', value: trim.doors ? String(trim.doors) : '-' },
    { label: 'Posti', value: trim.seats ? String(trim.seats) : '-' },
    { label: 'CO2', value: trim.co2_g_km ? `${trim.co2_g_km} g/km` : '-' },
    { label: 'Fonte', value: trim.source || '-' },
  ];
}

const conventionalCsvTemplate = [
  'targa;marca;modello;categoria;anno;alimentazione;cilindrata_cc;cavalli_cv;euro;vin;gomme_default;km;scadenza_assicurazione;compagnia;polizza;scadenza_revisione;note',
  'AB123CD;FIAT;PANDA;Car;2020;Petrol;1242;69;Euro 6;ZFA31200000000000;175/65 R14;45000;2026-12-31;Compagnia;POL123;2027-05-30;Import da libretto',
].join('\n');

function splitCsvLine(line: string) {
  return line.split(';').map((value) => value.trim());
}

function emptyToNull(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function numberOrNull(value: string | undefined) {
  if (!value || !value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function FleetCatalogClientPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [trims, setTrims] = useState<VehicleTrim[]>([]);
  const [selectedTrimId, setSelectedTrimId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [stats, setStats] = useState<CatalogStats>({ brands: 0, models: 0, trims: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [conventionalCsv, setConventionalCsv] = useState(conventionalCsvTemplate);
  const [isConventionalImporting, setIsConventionalImporting] = useState(false);
  const [lookupForm, setLookupForm] = useState({
    lookup_type: 'plate',
    lookup_key: '',
  });

  const [trimForm, setTrimForm] = useState({
    brand_name: '',
    model_name: '',
    vehicle_category: 'Light_Commercial',
    commercial_name: '',
    production_year: '',
    engine_type: 'Diesel',
    engine_code: '',
    displacement_cc: '',
    horsepower_hp: '',
    torque_nm: '',
    transmission: '',
    drive_type: '',
    body_style: '',
    doors: '',
    seats: '',
    euro_class: '',
    co2_g_km: '',
    fuel_consumption_l_100km: '',
    wheelbase_mm: '',
    length_mm: '',
    width_mm: '',
    height_mm: '',
    gross_weight_kg: '',
    tow_capacity_kg: '',
    tire_size: '',
    rim_size: '',
    load_index: '',
    speed_rating: '',
    pressure_bar: '',
    tire_notes: '',
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

  const loadProviders = async () => {
    const response = await api.get<ProviderStatus[]>('/fleet/catalog/providers');
    setProviders(response);
  };

  const loadBrandsAndModels = async () => {
    const [brandResponse, modelResponse, statsResponse] = await Promise.all([
      api.get<VehicleBrand[]>('/fleet/catalog/brands'),
      api.get<VehicleModel[]>('/fleet/catalog/models'),
      api.get<CatalogStats>('/fleet/catalog/stats'),
    ]);
    setBrands(brandResponse);
    setModels(modelResponse);
    setStats(statsResponse);
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadTrims().catch((err) => setError(err.message || 'Impossibile caricare il catalogo tecnico.'));
      loadProviders().catch((err) => setError(err.message || 'Impossibile caricare i provider esterni.'));
      loadBrandsAndModels().catch((err) => setError(err.message || 'Impossibile caricare marche e modelli.'));
    });
  }, [debouncedSearch]);

  const trimOptions = useMemo(
    () => [
      { value: '', label: 'Seleziona allestimento tecnico' },
      ...trims.map((trim) => ({ value: String(trim.id), label: trimLabel(trim) })),
    ],
    [trims],
  );

  const selectedProvider = providers.find((provider) => provider.lookup_type === lookupForm.lookup_type);
  const selectedProviderReady = Boolean(selectedProvider?.enabled && selectedProvider?.configured);
  const selectedProviderMissing = Boolean(selectedProvider && !selectedProviderReady);
  const selectedTrim = trims.find((trim) => String(trim.id) === selectedTrimId) || null;
  const selectedTrimFields = useMemo(() => trimTechnicalFields(selectedTrim), [selectedTrim]);
  const selectedTrimProviderFields = useMemo(() => providerDisplayFields(selectedTrim?.raw_payload, 160), [selectedTrim]);

  const createTrim = async () => {
    const response = await api.post<VehicleTrim>('/fleet/catalog/trims', {
      brand_name: trimForm.brand_name,
      model_name: trimForm.model_name,
      vehicle_category: trimForm.vehicle_category,
      commercial_name: trimForm.commercial_name || null,
      production_year: trimForm.production_year ? Number(trimForm.production_year) : null,
      engine_type: trimForm.engine_type,
      engine_code: trimForm.engine_code || null,
      displacement_cc: trimForm.displacement_cc ? Number(trimForm.displacement_cc) : null,
      horsepower_hp: trimForm.horsepower_hp ? Number(trimForm.horsepower_hp) : null,
      torque_nm: trimForm.torque_nm ? Number(trimForm.torque_nm) : null,
      transmission: trimForm.transmission || null,
      drive_type: trimForm.drive_type || null,
      body_style: trimForm.body_style || null,
      doors: trimForm.doors ? Number(trimForm.doors) : null,
      seats: trimForm.seats ? Number(trimForm.seats) : null,
      euro_class: trimForm.euro_class || null,
      co2_g_km: trimForm.co2_g_km ? Number(trimForm.co2_g_km) : null,
      fuel_consumption_l_100km: trimForm.fuel_consumption_l_100km ? Number(trimForm.fuel_consumption_l_100km) : null,
      wheelbase_mm: trimForm.wheelbase_mm ? Number(trimForm.wheelbase_mm) : null,
      length_mm: trimForm.length_mm ? Number(trimForm.length_mm) : null,
      width_mm: trimForm.width_mm ? Number(trimForm.width_mm) : null,
      height_mm: trimForm.height_mm ? Number(trimForm.height_mm) : null,
      gross_weight_kg: trimForm.gross_weight_kg ? Number(trimForm.gross_weight_kg) : null,
      tow_capacity_kg: trimForm.tow_capacity_kg ? Number(trimForm.tow_capacity_kg) : null,
      tire_fitments: trimForm.tire_size ? [{
        position: 'both',
        tire_size: trimForm.tire_size,
        rim_size: trimForm.rim_size || null,
        load_index: trimForm.load_index || null,
        speed_rating: trimForm.speed_rating || null,
        pressure_bar: trimForm.pressure_bar ? Number(trimForm.pressure_bar) : null,
        is_default: true,
        notes: trimForm.tire_notes || null,
        source: 'manuale',
      }] : [],
      source: 'manuale',
    });
    setSuccess('Allestimento tecnico salvato nel catalogo locale.');
    setSelectedTrimId(String(response.id));
    setTrimForm({
      brand_name: '',
      model_name: '',
      vehicle_category: 'Light_Commercial',
      commercial_name: '',
      production_year: '',
      engine_type: 'Diesel',
      engine_code: '',
      displacement_cc: '',
      horsepower_hp: '',
      torque_nm: '',
      transmission: '',
      drive_type: '',
      body_style: '',
      doors: '',
      seats: '',
      euro_class: '',
      co2_g_km: '',
      fuel_consumption_l_100km: '',
      wheelbase_mm: '',
      length_mm: '',
      width_mm: '',
      height_mm: '',
      gross_weight_kg: '',
      tow_capacity_kg: '',
      tire_size: '',
      rim_size: '',
      load_index: '',
      speed_rating: '',
      pressure_bar: '',
      tire_notes: '',
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

  const lookupExternalData = async () => {
    setError(null);
    if (!selectedProviderReady) {
      setSuccess(null);
      setError(null);
      return;
    }
    const response = await api.post<ExternalLookupResponse>('/fleet/catalog/external-lookup', {
      lookup_type: lookupForm.lookup_type,
      lookup_key: lookupForm.lookup_key,
      persist: true,
    });
    if (response.trim?.id) {
      setSelectedTrimId(String(response.trim.id));
      setSuccess(`Dati trovati da ${response.provider} e salvati nel catalogo locale.`);
      await loadTrims();
      return;
    }
    if (response.status === 'not_configured' || response.status === 'disabled') {
      setSuccess(null);
      setError(null);
      return;
    }
    setError(response.error_message || `Nessun dato utile dal provider ${response.provider}. Stato: ${response.status}`);
  };

  const importNhtsaCatalog = async () => {
    setError(null);
    setIsImporting(true);
    try {
      const response = await api.post<CatalogImportResponse>('/fleet/catalog/import', {
        provider: 'nhtsa',
        import_all_makes: true,
        makes: [],
      });
      setSuccess(`Import NHTSA completato: ${response.imported_brands} marche e ${response.imported_models} modelli aggiunti.`);
      if (response.errors.length > 0) {
        setError(response.errors.join(' | '));
      }
      await Promise.all([loadBrandsAndModels(), loadTrims()]);
    } finally {
      setIsImporting(false);
    }
  };

  const importConventionalCsv = async () => {
    setError(null);
    setSuccess(null);
    const lines = conventionalCsv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith('targa;') ? lines.slice(1) : lines;
    const rows = dataLines.map((line) => {
      const [
        licensePlate,
        brandName,
        modelName,
        vehicleCategory,
        productionYear,
        engineType,
        displacementCc,
        horsepowerHp,
        euroClass,
        vinCode,
        tireSize,
        kmAttuali,
        insuranceDue,
        insuranceCompany,
        insurancePolicy,
        revisionDue,
        note,
      ] = splitCsvLine(line);
      return {
        license_plate: licensePlate,
        brand_name: brandName,
        model_name: modelName,
        vehicle_category: vehicleCategory || 'Car',
        production_year: numberOrNull(productionYear),
        engine_type: engineType || 'Diesel',
        displacement_cc: numberOrNull(displacementCc),
        horsepower_hp: numberOrNull(horsepowerHp),
        euro_class: emptyToNull(euroClass),
        vin_code: emptyToNull(vinCode),
        tire_size: emptyToNull(tireSize),
        km_attuali: numberOrNull(kmAttuali) || 0,
        insurance_due: emptyToNull(insuranceDue),
        insurance_company: emptyToNull(insuranceCompany),
        insurance_policy: emptyToNull(insurancePolicy),
        revision_due: emptyToNull(revisionDue),
        note: emptyToNull(note),
        source: 'import_convenzionale',
      };
    }).filter((row) => row.license_plate && row.brand_name && row.model_name);

    if (rows.length === 0) {
      setError('Nessuna riga valida da importare. Servono almeno targa, marca e modello.');
      return;
    }

    setIsConventionalImporting(true);
    try {
      const response = await api.post<ConventionalImportResponse>('/fleet/catalog/import-plates', { rows });
      setSuccess(`Import convenzionale completato: ${response.created_vehicles} mezzi creati, ${response.skipped_existing_plates} targhe gia presenti.`);
      if (response.errors.length > 0) {
        setError(response.errors.join(' | '));
      }
      await Promise.all([loadBrandsAndModels(), loadTrims()]);
    } finally {
      setIsConventionalImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionLead
        description="Catalogo tecnico locale per marche, modelli e allestimenti motore. Ogni mezzo fisico deve essere collegato a uno di questi record."
        detail="Il sistema cerca prima qui e usa eventuali API esterne solo come fallback esplicito."
      />

      {error && <NoticeBanner title="Errore caricamento" message={error} />}
      {success && <NoticeBanner title="Operazione completata" message={success} tone="success" />}

      <Card padding="md">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr_1fr]">
          <div>
            <h3 className="text-lg font-semibold">Database catalogo</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Marche e modelli sono la base locale usata prima di ogni chiamata esterna.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <p className="text-xs uppercase" style={{ color: 'var(--cv-neutral-500)' }}>Marche</p>
                <p className="text-2xl font-semibold">{stats.brands}</p>
              </div>
              <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <p className="text-xs uppercase" style={{ color: 'var(--cv-neutral-500)' }}>Modelli</p>
                <p className="text-2xl font-semibold">{stats.models}</p>
              </div>
              <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <p className="text-xs uppercase" style={{ color: 'var(--cv-neutral-500)' }}>Allest.</p>
                <p className="text-2xl font-semibold">{stats.trims}</p>
              </div>
            </div>
            <Button type="button" className="mt-4" disabled={isImporting} onClick={() => importNhtsaCatalog().catch((err) => setError(err.message || 'Import NHTSA non riuscito.'))}>
              {isImporting ? 'Import in corso...' : 'Importa marche/modelli da NHTSA'}
            </Button>
          </div>
          <div>
            <p className="text-sm font-semibold">Ultime marche</p>
            <div className="mt-2 max-h-44 overflow-auto rounded-[var(--cv-radius-md)] border" style={{ borderColor: 'var(--cv-border-subtle)' }}>
              {brands.slice(0, 40).map((brand) => (
                <div key={brand.id} className="border-b px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-border-subtle)' }}>{brand.name}</div>
              ))}
              {brands.length === 0 && <p className="px-3 py-4 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna marca importata.</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Ultimi modelli</p>
            <div className="mt-2 max-h-44 overflow-auto rounded-[var(--cv-radius-md)] border" style={{ borderColor: 'var(--cv-border-subtle)' }}>
              {models.slice(0, 40).map((model) => (
                <div key={model.id} className="border-b px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  {model.brand?.name ? `${model.brand.name} ` : ''}{model.name}
                </div>
              ))}
              {models.length === 0 && <p className="px-3 py-4 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun modello importato.</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <div>
            <h3 className="text-lg font-semibold">Importa da piattaforme esterne</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Inserisci targa o VIN. Il dato trovato viene salvato nel catalogo locale e poi riusato dal gestionale.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
              <Select
                label="Tipo ricerca"
                value={lookupForm.lookup_type}
                onChange={(event) => setLookupForm((current) => ({ ...current, lookup_type: event.target.value }))}
                options={[
                  { value: 'plate', label: 'Targa' },
                  { value: 'vin', label: 'VIN / telaio' },
                ]}
              />
              <Input
                label={lookupForm.lookup_type === 'plate' ? 'Targa' : 'VIN / telaio'}
                value={lookupForm.lookup_key}
                onChange={(event) => setLookupForm((current) => ({ ...current, lookup_key: event.target.value.toUpperCase() }))}
                placeholder={lookupForm.lookup_type === 'plate' ? 'AB123CD' : '17 caratteri VIN'}
              />
              <div className="flex items-end">
                <Button type="button" disabled={!lookupForm.lookup_key || !selectedProviderReady} onClick={() => lookupExternalData().catch((err) => setError(err.message || 'Ricerca esterna non riuscita.'))}>
                  Cerca e salva
                </Button>
              </div>
            </div>
            {selectedProviderMissing && (
              <div
                className="mt-3 rounded-[var(--cv-radius-md)] border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--cv-warning)',
                  background: 'var(--cv-warning-lighter)',
                  color: 'var(--cv-neutral-800)',
                }}
              >
                {lookupForm.lookup_type === 'plate'
                  ? 'Ricerca da targa non attiva: manca il provider italiano e la relativa API key.'
                  : 'Ricerca VIN non attiva: abilita il provider nelle impostazioni del backend.'}
              </div>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {providers.map((provider) => (
              <div
                key={`${provider.lookup_type}-${provider.code}`}
                className="rounded-[var(--cv-radius-md)] border p-3"
                style={{ borderColor: 'var(--cv-border-subtle)', background: provider.enabled && provider.configured ? 'var(--cv-success-lighter)' : 'white' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>{provider.label}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>{provider.code}</p>
                <p className="mt-2 text-xs" style={{ color: provider.enabled && provider.configured ? 'var(--cv-success)' : 'var(--cv-warning)' }}>
                  {provider.enabled && provider.configured ? 'Attivo' : provider.configured ? 'Configurato, non attivo' : 'Da configurare'}
                </p>
                <p className="mt-2 text-xs leading-5" style={{ color: 'var(--cv-neutral-600)' }}>{provider.note}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="md">
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div>
            <h3 className="text-lg font-semibold">Import economico targhe</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Usa dati da libretto, Excel, visure manuali o controlli convenzionali. Il sistema crea mezzo, marca, modello e allestimento senza chiamate API.
            </p>
            <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
              <p>Formato: separatore punto e virgola.</p>
              <p>Date: `YYYY-MM-DD`.</p>
              <p>Campi minimi: targa, marca, modello.</p>
            </div>
            <Button
              type="button"
              className="mt-4"
              disabled={isConventionalImporting}
              onClick={() => importConventionalCsv().catch((err) => setError(err.message || 'Import convenzionale non riuscito.'))}
            >
              {isConventionalImporting ? 'Import in corso...' : 'Importa CSV'}
            </Button>
          </div>
          <textarea
            className="min-h-52 w-full rounded-[var(--cv-radius-md)] border p-3 font-mono text-xs"
            style={{ borderColor: 'var(--cv-border-subtle)', color: 'var(--cv-neutral-800)' }}
            value={conventionalCsv}
            onChange={(event) => setConventionalCsv(event.target.value)}
            spellCheck={false}
          />
        </div>
      </Card>

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
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2" style={{ color: 'var(--cv-neutral-600)' }}>
                    <span>Motore: {trim.engine_code || trim.engine_type}</span>
                    <span>Coppia: {trim.torque_nm ? `${trim.torque_nm} Nm` : 'n.d.'}</span>
                    <span>Cambio: {trim.transmission || 'n.d.'}</span>
                    <span>Euro: {trim.euro_class || 'n.d.'}</span>
                    <span>Dimensioni: {[trim.length_mm, trim.width_mm, trim.height_mm].filter(Boolean).join(' x ') || 'n.d.'}</span>
                    <span>Gomme: {trim.tire_fitments?.find((item) => item.is_default)?.tire_size || trim.tire_fitments?.[0]?.tire_size || 'n.d.'}</span>
                  </div>
                </button>
              ))}
              {trims.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun allestimento trovato.</p>
              )}
            </div>
            {selectedTrim && (
              <div className="mt-4 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)', background: 'white' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold">Scheda tecnica catalogo</h4>
                    <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                      Dati salvati localmente dal provider o da inserimento manuale.
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-primary-dark)' }}>
                    {selectedTrim.source}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {selectedTrimFields.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>{item.label}</p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-800)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>Pneumatici</p>
                  {selectedTrim.tire_fitments.length ? (
                    <div className="mt-2 grid gap-2">
                      {selectedTrim.tire_fitments.map((item) => (
                        <p key={item.id} className="rounded-[var(--cv-radius-sm)] border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-border-subtle)', color: 'var(--cv-neutral-800)' }}>
                          {item.tire_size}{item.rim_size ? ` - cerchio ${item.rim_size}` : ''}{item.is_default ? ' - default' : ''}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna misura pneumatici salvata.</p>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>Dati provider completi</p>
                  {selectedTrimProviderFields.length ? (
                    <div className="mt-2 grid max-h-80 gap-3 overflow-y-auto md:grid-cols-2">
                      {selectedTrimProviderFields.map((item) => (
                        <div key={`${item.label}-${item.value}`} className="rounded-[var(--cv-radius-sm)] border px-3 py-2" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>{item.label}</p>
                          <p className="mt-1 break-words text-sm" style={{ color: 'var(--cv-neutral-800)' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun payload provider esteso salvato.</p>
                  )}
                </div>
              </div>
            )}
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
              <Input label="Allestimento commerciale" value={trimForm.commercial_name} onChange={(event) => setTrimForm((current) => ({ ...current, commercial_name: event.target.value }))} />
              <Select label="Categoria" value={trimForm.vehicle_category} onChange={(event) => setTrimForm((current) => ({ ...current, vehicle_category: event.target.value }))} options={categoryOptions} />
              <Input label="Anno produzione" type="number" value={trimForm.production_year} onChange={(event) => setTrimForm((current) => ({ ...current, production_year: event.target.value }))} />
              <Select label="Alimentazione" value={trimForm.engine_type} onChange={(event) => setTrimForm((current) => ({ ...current, engine_type: event.target.value }))} options={engineOptions} />
              <Input label="Codice motore" value={trimForm.engine_code} onChange={(event) => setTrimForm((current) => ({ ...current, engine_code: event.target.value }))} />
              <Input label="Cilindrata cc" type="number" value={trimForm.displacement_cc} onChange={(event) => setTrimForm((current) => ({ ...current, displacement_cc: event.target.value }))} />
              <Input label="Cavalli CV" type="number" value={trimForm.horsepower_hp} onChange={(event) => setTrimForm((current) => ({ ...current, horsepower_hp: event.target.value }))} />
              <Input label="Coppia Nm" type="number" value={trimForm.torque_nm} onChange={(event) => setTrimForm((current) => ({ ...current, torque_nm: event.target.value }))} />
              <Input label="Cambio" value={trimForm.transmission} onChange={(event) => setTrimForm((current) => ({ ...current, transmission: event.target.value }))} />
              <Input label="Trazione" value={trimForm.drive_type} onChange={(event) => setTrimForm((current) => ({ ...current, drive_type: event.target.value }))} />
              <Input label="Carrozzeria" value={trimForm.body_style} onChange={(event) => setTrimForm((current) => ({ ...current, body_style: event.target.value }))} />
              <Input label="Porte" type="number" value={trimForm.doors} onChange={(event) => setTrimForm((current) => ({ ...current, doors: event.target.value }))} />
              <Input label="Posti" type="number" value={trimForm.seats} onChange={(event) => setTrimForm((current) => ({ ...current, seats: event.target.value }))} />
              <Input label="Classe euro" value={trimForm.euro_class} onChange={(event) => setTrimForm((current) => ({ ...current, euro_class: event.target.value }))} />
              <Input label="CO2 g/km" type="number" value={trimForm.co2_g_km} onChange={(event) => setTrimForm((current) => ({ ...current, co2_g_km: event.target.value }))} />
              <Input label="Consumo l/100km" type="number" step="0.01" value={trimForm.fuel_consumption_l_100km} onChange={(event) => setTrimForm((current) => ({ ...current, fuel_consumption_l_100km: event.target.value }))} />
              <Input label="Passo mm" type="number" value={trimForm.wheelbase_mm} onChange={(event) => setTrimForm((current) => ({ ...current, wheelbase_mm: event.target.value }))} />
              <Input label="Lunghezza mm" type="number" value={trimForm.length_mm} onChange={(event) => setTrimForm((current) => ({ ...current, length_mm: event.target.value }))} />
              <Input label="Larghezza mm" type="number" value={trimForm.width_mm} onChange={(event) => setTrimForm((current) => ({ ...current, width_mm: event.target.value }))} />
              <Input label="Altezza mm" type="number" value={trimForm.height_mm} onChange={(event) => setTrimForm((current) => ({ ...current, height_mm: event.target.value }))} />
              <Input label="Massa complessiva kg" type="number" value={trimForm.gross_weight_kg} onChange={(event) => setTrimForm((current) => ({ ...current, gross_weight_kg: event.target.value }))} />
              <Input label="Traino kg" type="number" value={trimForm.tow_capacity_kg} onChange={(event) => setTrimForm((current) => ({ ...current, tow_capacity_kg: event.target.value }))} />
              <Input label="Gomme default" value={trimForm.tire_size} onChange={(event) => setTrimForm((current) => ({ ...current, tire_size: event.target.value }))} placeholder="205/75 R16C" />
              <Input label="Cerchio" value={trimForm.rim_size} onChange={(event) => setTrimForm((current) => ({ ...current, rim_size: event.target.value }))} placeholder="16x6J" />
              <Input label="Indice carico" value={trimForm.load_index} onChange={(event) => setTrimForm((current) => ({ ...current, load_index: event.target.value }))} />
              <Input label="Codice velocita" value={trimForm.speed_rating} onChange={(event) => setTrimForm((current) => ({ ...current, speed_rating: event.target.value }))} />
              <Input label="Pressione bar" type="number" step="0.01" value={trimForm.pressure_bar} onChange={(event) => setTrimForm((current) => ({ ...current, pressure_bar: event.target.value }))} />
              <Input label="Altre misure / note gomme" value={trimForm.tire_notes} onChange={(event) => setTrimForm((current) => ({ ...current, tire_notes: event.target.value }))} />
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
