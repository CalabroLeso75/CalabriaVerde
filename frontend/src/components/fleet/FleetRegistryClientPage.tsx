'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SectionLead } from '@/components/common/SectionLead';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { api } from '@/lib/api';

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
    loadMeta().catch(() => undefined);
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

  const groupOptions = useMemo(
    () => [{ value: '', label: 'Seleziona gruppo' }, ...groups.map((item) => ({ value: String(item.id), label: `${item.name} (${item.vehicle_count})` }))],
    [groups],
  );

  const handleCreateGroup = async () => {
    await api.post('/fleet/groups', {
      name: groupForm.name,
      code: groupForm.code,
      scope: groupForm.scope,
      province_code: groupForm.province_code || null,
      description: groupForm.description || null,
    });
    setActionMessage('Gruppo mezzi creato correttamente.');
    setGroupForm({ name: '', code: '', scope: 'operativo', province_code: '', description: '' });
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
