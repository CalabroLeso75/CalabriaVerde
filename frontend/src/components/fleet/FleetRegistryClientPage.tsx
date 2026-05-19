'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SectionLead } from '@/components/common/SectionLead';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { api } from '@/lib/api';
import { withAppBasePath } from '@/lib/app-path';
import { providerDisplayFields } from '@/lib/provider-payload';

type VehicleTypeOption = {
  id: number;
  name: string;
};

type GroupItem = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  scope: string;
  province_code?: string | null;
  vehicle_count: number;
};

type CommunicationTarget = {
  id: number;
  display_name: string;
  role_label: string;
  province_code?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  preferred_channels: string[];
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
  localizzazione_corrente?: string | null;
  vehicle_type_name?: string | null;
  current_assignee?: string | null;
  current_assignment_unit?: string | null;
  current_user_name?: string | null;
  compliance_status: string;
  compliance_label: string;
  insurance_status: string;
  revision_status: string;
  open_incidents: number;
};

type VehicleListResponse = {
  items: VehicleItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

type VehicleTrimResponse = {
  id: number;
  commercial_name?: string | null;
  production_year?: number | null;
  engine_type: string;
  displacement_cc?: number | null;
  horsepower_hp?: number | null;
  euro_class?: string | null;
  source: string;
  raw_payload?: Record<string, unknown> | null;
  model?: {
    name: string;
    vehicle_category: string;
    brand?: {
      name: string;
    } | null;
  } | null;
};

type RecognitionResponse = {
  provider: string;
  lookup_type: string;
  lookup_key: string;
  status: string;
  error_message?: string | null;
  trim?: VehicleTrimResponse | null;
};

type RecognitionInsuranceRecord = {
  id: number;
  source_type: string;
  compagnia: string;
  numero_polizza?: string | null;
  copertura_dal?: string | null;
  copertura_al?: string | null;
  data_scadenza: string;
  is_current: boolean;
};

type RecognitionRevisionRecord = {
  id: number;
  data_revisione: string;
  esito: string;
  km_rilevati?: number | null;
  note?: string | null;
};

type VehicleRecognitionResponse = {
  vehicle_id: number;
  lookup: RecognitionResponse;
  insurance_remote?: {
    status: string;
    company?: string | null;
    expiry?: string | null;
    is_insured?: boolean | null;
    region?: string | null;
    error_message?: string | null;
  } | null;
  insurance_records: RecognitionInsuranceRecord[];
  revision_records: RecognitionRevisionRecord[];
  api_logs: Array<{
    id: number;
    provider: string;
    lookup_type: string;
    lookup_key: string;
    status: string;
    http_status?: number | null;
    error_message?: string | null;
    created_at?: string | null;
    raw_payload?: Record<string, unknown> | null;
  }>;
};

function isCachedProvider(provider?: string | null) {
  return (provider || '').toLowerCase().includes('_cache');
}

type VehicleRecognitionApplyResponse = {
  id: number;
  targa: string;
  marca: string;
  modello: string;
  tipo: string;
  insurance_company_saved: boolean;
  insurance_record_saved: boolean;
  insurance_save_message?: string | null;
};

type RecognitionStep = 'confirm' | 'running' | 'result' | 'empty' | 'applying';

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

function expiryMeta(value?: string | null) {
  if (!value) return { label: 'Mancante', color: 'var(--cv-danger)' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(value);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `${formatDate(value)} - scaduta`, color: 'var(--cv-danger)' };
  if (days <= 30) return { label: `${formatDate(value)} - entro 30 gg`, color: 'var(--cv-warning)' };
  return { label: formatDate(value), color: 'var(--cv-primary-dark)' };
}

function ExpiryBadge({ label, value }: { label: string; value?: string | null }) {
  const meta = expiryMeta(value);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
        {label}
      </p>
      <span
        className="mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: `${meta.color}14`, color: meta.color }}
      >
        {meta.label}
      </span>
    </div>
  );
}

function statusText(value: string) {
  if (value === 'active') return 'Attiva';
  if (value === 'expired') return 'Scaduta';
  return 'Non reperita';
}

function insuranceRemoteMessage(remote?: VehicleRecognitionResponse['insurance_remote'] | null) {
  if (!remote) return 'Assicurazione non interrogata.';
  if (remote.company && remote.expiry) return `${remote.company} - scadenza ${remote.expiry}`;
  if (remote.company) return `${remote.company} - scadenza non disponibile: verra salvata solo la compagnia.`;
  if (remote.is_insured === true) return 'Il provider indica assicurazione attiva, ma non restituisce compagnia/scadenza salvabili.';
  if (remote.is_insured === false) return 'Il provider indica assicurazione non attiva o non disponibile.';
  return remote.error_message || 'Assicurazione non reperita dal provider.';
}

function recognitionEmptyTitle(result: VehicleRecognitionResponse | null) {
  if (result?.lookup.status === 'empty' || result?.lookup.status === 'not_found') {
    return 'Provider senza dati aggiornabili';
  }
  return 'Nessun dato aggiornabile';
}

function recognitionEmptyMessage(result: VehicleRecognitionResponse | null) {
  if (!result) return 'Ricerca targa non riuscita.';
  if (result.lookup.error_message) return result.lookup.error_message;
  if (result.lookup.status === 'empty' || result.lookup.status === 'not_found') {
    return 'Il provider non ha restituito dati tecnici salvabili per questa targa. Il risultato e stato registrato per evitare nuove chiamate inutili.';
  }
  return `Il provider ha restituito stato ${result.lookup.status || 'non definito'}.`;
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: 'var(--cv-neutral-700)' }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-[var(--cv-radius-md)] border px-3 py-2 text-sm outline-none transition-shadow focus:ring-2"
        style={{
          borderColor: 'var(--cv-border-subtle)',
          background: 'white',
          color: 'var(--cv-neutral-900)',
          boxShadow: 'var(--cv-shadow-xs)',
        }}
      />
    </label>
  );
}

export default function FleetRegistryClientPage() {
  const [search, setSearch] = useState('');
  const [stato, setStato] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [page, setPage] = useState(1);

  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [targets, setTargets] = useState<CommunicationTarget[]>([]);
  const [payload, setPayload] = useState<VehicleListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [insuranceModalGroup, setInsuranceModalGroup] = useState<GroupItem | null>(null);
  const [revisionModalGroup, setRevisionModalGroup] = useState<GroupItem | null>(null);
  const [recognitionVehicle, setRecognitionVehicle] = useState<VehicleItem | null>(null);
  const [recognitionStep, setRecognitionStep] = useState<RecognitionStep>('confirm');
  const [recognitionElapsed, setRecognitionElapsed] = useState(0);
  const [recognitionResult, setRecognitionResult] = useState<VehicleRecognitionResponse | null>(null);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [groupVehicleSearch, setGroupVehicleSearch] = useState('');

  const [groupForm, setGroupForm] = useState({ name: '', code: '', scope: 'operativo', province_code: '', description: '' });
  const [targetForm, setTargetForm] = useState({
    display_name: '',
    role_label: 'Responsabile parco provinciale',
    province_code: '',
    email: '',
    phone: '',
    whatsapp: '',
    preferred_channel: 'sistema',
    note: '',
  });
  const [bulkInsuranceForm, setBulkInsuranceForm] = useState({
    group_id: '',
    compagnia: '',
    broker: '',
    package_name: '',
    copertura_dal: '',
    copertura_al: '',
    data_scadenza: '',
    note: '',
  });
  const [bulkRevisionForm, setBulkRevisionForm] = useState({
    group_id: '',
    data_revisione: '',
    scadenza_revisione: '',
    scadenza_verifica_sicurezza: '',
    esito: 'pianificata',
    note: '',
  });

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadMeta = async () => {
    const [typeItems, groupItems, targetItems] = await Promise.all([
      api.get<Array<{ id: number; name: string }>>('/fleet/types').catch(() => []),
      api.get<GroupItem[]>('/fleet/groups').catch(() => []),
      api.get<CommunicationTarget[]>('/fleet/communication-targets').catch(() => []),
    ]);
    setVehicleTypes(typeItems);
    setGroups(groupItems);
    setTargets(targetItems);
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadMeta().catch(() => undefined);
    });
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

  useEffect(() => {
    if (recognitionStep !== 'running') return undefined;
    const timer = window.setInterval(() => {
      setRecognitionElapsed((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recognitionStep]);

  const stateOptions = useMemo(() => ([
    { value: '', label: 'Tutti gli stati' },
    { value: 'operativo', label: 'Operativo' },
    { value: 'manutenzione', label: 'In manutenzione' },
    { value: 'fuori_servizio', label: 'Fuori servizio' },
    { value: 'manca copertura assicurativa o revisione', label: 'Copertura o revisione mancante' },
  ]), []);

  const groupOptions = useMemo(
    () => [{ value: '', label: 'Seleziona gruppo' }, ...groups.map((item) => ({ value: String(item.id), label: `${item.name} (${item.vehicle_count})` }))],
    [groups],
  );

  const selectableVehicles = useMemo(() => {
    const items = payload?.items || [];
    const term = groupVehicleSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter((vehicle) => (
      vehicle.targa.toLowerCase().includes(term)
      || vehicle.marca.toLowerCase().includes(term)
      || vehicle.modello.toLowerCase().includes(term)
      || vehicle.tipo.toLowerCase().includes(term)
    ));
  }, [groupVehicleSearch, payload]);

  const handleCreateGroup = async () => {
    await api.post('/fleet/groups', {
      name: groupForm.name,
      code: groupForm.code,
      scope: groupForm.scope,
      province_code: groupForm.province_code || null,
      description: groupForm.description || null,
      vehicle_ids: selectedVehicleIds,
    });
    setActionMessage(`Gruppo mezzi creato con ${selectedVehicleIds.length} mezzi selezionati.`);
    setGroupForm({ name: '', code: '', scope: 'operativo', province_code: '', description: '' });
    setSelectedVehicleIds([]);
    setGroupVehicleSearch('');
    setGroupModalOpen(false);
    await loadMeta();
  };

  const handleCreateTarget = async () => {
    await api.post('/fleet/communication-targets', {
      module_scope: 'fleet',
      compartment_scope: 'parco_macchine',
      display_name: targetForm.display_name,
      role_label: targetForm.role_label,
      province_code: targetForm.province_code || null,
      email: targetForm.email || null,
      phone: targetForm.phone || null,
      whatsapp: targetForm.whatsapp || null,
      preferred_channels: [targetForm.preferred_channel],
      note: targetForm.note || null,
    });
    setActionMessage('Destinatario comunicazioni registrato.');
    setTargetForm({
      display_name: '',
      role_label: 'Responsabile parco provinciale',
      province_code: '',
      email: '',
      phone: '',
      whatsapp: '',
      preferred_channel: 'sistema',
      note: '',
    });
    await loadMeta();
  };

  const handleBulkInsurance = async () => {
    await api.post('/fleet/bulk/insurance', {
      group_id: Number(bulkInsuranceForm.group_id),
      compagnia: bulkInsuranceForm.compagnia,
      broker: bulkInsuranceForm.broker || null,
      package_name: bulkInsuranceForm.package_name || null,
      copertura_dal: bulkInsuranceForm.copertura_dal || null,
      copertura_al: bulkInsuranceForm.copertura_al || null,
      data_scadenza: bulkInsuranceForm.data_scadenza,
      note: bulkInsuranceForm.note || null,
    });
    setActionMessage('Rinnovo assicurativo massivo registrato. Restano da inserire i numeri di polizza sui singoli mezzi.');
    setBulkInsuranceForm({
      group_id: '',
      compagnia: '',
      broker: '',
      package_name: '',
      copertura_dal: '',
      copertura_al: '',
      data_scadenza: '',
      note: '',
    });
    setInsuranceModalGroup(null);
    await loadMeta();
  };

  const handleBulkRevision = async () => {
    await api.post('/fleet/bulk/revision', {
      group_id: Number(bulkRevisionForm.group_id),
      data_revisione: bulkRevisionForm.data_revisione || null,
      scadenza_revisione: bulkRevisionForm.scadenza_revisione,
      scadenza_verifica_sicurezza: bulkRevisionForm.scadenza_verifica_sicurezza || null,
      esito: bulkRevisionForm.esito,
      note: bulkRevisionForm.note || null,
    });
    setActionMessage('Aggiornamento massivo revisioni registrato sul gruppo selezionato.');
    setBulkRevisionForm({
      group_id: '',
      data_revisione: '',
      scadenza_revisione: '',
      scadenza_verifica_sicurezza: '',
      esito: 'pianificata',
      note: '',
    });
    setRevisionModalGroup(null);
    await loadMeta();
  };

  const startRecognition = async (forceRefresh = false) => {
    if (!recognitionVehicle) return;
    setRecognitionElapsed(0);
    setRecognitionStep('running');
    setRecognitionResult(null);
    setError(null);
    try {
      const qs = forceRefresh ? '?force_refresh=true' : '';
      const response = await api.post<VehicleRecognitionResponse>(`/fleet/vehicles/${recognitionVehicle.id}/recognition${qs}`, {});
      setRecognitionResult(response);
      setRecognitionStep(response.lookup.status === 'found' && response.lookup.trim ? 'result' : 'empty');
    } catch (err) {
      setRecognitionStep('empty');
      setRecognitionResult({
        vehicle_id: recognitionVehicle.id,
        lookup: {
          provider: 'targa_co_it',
          lookup_type: 'plate',
          lookup_key: recognitionVehicle.targa,
          status: 'error',
          error_message: err instanceof Error ? err.message : 'Ricerca targa non riuscita.',
        },
        insurance_records: [],
        revision_records: [],
        api_logs: [],
      });
    }
  };

  const applyRecognition = async () => {
    if (!recognitionVehicle || !recognitionResult?.lookup.trim?.id) return;
    setRecognitionStep('applying');
    const applyResponse = await api.post<VehicleRecognitionApplyResponse>(`/fleet/vehicles/${recognitionVehicle.id}/recognition/apply`, {
      trim_id: recognitionResult.lookup.trim.id,
      note: `Riconoscimento targa ${recognitionVehicle.targa} da provider ${recognitionResult.lookup.provider}.`,
    });
    setActionMessage(`Dati mezzo ${recognitionVehicle.targa} aggiornati. ${applyResponse.insurance_save_message || ''}`.trim());
    setRecognitionVehicle(null);
    setRecognitionResult(null);
    setRecognitionStep('confirm');
    const params = new URLSearchParams({ page: String(page), page_size: '12' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (stato) params.set('stato', stato);
    if (vehicleTypeId) params.set('vehicle_type_id', vehicleTypeId);
    const response = await api.get<VehicleListResponse>(`/fleet/vehicles?${params.toString()}`);
    setPayload(response);
  };

  return (
    <div className="space-y-6">
      <SectionLead
        description="Archivio unico dei mezzi con gestione operativa di gruppi, rinnovi, assegnazioni e comunicazioni."
        detail="Da qui prepariamo i gruppi come AIB, i rinnovi massivi e la rete dei destinatari per gli alert ufficiali."
      />

      {actionMessage && <NoticeBanner title="Operazione completata" message={actionMessage} tone="success" />}
      {error && <NoticeBanner title="Errore caricamento" message={error} />}

      <Card padding="md">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => setGroupModalOpen(true)}>
            Crea gruppo da selezione
          </Button>
        </div>
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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card padding="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Gruppi mezzi</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Crea gruppi operativi come AIB o altri comparti. L&apos;aggiornamento massivo parte da qui.
              </p>
            </div>

            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="rounded-[var(--cv-radius-md)] border px-3 py-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{group.name}</p>
                      <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                        {group.code} · {group.scope} · {group.vehicle_count} mezzi
                      </p>
                    </div>
                    {group.province_code ? (
                      <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>{group.province_code}</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkInsuranceForm((current) => ({ ...current, group_id: String(group.id) }));
                        setInsuranceModalGroup(group);
                      }}
                    >
                      Assicurazione
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkRevisionForm((current) => ({ ...current, group_id: String(group.id) }));
                        setRevisionModalGroup(group);
                      }}
                    >
                      Revisione
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              <Input label="Nome gruppo" value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Codice gruppo" value={groupForm.code} onChange={(event) => setGroupForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
              <Select
                label="Scope"
                value={groupForm.scope}
                onChange={(event) => setGroupForm((current) => ({ ...current, scope: event.target.value }))}
                options={[
                  { value: 'operativo', label: 'Operativo' },
                  { value: 'aib', label: 'AIB' },
                  { value: 'provinciale', label: 'Provinciale' },
                  { value: 'speciale', label: 'Speciale' },
                ]}
              />
              <Input label="Provincia" value={groupForm.province_code} onChange={(event) => setGroupForm((current) => ({ ...current, province_code: event.target.value.toUpperCase() }))} placeholder="CS, CZ..." />
              <TextareaField label="Descrizione" value={groupForm.description} onChange={(value) => setGroupForm((current) => ({ ...current, description: value }))} />
              <Button type="button" onClick={() => handleCreateGroup().catch((err) => setError(err.message || 'Impossibile creare il gruppo.'))}>
                Crea gruppo
              </Button>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Destinatari comunicazioni</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Questi contatti ricevono gli alert ufficiali del parco macchine e alimentano il registro comunicazioni.
              </p>
            </div>

            <div className="space-y-2">
              {targets.map((target) => (
                <div key={target.id} className="rounded-[var(--cv-radius-md)] border px-3 py-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <p className="text-sm font-semibold">{target.display_name}</p>
                  <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                    {target.role_label}{target.province_code ? ` · ${target.province_code}` : ''} · {target.preferred_channels.join(', ')}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              <Input label="Nominativo" value={targetForm.display_name} onChange={(event) => setTargetForm((current) => ({ ...current, display_name: event.target.value }))} />
              <Select
                label="Ruolo"
                value={targetForm.role_label}
                onChange={(event) => setTargetForm((current) => ({ ...current, role_label: event.target.value }))}
                options={[
                  { value: 'Responsabile parco regionale', label: 'Responsabile parco regionale' },
                  { value: 'Responsabile parco provinciale', label: 'Responsabile parco provinciale' },
                  { value: 'Supporto operativo', label: 'Supporto operativo' },
                ]}
              />
              <Input label="Provincia" value={targetForm.province_code} onChange={(event) => setTargetForm((current) => ({ ...current, province_code: event.target.value.toUpperCase() }))} placeholder="Vuoto per livello regionale" />
              <Input label="Email" value={targetForm.email} onChange={(event) => setTargetForm((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Telefono / SMS" value={targetForm.phone} onChange={(event) => setTargetForm((current) => ({ ...current, phone: event.target.value }))} />
              <Input label="Whatsapp" value={targetForm.whatsapp} onChange={(event) => setTargetForm((current) => ({ ...current, whatsapp: event.target.value }))} />
              <Select
                label="Canale preferito"
                value={targetForm.preferred_channel}
                onChange={(event) => setTargetForm((current) => ({ ...current, preferred_channel: event.target.value }))}
                options={[
                  { value: 'sistema', label: 'Sistema' },
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'SMS' },
                  { value: 'whatsapp', label: 'Whatsapp' },
                ]}
              />
              <TextareaField label="Note" value={targetForm.note} onChange={(value) => setTargetForm((current) => ({ ...current, note: value }))} />
              <Button type="button" onClick={() => handleCreateTarget().catch((err) => setError(err.message || 'Impossibile salvare il destinatario.'))}>
                Salva destinatario
              </Button>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Rinnovi massivi</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Applica dati comuni su un gruppo mezzi. I numeri di polizza restano modificabili nel fascicolo del singolo mezzo.
              </p>
            </div>

            <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
              <p className="text-sm font-semibold">Assicurazione di gruppo</p>
              <Select label="Gruppo" value={bulkInsuranceForm.group_id} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, group_id: event.target.value }))} options={groupOptions} />
              <Input label="Compagnia" value={bulkInsuranceForm.compagnia} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, compagnia: event.target.value }))} />
              <Input label="Broker / agenzia" value={bulkInsuranceForm.broker} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, broker: event.target.value }))} />
              <Input label="Pacchetto / convenzione" value={bulkInsuranceForm.package_name} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, package_name: event.target.value }))} />
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Copertura dal" type="date" value={bulkInsuranceForm.copertura_dal} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, copertura_dal: event.target.value }))} />
                <Input label="Copertura al" type="date" value={bulkInsuranceForm.copertura_al} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, copertura_al: event.target.value }))} />
              </div>
              <Input label="Scadenza" type="date" value={bulkInsuranceForm.data_scadenza} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, data_scadenza: event.target.value }))} />
              <TextareaField label="Note comuni" value={bulkInsuranceForm.note} onChange={(value) => setBulkInsuranceForm((current) => ({ ...current, note: value }))} />
              <Button type="button" onClick={() => handleBulkInsurance().catch((err) => setError(err.message || 'Impossibile registrare il rinnovo assicurativo.'))}>
                Applica assicurazione al gruppo
              </Button>
            </div>

            <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
              <p className="text-sm font-semibold">Revisione di gruppo</p>
              <Select label="Gruppo" value={bulkRevisionForm.group_id} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, group_id: event.target.value }))} options={groupOptions} />
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Data revisione" type="date" value={bulkRevisionForm.data_revisione} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, data_revisione: event.target.value }))} />
                <Input label="Scadenza revisione" type="date" value={bulkRevisionForm.scadenza_revisione} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, scadenza_revisione: event.target.value }))} />
              </div>
              <Input label="Scadenza verifica sicurezza" type="date" value={bulkRevisionForm.scadenza_verifica_sicurezza} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, scadenza_verifica_sicurezza: event.target.value }))} />
              <Select
                label="Esito / stato"
                value={bulkRevisionForm.esito}
                onChange={(event) => setBulkRevisionForm((current) => ({ ...current, esito: event.target.value }))}
                options={[
                  { value: 'pianificata', label: 'Pianificata' },
                  { value: 'regolare', label: 'Regolare' },
                  { value: 'con_riserva', label: 'Con riserva' },
                ]}
              />
              <TextareaField label="Note comuni" value={bulkRevisionForm.note} onChange={(value) => setBulkRevisionForm((current) => ({ ...current, note: value }))} />
              <Button type="button" onClick={() => handleBulkRevision().catch((err) => setError(err.message || 'Impossibile registrare la revisione di gruppo.'))}>
                Applica revisione al gruppo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {(payload?.items || []).map((vehicle) => (
          <Card key={vehicle.id} padding="md" className="h-full transition-transform hover:-translate-y-0.5">
            <Link href={withAppBasePath(`/fleet/dettaglio?id=${vehicle.id}`)} className="block">
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
              <div className="mt-3 rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] px-3 py-2 text-sm">
                <p className="font-semibold text-[var(--cv-neutral-900)]">{vehicle.compliance_label}</p>
                <p className="mt-1 text-xs text-[var(--cv-neutral-600)]">
                  Assicurazione: {statusText(vehicle.insurance_status)} · Revisione: {statusText(vehicle.revision_status)}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ExpiryBadge label="Assicurazione" value={vehicle.scadenza_assicurazione} />
                <ExpiryBadge label="Revisione" value={vehicle.scadenza_revisione} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    Assegnato a
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                    {vehicle.current_assignment_unit || vehicle.current_assignee || 'Non assegnato'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                    Utilizzatore corrente
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                    {vehicle.current_user_name || vehicle.current_assignee || 'Nessun utilizzo attivo'}
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
              </div>

              <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                <span>{vehicle.localizzazione_corrente || 'Localizzazione non registrata'}</span>
                <span>{vehicle.open_incidents} sinistri aperti</span>
              </div>
            </Link>
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setRecognitionVehicle(vehicle);
                  setRecognitionStep('confirm');
                  setRecognitionResult(null);
                  setRecognitionElapsed(0);
                }}
              >
                Riconosci mezzo
              </Button>
              <Link href={withAppBasePath(`/fleet/dettaglio?id=${vehicle.id}`)} className="inline-flex">
                <Button type="button" size="sm">Dettaglio</Button>
              </Link>
            </div>
          </Card>
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

      <Modal
        isOpen={Boolean(recognitionVehicle)}
        onClose={() => {
          if (recognitionStep === 'running' || recognitionStep === 'applying') return;
          setRecognitionVehicle(null);
          setRecognitionResult(null);
          setRecognitionStep('confirm');
        }}
        title={`Riconoscimento mezzo${recognitionVehicle ? ` - ${recognitionVehicle.targa}` : ''}`}
        description="Il sistema interroga il provider targa, salva l'allestimento nel catalogo e aggiorna il mezzo solo dopo conferma."
        size="lg"
        footer={(
          <>
            <Button
              type="button"
              variant="outline"
              disabled={recognitionStep === 'running' || recognitionStep === 'applying'}
              onClick={() => {
                setRecognitionVehicle(null);
                setRecognitionResult(null);
                setRecognitionStep('confirm');
              }}
            >
              Chiudi
            </Button>
            {recognitionStep === 'confirm' && (
              <Button type="button" onClick={() => startRecognition(false)}>
                Avvia riconoscimento
              </Button>
            )}
            {(recognitionStep === 'result' || recognitionStep === 'empty') && (
              <Button type="button" variant="outline" onClick={() => startRecognition(true)}>
                Riesegui dal provider
              </Button>
            )}
            {recognitionStep === 'result' && recognitionResult?.lookup.trim && (
              <Button type="button" onClick={() => applyRecognition().catch((err) => setError(err.message || 'Aggiornamento mezzo non riuscito.'))}>
                Aggiorna dati mezzo
              </Button>
            )}
          </>
        )}
      >
        {recognitionVehicle && (
          <div className="space-y-4">
            {recognitionStep === 'confirm' && (
              <div className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <p className="text-sm text-[var(--cv-neutral-700)]">
                  Stai per cercare i dati tecnici della targa <strong>{recognitionVehicle.targa}</strong>. Per targhe reali il provider puo consumare un credito.
                </p>
                <p className="mt-2 text-sm text-[var(--cv-neutral-600)]">
                  Se esiste gia un risultato salvato, il sistema usa la cache per non consumare crediti. Dopo il risultato puoi forzare una nuova chiamata con "Riesegui dal provider".
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <span>Attuale: <strong>{recognitionVehicle.marca} {recognitionVehicle.modello}</strong></span>
                  <span>Tipo: <strong>{recognitionVehicle.vehicle_type_name || recognitionVehicle.tipo}</strong></span>
                </div>
              </div>
            )}

            {recognitionStep === 'running' && (
              <div className="rounded-[var(--cv-radius-md)] border p-5 text-center" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-[var(--cv-primary-lighter)] border-t-[var(--cv-primary)]" />
                <p className="font-semibold text-[var(--cv-neutral-900)]">Estrazione dati in corso</p>
                <p className="mt-1 text-sm text-[var(--cv-neutral-600)]">Attendere, il provider puo richiedere fino a 55 secondi.</p>
                <p className="mt-3 text-2xl font-bold text-[var(--cv-primary)]">{recognitionElapsed}s</p>
              </div>
            )}

            {(recognitionStep === 'result' || recognitionStep === 'empty') && (
              <div className="space-y-4">
                {recognitionResult?.lookup.trim ? (
                  <div className="space-y-4">
                    {isCachedProvider(recognitionResult.lookup.provider) && (
                      <NoticeBanner
                        title="Dati recuperati dalla cache"
                        message="Non e stata fatta una nuova chiamata a Targa.co.it. Usa Riesegui dal provider solo se vuoi consumare un credito per aggiornare i dati remoti."
                        tone="success"
                      />
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--cv-neutral-500)]">Marca</p>
                      <p className="font-semibold">{recognitionResult.lookup.trim.model?.brand?.name || '-'}</p>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--cv-neutral-500)]">Modello</p>
                      <p className="font-semibold">{recognitionResult.lookup.trim.model?.name || '-'}</p>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--cv-neutral-500)]">Versione</p>
                      <p className="font-semibold">{recognitionResult.lookup.trim.commercial_name || '-'}</p>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--cv-neutral-500)]">Anno</p>
                      <p className="font-semibold">{recognitionResult.lookup.trim.production_year || '-'}</p>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--cv-neutral-500)]">Alimentazione</p>
                      <p className="font-semibold">{recognitionResult.lookup.trim.engine_type}</p>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] bg-[var(--cv-neutral-100)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--cv-neutral-500)]">Cilindrata / CV</p>
                      <p className="font-semibold">{recognitionResult.lookup.trim.displacement_cc || '-'} cc · {recognitionResult.lookup.trim.horsepower_hp || '-'} CV</p>
                    </div>
                    </div>

                    <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                      <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Assicurazione recuperata dal provider</p>
                      <p className="mt-1 text-sm text-[var(--cv-neutral-700)]">
                        {insuranceRemoteMessage(recognitionResult.insurance_remote)}
                      </p>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                      <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Revisione remota</p>
                      <p className="mt-1 text-sm text-[var(--cv-neutral-700)]">
                        Revisione non reperita dal provider italiano configurato. Il gestionale mostra e mantiene lo storico locale.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                        <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Storico assicurazioni gestionale</p>
                        <div className="mt-2 space-y-2">
                          {recognitionResult.insurance_records.length ? recognitionResult.insurance_records.map((item) => (
                            <div key={item.id} className="text-sm text-[var(--cv-neutral-700)]">
                              <span className="font-semibold">{item.compagnia}</span> · {formatDate(item.data_scadenza)}{item.is_current ? ' · attuale' : ''}
                            </div>
                          )) : <p className="text-sm text-[var(--cv-neutral-600)]">Nessuna assicurazione storicizzata.</p>}
                        </div>
                      </div>
                      <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                        <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Storico revisioni gestionale</p>
                        <div className="mt-2 space-y-2">
                          {recognitionResult.revision_records.length ? recognitionResult.revision_records.map((item) => (
                            <div key={item.id} className="text-sm text-[var(--cv-neutral-700)]">
                              <span className="font-semibold">{formatDate(item.data_revisione)}</span> · {item.esito}{item.km_rilevati ? ` · ${item.km_rilevati.toLocaleString('it-IT')} km` : ''}
                            </div>
                          )) : <p className="text-sm text-[var(--cv-neutral-600)]">Nessuna revisione storicizzata.</p>}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                      <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Log attività API e salvataggi</p>
                      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">
                        {recognitionResult.api_logs.length ? recognitionResult.api_logs.map((item) => (
                          <div key={item.id} className="rounded-[var(--cv-radius-sm)] bg-white px-3 py-2 text-xs text-[var(--cv-neutral-700)]">
                            <p><span className="font-semibold">{item.provider}</span> · {item.lookup_type} · {item.status}</p>
                            {item.error_message && <p className="mt-1 text-[var(--cv-danger)]">{item.error_message}</p>}
                            {item.created_at && <p className="mt-1 text-[var(--cv-neutral-500)]">{new Date(item.created_at).toLocaleString('it-IT')}</p>}
                          </div>
                        )) : <p className="text-sm text-[var(--cv-neutral-600)]">Nessun log API disponibile.</p>}
                      </div>
                    </div>
                    <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                      <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Dati completi recuperati dal provider</p>
                      <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto text-xs sm:grid-cols-2">
                        {providerDisplayFields(recognitionResult.lookup.trim.raw_payload, 100).length ? providerDisplayFields(recognitionResult.lookup.trim.raw_payload, 100).map((item) => (
                          <div key={`${item.label}-${item.value}`} className="rounded-[var(--cv-radius-sm)] bg-white px-3 py-2">
                            <p className="font-semibold text-[var(--cv-neutral-600)]">{item.label}</p>
                            <p className="mt-1 text-[var(--cv-neutral-900)]">{item.value}</p>
                          </div>
                        )) : <p className="text-sm text-[var(--cv-neutral-600)]">Nessun payload esteso disponibile.</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <NoticeBanner
                      title={recognitionEmptyTitle(recognitionResult)}
                      message={recognitionEmptyMessage(recognitionResult)}
                    />
                    <div className="rounded-[var(--cv-radius-md)] border p-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                      <p className="text-sm font-semibold text-[var(--cv-neutral-900)]">Log attivita API</p>
                      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">
                        {recognitionResult?.api_logs.length ? recognitionResult.api_logs.map((item) => (
                          <div key={item.id} className="rounded-[var(--cv-radius-sm)] bg-white px-3 py-2 text-xs text-[var(--cv-neutral-700)]">
                            <p><span className="font-semibold">{item.provider}</span> - {item.lookup_type} - {item.status}{item.http_status ? ` - HTTP ${item.http_status}` : ''}</p>
                            {item.error_message && <p className="mt-1 text-[var(--cv-danger)]">{item.error_message}</p>}
                            {item.created_at && <p className="mt-1 text-[var(--cv-neutral-500)]">{new Date(item.created_at).toLocaleString('it-IT')}</p>}
                          </div>
                        )) : <p className="text-sm text-[var(--cv-neutral-600)]">Nessun log API disponibile.</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {recognitionStep === 'applying' && (
              <NoticeBanner title="Aggiornamento in corso" message="Sto applicando i dati riconosciuti al mezzo." tone="success" />
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        title="Crea gruppo mezzi"
        description="Seleziona i mezzi filtrando per targa, marca, modello o tipologia."
        size="lg"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)}>Annulla</Button>
            <Button
              type="button"
              disabled={!groupForm.name || !groupForm.code || selectedVehicleIds.length === 0}
              onClick={() => handleCreateGroup().catch((err) => setError(err.message || 'Impossibile creare il gruppo.'))}
            >
              Crea gruppo
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nome gruppo" value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Codice gruppo" value={groupForm.code} onChange={(event) => setGroupForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
            <Select
              label="Tipo gruppo"
              value={groupForm.scope}
              onChange={(event) => setGroupForm((current) => ({ ...current, scope: event.target.value }))}
              options={[
                { value: 'operativo', label: 'Operativo' },
                { value: 'aib', label: 'AIB' },
                { value: 'provinciale', label: 'Provinciale' },
                { value: 'speciale', label: 'Speciale' },
              ]}
            />
            <Input label="Provincia" value={groupForm.province_code} onChange={(event) => setGroupForm((current) => ({ ...current, province_code: event.target.value.toUpperCase() }))} placeholder="CS, CZ..." />
          </div>
          <TextareaField label="Descrizione" value={groupForm.description} onChange={(value) => setGroupForm((current) => ({ ...current, description: value }))} />
          <Input label="Cerca mezzi" value={groupVehicleSearch} onChange={(event) => setGroupVehicleSearch(event.target.value)} placeholder="Targa, marca, modello..." />
          <div className="max-h-72 overflow-y-auto rounded-[var(--cv-radius-md)] border" style={{ borderColor: 'var(--cv-border-subtle)' }}>
            {selectableVehicles.map((vehicle) => (
              <label key={vehicle.id} className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <input
                  type="checkbox"
                  checked={selectedVehicleIds.includes(vehicle.id)}
                  onChange={(event) => {
                    setSelectedVehicleIds((current) => (
                      event.target.checked
                        ? [...current, vehicle.id]
                        : current.filter((id) => id !== vehicle.id)
                    ));
                  }}
                />
                <span className="font-semibold">{vehicle.targa}</span>
                <span>{vehicle.marca} {vehicle.modello}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--cv-neutral-600)' }}>{vehicle.stato || 'stato non definito'}</span>
              </label>
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
            Mezzi selezionati: {selectedVehicleIds.length}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(insuranceModalGroup)}
        onClose={() => setInsuranceModalGroup(null)}
        title={`Assicurazione gruppo${insuranceModalGroup ? ` - ${insuranceModalGroup.name}` : ''}`}
        description="Inserisci solo i dati comuni della polizza. Il numero polizza resta nel fascicolo del singolo mezzo."
        size="lg"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setInsuranceModalGroup(null)}>Annulla</Button>
            <Button type="button" onClick={() => handleBulkInsurance().catch((err) => setError(err.message || 'Impossibile registrare il rinnovo assicurativo.'))}>
              Applica al gruppo
            </Button>
          </>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Compagnia" value={bulkInsuranceForm.compagnia} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, compagnia: event.target.value }))} />
          <Input label="Broker / agenzia" value={bulkInsuranceForm.broker} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, broker: event.target.value }))} />
          <Input label="Pacchetto / convenzione" value={bulkInsuranceForm.package_name} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, package_name: event.target.value }))} />
          <Input label="Scadenza" type="date" value={bulkInsuranceForm.data_scadenza} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, data_scadenza: event.target.value }))} />
          <Input label="Copertura dal" type="date" value={bulkInsuranceForm.copertura_dal} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, copertura_dal: event.target.value }))} />
          <Input label="Copertura al" type="date" value={bulkInsuranceForm.copertura_al} onChange={(event) => setBulkInsuranceForm((current) => ({ ...current, copertura_al: event.target.value }))} />
          <div className="md:col-span-2">
            <TextareaField label="Note comuni" value={bulkInsuranceForm.note} onChange={(value) => setBulkInsuranceForm((current) => ({ ...current, note: value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(revisionModalGroup)}
        onClose={() => setRevisionModalGroup(null)}
        title={`Revisione gruppo${revisionModalGroup ? ` - ${revisionModalGroup.name}` : ''}`}
        description="Registra dati comuni della revisione per tutti i mezzi del gruppo selezionato."
        size="lg"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setRevisionModalGroup(null)}>Annulla</Button>
            <Button type="button" onClick={() => handleBulkRevision().catch((err) => setError(err.message || 'Impossibile registrare la revisione di gruppo.'))}>
              Applica al gruppo
            </Button>
          </>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Data revisione" type="date" value={bulkRevisionForm.data_revisione} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, data_revisione: event.target.value }))} />
          <Input label="Scadenza revisione" type="date" value={bulkRevisionForm.scadenza_revisione} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, scadenza_revisione: event.target.value }))} />
          <Input label="Scadenza verifica sicurezza" type="date" value={bulkRevisionForm.scadenza_verifica_sicurezza} onChange={(event) => setBulkRevisionForm((current) => ({ ...current, scadenza_verifica_sicurezza: event.target.value }))} />
          <Select
            label="Esito / stato"
            value={bulkRevisionForm.esito}
            onChange={(event) => setBulkRevisionForm((current) => ({ ...current, esito: event.target.value }))}
            options={[
              { value: 'pianificata', label: 'Pianificata' },
              { value: 'regolare', label: 'Regolare' },
              { value: 'con_riserva', label: 'Con riserva' },
            ]}
          />
          <div className="md:col-span-2">
            <TextareaField label="Note comuni" value={bulkRevisionForm.note} onChange={(value) => setBulkRevisionForm((current) => ({ ...current, note: value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
