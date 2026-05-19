'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { withAppBasePath } from '@/lib/app-path';
import { providerDisplayFields } from '@/lib/provider-payload';

type GroupItem = {
  id: number;
  name: string;
  code: string;
  scope: string;
  province_code?: string | null;
  vehicle_count: number;
};

type EmployeeOption = {
  id: number;
  nome: string;
  cognome: string;
  tipo: string;
  data_nascita?: string | null;
};

type AssignmentUnitOption = {
  id: number;
  code: string;
  name: string;
  type: string;
  province?: string | null;
};

type CommunicationLog = {
  id: number;
  event_type: string;
  channel: string;
  subject: string;
  message: string;
  status: string;
  created_at?: string | null;
  recipients: Array<{
    id: number;
    recipient_label: string;
    channel: string;
    destination?: string | null;
    delivery_status: string;
  }>;
};

type VehicleDetail = {
  id: number;
  targa: string;
  marca: string;
  modello: string;
  tipo: string;
  stato?: string | null;
  km_attuali: number;
  localizzazione_corrente?: string | null;
  immatricolazione_date?: string | null;
  alimentazione?: string | null;
  euro_classe?: string | null;
  colore?: string | null;
  proprieta_tipo?: string | null;
  numero_telaio?: string | null;
  assicurazione_compagnia?: string | null;
  assicurazione_polizza?: string | null;
  scadenza_assicurazione?: string | null;
  assicurazione_copertura?: string | null;
  scadenza_revisione?: string | null;
  ultima_revisione?: string | null;
  scadenza_verifica_sicurezza?: string | null;
  tracker_enabled: boolean;
  note?: string | null;
  trim?: {
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
  } | null;
  vehicle_type?: {
    id: number;
    name: string;
    patente?: string | null;
    revisione?: string | null;
    assicurazione?: string | null;
    tipo_abilitazione?: string | null;
  } | null;
  groups: GroupItem[];
  insurance_records: Array<{
    id: number;
    compagnia: string;
    broker?: string | null;
    package_name?: string | null;
    numero_polizza?: string | null;
    copertura_dal?: string | null;
    copertura_al?: string | null;
    data_scadenza: string;
    is_current: boolean;
    source_type: string;
    note?: string | null;
  }>;
  revisions: Array<{
    id: number;
    data_revisione: string;
    esito: string;
    km_rilevati?: number | null;
    note?: string | null;
  }>;
  assignments: Array<{
    id: number;
    km_iniziali: number;
    km_finali?: number | null;
    assegnato_il?: string | null;
    riconsegnato_il?: string | null;
    documento_assegnazione_numero?: string | null;
    documento_assegnazione_data?: string | null;
    documento_restituzione_numero?: string | null;
    documento_restituzione_data?: string | null;
    stato: string;
    note?: string | null;
    employee_display_name?: string | null;
    user_display_name?: string | null;
    organization_id?: number | null;
    organization_display_name?: string | null;
  }>;
  usage_logs: Array<{
    id: number;
    assignment_id?: number | null;
    started_at: string;
    ended_at?: string | null;
    km_partenza: number;
    km_rientro?: number | null;
    note_presa?: string | null;
    note_rientro?: string | null;
    issue_flags: string[];
    actor_display_name?: string | null;
  }>;
  alerts: Array<{
    id: number;
    alert_type: string;
    severity: string;
    status: string;
    title: string;
    description: string;
    location_text?: string | null;
    province_code?: string | null;
    event_at?: string | null;
    actor_display_name?: string | null;
  }>;
  documents: Array<{
    id: number;
    tipo_documento: string;
    titolo?: string | null;
    numero_documento?: string | null;
    data_rilascio?: string | null;
    data_scadenza?: string | null;
    stato: string;
    note?: string | null;
  }>;
  incidents: Array<{
    id: number;
    data_evento: string;
    data_chiusura?: string | null;
    stato: string;
    tipo?: string | null;
    luogo?: string | null;
    descrizione?: string | null;
    numero_sinistro?: string | null;
    importo_danno?: string | number | null;
    note?: string | null;
  }>;
};

type FleetTab = 'anagrafica' | 'revisioni' | 'assegnazioni' | 'documenti' | 'sinistri' | 'comunicazioni';
type VehicleOperationKind = 'assicurazione' | 'revisione' | 'assegnazione' | 'utilizzo' | 'alert' | 'sinistro' | 'comunicazione';
type ActionModal = 'insurance' | 'revision' | 'assignment' | 'return' | 'extension' | 'km' | null;

type VehicleOperation = {
  id: string;
  kind: VehicleOperationKind;
  title: string;
  dateValue: string;
  summary: string;
  badge: string;
  details: Array<{ label: string; value: string }>;
  note?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('it-IT');
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function deadlineState(value?: string | null) {
  const days = daysUntil(value);
  if (days === null) return 'missing';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'ok';
}

function vehicleOperationalStatus(vehicle: VehicleDetail) {
  const insurance = deadlineState(vehicle.scadenza_assicurazione);
  const revision = deadlineState(vehicle.scadenza_revisione);

  if (insurance === 'missing' && revision === 'missing') return 'Manca copertura assicurativa e revisione';
  if (insurance === 'missing') return revision === 'ok' ? 'Manca copertura assicurativa e revisione ok' : 'Manca copertura assicurativa e revisione da verificare';
  if (revision === 'missing') return insurance === 'ok' ? 'Copertura assicurativa ok e manca revisione' : 'Copertura assicurativa da verificare e manca revisione';
  if (insurance === 'expired' && revision === 'expired') return 'Copertura assicurativa scaduta e revisione scaduta';
  if (insurance === 'expired') return revision === 'ok' ? 'Copertura assicurativa scaduta e revisione ok' : 'Copertura assicurativa scaduta e revisione in scadenza';
  if (revision === 'expired') return insurance === 'ok' ? 'Copertura assicurativa ok e revisione scaduta' : 'Copertura assicurativa in scadenza e revisione scaduta';
  if (insurance === 'expiring' && revision === 'expiring') return 'Copertura assicurativa e revisione in scadenza';
  if (insurance === 'expiring') return revision === 'ok' ? 'Copertura assicurativa in scadenza e revisione ok' : 'Copertura assicurativa in scadenza e revisione da verificare';
  if (revision === 'expiring') return insurance === 'ok' ? 'Copertura assicurativa ok e revisione in scadenza' : 'Copertura assicurativa da verificare e revisione in scadenza';
  return 'Copertura assicurativa ok e revisione ok';
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

export default function FleetDetailClientPage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('id');
  const requestedTab = searchParams.get('tab') as FleetTab | null;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [assignmentUnits, setAssignmentUnits] = useState<AssignmentUnitOption[]>([]);
  const [assignmentUnitSearch, setAssignmentUnitSearch] = useState('');
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<FleetTab>('anagrafica');
  const [expandedOperationId, setExpandedOperationId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal>(null);

  const [groupLinkId, setGroupLinkId] = useState('');
  const [insuranceForm, setInsuranceForm] = useState({
    compagnia: '',
    broker: '',
    package_name: '',
    numero_polizza: '',
    copertura_dal: '',
    copertura_al: '',
    data_scadenza: '',
    note: '',
  });
  const [revisionForm, setRevisionForm] = useState({
    data_revisione: '',
    esito: 'regolare',
    km_rilevati: '',
    scadenza_revisione: '',
    scadenza_verifica_sicurezza: '',
    note: '',
  });
  const [kmUpdateForm, setKmUpdateForm] = useState({
    km_attuali: '',
    note: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    employee_id: '',
    organization_id: '',
    km_iniziali: '',
    assegnato_il: '',
    riconsegnato_il: '',
    documento_assegnazione_numero: '',
    note: '',
    note_responsabile: '',
    note_assegnatario: '',
    stato: 'assegnato',
  });
  const [kmConfirmed, setKmConfirmed] = useState(false);
  const [kmConfirmationNote, setKmConfirmationNote] = useState('');
  const [usageForm, setUsageForm] = useState({
    assignment_id: '',
    employee_id: '',
    km_partenza: '',
    km_rientro: '',
    started_at: '',
    ended_at: '',
    note_presa: '',
    note_rientro: '',
    issue_flags: '',
  });
  const [alertForm, setAlertForm] = useState({
    assignment_id: '',
    employee_id: '',
    alert_type: 'sos',
    severity: 'alta',
    title: '',
    description: '',
    location_text: '',
    province_code: '',
  });
  const [returnForm, setReturnForm] = useState({
    assignment_id: '',
    km_finali: '',
    riconsegnato_il: '',
    documento_restituzione_numero: '',
    documento_restituzione_data: '',
    note: '',
  });
  const [extensionForm, setExtensionForm] = useState({
    assignment_id: '',
    riconsegnato_il: '',
    note: '',
  });

  const loadVehicle = async () => {
    if (!vehicleId) return;
    const [vehiclePayload, groupItems, communicationPayload] = await Promise.all([
      api.get<VehicleDetail>(`/fleet/vehicles/${vehicleId}`),
      api.get<GroupItem[]>('/fleet/groups').catch(() => []),
      api.get<CommunicationLog[]>(`/fleet/vehicles/${vehicleId}/communications`).catch(() => []),
    ]);
    setVehicle(vehiclePayload);
    setGroups(groupItems);
    setCommunications(communicationPayload);
    setError(null);
  };

  useEffect(() => {
    if (!vehicleId) return;
    queueMicrotask(() => {
      loadVehicle().catch((err) => setError(err.message || 'Impossibile caricare il mezzo.'));
    });
  }, [vehicleId]);

  useEffect(() => {
    if (!requestedTab) return;
    if (['anagrafica', 'revisioni', 'assegnazioni', 'documenti', 'sinistri', 'comunicazioni'].includes(requestedTab)) {
      queueMicrotask(() => setTab(requestedTab));
    }
  }, [requestedTab]);

  useEffect(() => {
    if (actionModal !== 'assignment') return;
    const term = employeeSearch.trim();
    if (term.length < 2) {
      queueMicrotask(() => setEmployees([]));
      return;
    }
    let alive = true;
    const params = new URLSearchParams({ tipo: 'interno', page: '1', page_size: '20', search: term });
    api.get<{ items: EmployeeOption[] }>(`/hr/employees?${params.toString()}`)
      .then((response) => {
        if (alive) setEmployees(response.items || []);
      })
      .catch(() => {
        if (alive) setEmployees([]);
      });
    return () => {
      alive = false;
    };
  }, [actionModal, employeeSearch]);

  useEffect(() => {
    if (actionModal !== 'assignment') return;
    let alive = true;
    const params = new URLSearchParams();
    if (assignmentUnitSearch.trim()) params.set('search', assignmentUnitSearch.trim());
    api.get<AssignmentUnitOption[]>(`/fleet/assignment-units?${params.toString()}`)
      .then((response) => {
        if (alive) setAssignmentUnits(response);
      })
      .catch(() => {
        if (alive) setAssignmentUnits([]);
      });
    return () => {
      alive = false;
    };
  }, [actionModal, assignmentUnitSearch]);

  const availableGroups = useMemo(
    () => groups.filter((group) => !vehicle?.groups.some((item) => item.id === group.id)),
    [groups, vehicle],
  );

  const employeeOptions = useMemo(
    () => [
      { value: '', label: employeeSearch.trim().length < 2 ? 'Digita almeno 2 caratteri' : 'Seleziona operatore' },
      ...employees.map((item) => ({
        value: String(item.id),
        label: `${item.cognome} ${item.nome}${item.data_nascita ? ` - nato il ${formatDate(item.data_nascita)}` : ''}`,
      })),
    ],
    [employeeSearch, employees],
  );

  const assignmentUnitOptions = useMemo(
    () => [
      { value: '', label: 'Nessun reparto/sede' },
      ...assignmentUnits.map((item) => ({
        value: String(item.id),
        label: `${item.name} (${item.code})${item.province ? ` - ${item.province}` : ''}`,
      })),
    ],
    [assignmentUnits],
  );

  const kmDelta = useMemo(
    () => Number(assignmentForm.km_iniziali || vehicle?.km_attuali || 0) - Number(vehicle?.km_attuali || 0),
    [assignmentForm.km_iniziali, vehicle],
  );
  const needsKmConfirmation = actionModal === 'assignment' && kmDelta !== 0;

  const assignmentOptions = useMemo(
    () => [{ value: '', label: 'Seleziona assegnazione' }, ...(vehicle?.assignments || []).map((item) => ({ value: String(item.id), label: `${item.employee_display_name || item.user_display_name || 'Operatore'} - ${item.stato}` }))],
    [vehicle],
  );

  const activeAssignments = useMemo(
    () => (vehicle?.assignments || []).filter((item) => !item.riconsegnato_il),
    [vehicle],
  );
  const isAssigned = activeAssignments.length > 0;
  const operationalStatus = vehicle ? vehicleOperationalStatus(vehicle) : '-';
  const providerTechnicalFields = useMemo(() => {
    if (!vehicle?.trim) return [];
    return [
      { label: 'Versione', value: vehicle.trim.commercial_name || '-' },
      { label: 'Codice motore', value: vehicle.trim.engine_code || '-' },
      { label: 'Cilindrata', value: vehicle.trim.displacement_cc ? `${vehicle.trim.displacement_cc} cc` : '-' },
      { label: 'Potenza', value: vehicle.trim.horsepower_hp ? `${vehicle.trim.horsepower_hp} CV` : '-' },
      { label: 'Porte', value: vehicle.trim.doors ? String(vehicle.trim.doors) : '-' },
      { label: 'Posti', value: vehicle.trim.seats ? String(vehicle.trim.seats) : '-' },
      { label: 'CO2', value: vehicle.trim.co2_g_km ? `${vehicle.trim.co2_g_km} g/km` : '-' },
      { label: 'Fonte', value: vehicle.trim.source || '-' },
      ...providerDisplayFields(vehicle.trim.raw_payload),
    ];
  }, [vehicle]);

  const submitInsurance = async () => {
    if (!vehicle) return;
    await api.post(`/fleet/vehicles/${vehicle.id}/insurance`, {
      compagnia: insuranceForm.compagnia,
      broker: insuranceForm.broker || null,
      package_name: insuranceForm.package_name || null,
      numero_polizza: insuranceForm.numero_polizza || null,
      copertura_dal: insuranceForm.copertura_dal || null,
      copertura_al: insuranceForm.copertura_al || null,
      data_scadenza: insuranceForm.data_scadenza,
      note: insuranceForm.note || null,
    });
    setSuccess('Assicurazione del mezzo aggiornata.');
    setActionModal(null);
    setInsuranceForm({ compagnia: '', broker: '', package_name: '', numero_polizza: '', copertura_dal: '', copertura_al: '', data_scadenza: '', note: '' });
    await loadVehicle();
  };

  const submitRevision = async () => {
    if (!vehicle) return;
    await api.post(`/fleet/vehicles/${vehicle.id}/revision`, {
      data_revisione: revisionForm.data_revisione,
      esito: revisionForm.esito,
      km_rilevati: revisionForm.km_rilevati ? Number(revisionForm.km_rilevati) : null,
      scadenza_revisione: revisionForm.scadenza_revisione || null,
      scadenza_verifica_sicurezza: revisionForm.scadenza_verifica_sicurezza || null,
      note: revisionForm.note || null,
    });
    setSuccess('Revisione del mezzo registrata.');
    setActionModal(null);
    setRevisionForm({ data_revisione: '', esito: 'regolare', km_rilevati: '', scadenza_revisione: '', scadenza_verifica_sicurezza: '', note: '' });
    await loadVehicle();
  };

  const submitKmUpdate = async () => {
    if (!vehicle) return;
    await api.patch(`/fleet/vehicles/${vehicle.id}/km`, {
      km_attuali: Number(kmUpdateForm.km_attuali),
      note: kmUpdateForm.note || null,
    });
    setSuccess('Chilometraggio del mezzo aggiornato.');
    setActionModal(null);
    setKmUpdateForm({ km_attuali: '', note: '' });
    await loadVehicle();
  };

  const submitAssignment = async () => {
    if (!vehicle) return;
    if (needsKmConfirmation && !kmConfirmed) return;
    const noteParts = [
      assignmentForm.note || null,
      needsKmConfirmation
        ? `Conferma km contachilometri: scostamento ${Math.abs(kmDelta).toLocaleString('it-IT')} km ${kmDelta > 0 ? 'in piu' : 'in meno'} rispetto all'ultima registrazione. ${kmConfirmationNote || ''}`.trim()
        : null,
    ].filter(Boolean);
    await api.post(`/fleet/vehicles/${vehicle.id}/assignments`, {
      employee_id: assignmentForm.employee_id ? Number(assignmentForm.employee_id) : null,
      organization_id: assignmentForm.organization_id ? Number(assignmentForm.organization_id) : null,
      km_iniziali: Number(assignmentForm.km_iniziali || vehicle.km_attuali || 0),
      assegnato_il: assignmentForm.assegnato_il || null,
      riconsegnato_il: assignmentForm.riconsegnato_il || null,
      documento_assegnazione_numero: null,
      note: noteParts.join('\n') || null,
      note_responsabile: assignmentForm.note_responsabile || null,
      note_assegnatario: assignmentForm.note_assegnatario || null,
      stato: assignmentForm.stato,
    });
    setSuccess('Mezzo assegnato e comunicazione ufficiale registrata.');
    setActionModal(null);
    setAssignmentForm({
      employee_id: '',
      organization_id: '',
      km_iniziali: '',
      assegnato_il: '',
      riconsegnato_il: '',
      documento_assegnazione_numero: '',
      note: '',
      note_responsabile: '',
      note_assegnatario: '',
      stato: 'assegnato',
    });
    setEmployeeSearch('');
    setAssignmentUnitSearch('');
    setKmConfirmed(false);
    setKmConfirmationNote('');
    await loadVehicle();
  };

  const submitExtension = async () => {
    await api.patch(`/fleet/assignments/${extensionForm.assignment_id}/extend`, {
      riconsegnato_il: extensionForm.riconsegnato_il,
      note: extensionForm.note || null,
    });
    setSuccess('Proroga assegnazione registrata e comunicazione ufficiale creata.');
    setActionModal(null);
    setExtensionForm({ assignment_id: '', riconsegnato_il: '', note: '' });
    await loadVehicle();
  };

  const submitReturn = async () => {
    await api.patch(`/fleet/assignments/${returnForm.assignment_id}/return`, {
      km_finali: Number(returnForm.km_finali),
      riconsegnato_il: returnForm.riconsegnato_il || null,
      documento_restituzione_numero: returnForm.documento_restituzione_numero || null,
      documento_restituzione_data: returnForm.documento_restituzione_data || null,
      note: returnForm.note || null,
      stato: 'restituito',
    });
    setSuccess('Restituzione mezzo registrata.');
    setActionModal(null);
    setReturnForm({ assignment_id: '', km_finali: '', riconsegnato_il: '', documento_restituzione_numero: '', documento_restituzione_data: '', note: '' });
    await loadVehicle();
  };

  const operations = useMemo<VehicleOperation[]>(() => {
    if (!vehicle) return [];

    const insuranceOps: VehicleOperation[] = vehicle.insurance_records.map((record) => ({
      id: `insurance-${record.id}`,
      kind: 'assicurazione',
      title: `Copertura ${record.compagnia}`,
      dateValue: record.data_scadenza,
      summary: `Scadenza assicurazione ${formatDate(record.data_scadenza)}`,
      badge: 'Assicurazione',
      details: [
        { label: 'Compagnia', value: record.compagnia },
        { label: 'Polizza', value: record.numero_polizza || '-' },
        { label: 'Scadenza', value: formatDate(record.data_scadenza) },
        { label: 'Copertura fino al', value: formatDate(record.copertura_al) },
      ],
      note: record.note,
    }));

    const revisionOps: VehicleOperation[] = vehicle.revisions.map((revision) => ({
      id: `revision-${revision.id}`,
      kind: 'revisione',
      title: `Revisione del ${formatDate(revision.data_revisione)}`,
      dateValue: revision.data_revisione,
      summary: `${revision.esito} - km ${revision.km_rilevati?.toLocaleString('it-IT') || '-'}`,
      badge: 'Revisione',
      details: [
        { label: 'Data revisione', value: formatDate(revision.data_revisione) },
        { label: 'Esito', value: revision.esito },
        { label: 'Km rilevati', value: revision.km_rilevati?.toLocaleString('it-IT') || '-' },
      ],
      note: revision.note,
    }));

    const assignmentOps: VehicleOperation[] = vehicle.assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      kind: 'assegnazione',
      title: `Assegnazione a ${assignment.organization_display_name || assignment.employee_display_name || assignment.user_display_name || 'Operatore'}`,
      dateValue: assignment.assegnato_il || '',
      summary: `${assignment.stato} - dal ${formatDateTime(assignment.assegnato_il)}`,
      badge: 'Assegnazione',
      details: [
        { label: 'Operatore', value: assignment.employee_display_name || assignment.user_display_name || '-' },
        { label: 'Km iniziali', value: assignment.km_iniziali.toLocaleString('it-IT') },
        { label: 'Documento assegnazione', value: assignment.documento_assegnazione_numero || '-' },
        { label: 'Restituito il', value: formatDateTime(assignment.riconsegnato_il) },
        { label: 'Documento restituzione', value: assignment.documento_restituzione_numero || '-' },
      ],
      note: assignment.note,
    }));

    const usageOps: VehicleOperation[] = vehicle.usage_logs.map((usage) => ({
      id: `usage-${usage.id}`,
      kind: 'utilizzo',
      title: `Utilizzo mezzo - ${usage.actor_display_name || 'Operatore'}`,
      dateValue: usage.started_at,
      summary: `${usage.km_partenza.toLocaleString('it-IT')} km partenza - ${formatDateTime(usage.started_at)}`,
      badge: 'Utilizzo',
      details: [
        { label: 'Operatore', value: usage.actor_display_name || '-' },
        { label: 'Km partenza', value: usage.km_partenza.toLocaleString('it-IT') },
        { label: 'Km rientro', value: usage.km_rientro?.toLocaleString('it-IT') || '-' },
        { label: 'Inizio', value: formatDateTime(usage.started_at) },
        { label: 'Fine', value: formatDateTime(usage.ended_at) },
        { label: 'Problemi rilevati', value: usage.issue_flags.length > 0 ? usage.issue_flags.join(', ') : '-' },
      ],
      note: [usage.note_presa ? `Presa: ${usage.note_presa}` : null, usage.note_rientro ? `Rientro: ${usage.note_rientro}` : null].filter(Boolean).join(' - '),
    }));

    const alertOps: VehicleOperation[] = vehicle.alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      kind: 'alert',
      title: `${alert.alert_type.toUpperCase()} - ${alert.title}`,
      dateValue: alert.event_at || '',
      summary: `${alert.severity} - ${alert.status}`,
      badge: 'Alert',
      details: [
        { label: 'Tipo', value: alert.alert_type },
        { label: 'Gravità', value: alert.severity },
        { label: 'Provincia', value: alert.province_code || '-' },
        { label: 'Luogo', value: alert.location_text || '-' },
        { label: 'Operatore', value: alert.actor_display_name || '-' },
      ],
      note: alert.description,
    }));

    const incidentOps: VehicleOperation[] = vehicle.incidents.map((incident) => ({
      id: `incident-${incident.id}`,
      kind: 'sinistro',
      title: incident.tipo || 'Sinistro',
      dateValue: incident.data_evento,
      summary: `${incident.stato} - ${incident.luogo || 'luogo non indicato'}`,
      badge: 'Sinistro',
      details: [
        { label: 'Data evento', value: formatDate(incident.data_evento) },
        { label: 'Numero sinistro', value: incident.numero_sinistro || '-' },
        { label: 'Stato', value: incident.stato },
        { label: 'Luogo', value: incident.luogo || '-' },
      ],
      note: incident.descrizione || incident.note,
    }));

    const communicationOps: VehicleOperation[] = communications.map((item) => ({
      id: `communication-${item.id}`,
      kind: 'comunicazione',
      title: item.subject,
      dateValue: item.created_at || '',
      summary: `${item.event_type} - ${item.channel} - ${item.status}`,
      badge: 'Comunicazione',
      details: [
        { label: 'Canale', value: item.channel },
        { label: 'Evento', value: item.event_type },
        { label: 'Stato', value: item.status },
        { label: 'Destinatari', value: item.recipients.length ? item.recipients.map((recipient) => recipient.recipient_label).join(', ') : '-' },
      ],
      note: item.message,
    }));

    return [...insuranceOps, ...revisionOps, ...assignmentOps, ...usageOps, ...alertOps, ...incidentOps, ...communicationOps]
      .sort((left, right) => new Date(right.dateValue || 0).getTime() - new Date(left.dateValue || 0).getTime());
  }, [communications, vehicle]);

  const tabs = useMemo(() => ([
    { id: 'anagrafica', label: 'Anagrafica' },
    { id: 'revisioni', label: 'Coperture e revisioni' },
    { id: 'assegnazioni', label: 'Assegnazioni e utilizzi' },
    { id: 'documenti', label: 'Documenti' },
    { id: 'sinistri', label: 'SOS, alert e sinistri' },
    { id: 'comunicazioni', label: 'Comunicazioni ufficiali' },
  ]), []);

  if (!vehicleId) {
    return <NoticeBanner title="Mezzo non selezionato" message="Apri il dettaglio partendo dall'anagrafica mezzi." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <Link href={withAppBasePath('/fleet/anagrafica')} className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
          Torna all&apos;anagrafica
        </Link>
      </div>

      {error && <NoticeBanner title="Errore caricamento" message={error} />}
      {success && <NoticeBanner title="Operazione completata" message={success} tone="success" />}

      {vehicle && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setActionModal('insurance')}>
              Aggiungi assicurazione
            </Button>
            <Button type="button" variant="outline" onClick={() => setActionModal('revision')}>
              Aggiungi revisione
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setKmUpdateForm({ km_attuali: String(vehicle.km_attuali || 0), note: '' });
                setActionModal('km');
              }}
            >
              Aggiorna km
            </Button>
            {!isAssigned ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignmentForm((current) => ({ ...current, km_iniziali: String(vehicle.km_attuali || 0) }));
                  setEmployeeSearch('');
                  setAssignmentUnitSearch('');
                  setKmConfirmed(false);
                  setKmConfirmationNote('');
                  setActionModal('assignment');
                }}
              >
                Assegna mezzo
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const active = activeAssignments[0];
                  setReturnForm((current) => ({
                    ...current,
                    assignment_id: String(active.id),
                    km_finali: String(vehicle.km_attuali || active.km_iniziali || 0),
                  }));
                  setActionModal('return');
                }}
              >
                Restituisci mezzo
              </Button>
            )}
          </div>

          <Card padding="md">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Mezzo
                </p>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  {vehicle.marca} {vehicle.modello}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  {vehicle.targa} - {vehicle.vehicle_type?.name || vehicle.tipo}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Stato
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>
                  {operationalStatus}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Km attuali
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                  {vehicle.km_attuali.toLocaleString('it-IT')}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Localizzazione
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                  {vehicle.localizzazione_corrente || 'Non registrata'}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Tracker
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                  {vehicle.tracker_enabled ? 'Attivo' : 'Pronto per attivazione API'}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-[var(--cv-radius-md)] border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: tab === item.id ? 'var(--cv-primary)' : 'var(--cv-border-subtle)',
                  background: tab === item.id ? 'var(--cv-primary-lighter)' : 'white',
                  color: tab === item.id ? 'var(--cv-primary-dark)' : 'var(--cv-neutral-700)',
                }}
                onClick={() => setTab(item.id as FleetTab)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'anagrafica' && (
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Card padding="md">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Info label="Immatricolazione" value={formatDate(vehicle.immatricolazione_date)} />
                  <Info label="Telaio" value={vehicle.numero_telaio || '-'} />
                  <Info label="Alimentazione" value={vehicle.alimentazione || '-'} />
                  <Info label="Classe euro" value={vehicle.euro_classe || '-'} />
                  <Info label="Colore" value={vehicle.colore || '-'} />
                  <Info label="Proprieta'" value={vehicle.proprieta_tipo || '-'} />
                  <Info label="Patente richiesta" value={vehicle.vehicle_type?.patente || '-'} />
                  <Info label="Abilitazione" value={vehicle.vehicle_type?.tipo_abilitazione || '-'} />
                  <Info label="Note" value={vehicle.note || '-'} />
                </div>
              </Card>

              {vehicle.trim && (
                <Card padding="md" className="xl:col-span-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dati tecnici provider</h3>
                    <div className="grid max-h-96 gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-4">
                      {providerTechnicalFields.length ? providerTechnicalFields.map((item) => (
                        <Info key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
                      )) : <p className="text-sm text-[var(--cv-neutral-600)]">Nessun payload esteso disponibile.</p>}
                    </div>
                  </div>
                </Card>
              )}

              <Card padding="md">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Gruppi operativi</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                      Un mezzo può appartenere a più gruppi. I rinnovi massivi e le campagne operative usano queste appartenenze.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {vehicle.groups.map((group) => (
                      <div key={group.id} className="rounded-[var(--cv-radius-md)] border px-3 py-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{group.name}</p>
                            <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                              {group.code} - {group.scope}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-xs font-semibold"
                            style={{ color: 'var(--cv-danger)' }}
                            onClick={() => {
                              api.delete(`/fleet/groups/${group.id}/vehicles/${vehicle.id}`)
                                .then(async () => {
                                  setSuccess('Mezzo rimosso dal gruppo operativo.');
                                  await loadVehicle();
                                })
                                .catch((err) => setError(err.message || 'Impossibile rimuovere il mezzo dal gruppo.'));
                            }}
                          >
                            Rimuovi
                          </button>
                        </div>
                      </div>
                    ))}
                    {vehicle.groups.length === 0 && (
                      <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun gruppo assegnato al mezzo.</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Select
                      label="Aggiungi a gruppo"
                      value={groupLinkId}
                      onChange={(event) => setGroupLinkId(event.target.value)}
                      options={[
                        { value: '', label: 'Seleziona gruppo' },
                        ...availableGroups.map((group) => ({ value: String(group.id), label: `${group.name} (${group.code})` })),
                      ]}
                    />
                    <Button
                      type="button"
                      disabled={!groupLinkId}
                      onClick={() => {
                        api.post(`/fleet/groups/${groupLinkId}/vehicles/${vehicle.id}`, {})
                          .then(async () => {
                            setSuccess('Mezzo aggiunto al gruppo operativo.');
                            setGroupLinkId('');
                            await loadVehicle();
                          })
                          .catch((err) => setError(err.message || 'Impossibile collegare il gruppo al mezzo.'));
                      }}
                    >
                      Collega gruppo
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === 'revisioni' && (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card padding="md">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Coperture assicurative</h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Info label="Compagnia" value={vehicle.assicurazione_compagnia || '-'} />
                      <Info label="Numero di polizza" value={vehicle.assicurazione_polizza || '-'} />
                      <Info label="Scadenza assicurazione" value={formatDate(vehicle.scadenza_assicurazione)} />
                      <Info label="Copertura fino al" value={formatDate(vehicle.assicurazione_copertura)} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Storico revisioni</h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Info label="Ultima revisione" value={formatDate(vehicle.ultima_revisione)} />
                      <Info label="Scadenza revisione" value={formatDate(vehicle.scadenza_revisione)} />
                      <Info label="Verifica sicurezza" value={formatDate(vehicle.scadenza_verifica_sicurezza)} />
                      <Info label="Km attuali" value={vehicle.km_attuali.toLocaleString('it-IT')} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {vehicle.revisions.length === 0 && (
                        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna revisione registrata.</p>
                      )}
                      {vehicle.revisions.map((revision) => (
                        <div key={revision.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">Revisione del {formatDate(revision.data_revisione)}</p>
                            <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>{revision.esito}</span>
                          </div>
                          <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                            Km rilevati: {revision.km_rilevati?.toLocaleString('it-IT') || '-'}
                          </p>
                          {revision.note ? <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{revision.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="space-y-6">
                  <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <h3 className="text-lg font-semibold">Registra assicurazione mezzo</h3>
                    <Input label="Compagnia" value={insuranceForm.compagnia} onChange={(event) => setInsuranceForm((current) => ({ ...current, compagnia: event.target.value }))} />
                    <Input label="Broker / agenzia" value={insuranceForm.broker} onChange={(event) => setInsuranceForm((current) => ({ ...current, broker: event.target.value }))} />
                    <Input label="Pacchetto / convenzione" value={insuranceForm.package_name} onChange={(event) => setInsuranceForm((current) => ({ ...current, package_name: event.target.value }))} />
                    <Input label="Numero polizza mezzo" value={insuranceForm.numero_polizza} onChange={(event) => setInsuranceForm((current) => ({ ...current, numero_polizza: event.target.value }))} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Copertura dal" type="date" value={insuranceForm.copertura_dal} onChange={(event) => setInsuranceForm((current) => ({ ...current, copertura_dal: event.target.value }))} />
                      <Input label="Copertura al" type="date" value={insuranceForm.copertura_al} onChange={(event) => setInsuranceForm((current) => ({ ...current, copertura_al: event.target.value }))} />
                    </div>
                    <Input label="Scadenza assicurazione" type="date" value={insuranceForm.data_scadenza} onChange={(event) => setInsuranceForm((current) => ({ ...current, data_scadenza: event.target.value }))} />
                    <TextareaField label="Note" value={insuranceForm.note} onChange={(value) => setInsuranceForm((current) => ({ ...current, note: value }))} />
                    <Button
                      type="button"
                      onClick={() => {
                        api.post(`/fleet/vehicles/${vehicle.id}/insurance`, {
                          compagnia: insuranceForm.compagnia,
                          broker: insuranceForm.broker || null,
                          package_name: insuranceForm.package_name || null,
                          numero_polizza: insuranceForm.numero_polizza || null,
                          copertura_dal: insuranceForm.copertura_dal || null,
                          copertura_al: insuranceForm.copertura_al || null,
                          data_scadenza: insuranceForm.data_scadenza,
                          note: insuranceForm.note || null,
                        })
                          .then(async () => {
                            setSuccess('Assicurazione del mezzo aggiornata.');
                            setInsuranceForm({ compagnia: '', broker: '', package_name: '', numero_polizza: '', copertura_dal: '', copertura_al: '', data_scadenza: '', note: '' });
                            await loadVehicle();
                          })
                          .catch((err) => setError(err.message || 'Impossibile salvare i dati assicurativi.'));
                      }}
                    >
                      Salva assicurazione
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <h3 className="text-lg font-semibold">Registra revisione mezzo</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Data revisione" type="date" value={revisionForm.data_revisione} onChange={(event) => setRevisionForm((current) => ({ ...current, data_revisione: event.target.value }))} />
                      <Input label="Km rilevati" type="number" value={revisionForm.km_rilevati} onChange={(event) => setRevisionForm((current) => ({ ...current, km_rilevati: event.target.value }))} />
                    </div>
                    <Select
                      label="Esito"
                      value={revisionForm.esito}
                      onChange={(event) => setRevisionForm((current) => ({ ...current, esito: event.target.value }))}
                      options={[
                        { value: 'regolare', label: 'Regolare' },
                        { value: 'con_riserva', label: 'Con riserva' },
                        { value: 'non_superata', label: 'Non superata' },
                      ]}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Scadenza revisione" type="date" value={revisionForm.scadenza_revisione} onChange={(event) => setRevisionForm((current) => ({ ...current, scadenza_revisione: event.target.value }))} />
                      <Input label="Verifica sicurezza" type="date" value={revisionForm.scadenza_verifica_sicurezza} onChange={(event) => setRevisionForm((current) => ({ ...current, scadenza_verifica_sicurezza: event.target.value }))} />
                    </div>
                    <TextareaField label="Note" value={revisionForm.note} onChange={(value) => setRevisionForm((current) => ({ ...current, note: value }))} />
                    <Button
                      type="button"
                      onClick={() => {
                        api.post(`/fleet/vehicles/${vehicle.id}/revision`, {
                          data_revisione: revisionForm.data_revisione,
                          esito: revisionForm.esito,
                          km_rilevati: revisionForm.km_rilevati ? Number(revisionForm.km_rilevati) : null,
                          scadenza_revisione: revisionForm.scadenza_revisione || null,
                          scadenza_verifica_sicurezza: revisionForm.scadenza_verifica_sicurezza || null,
                          note: revisionForm.note || null,
                        })
                          .then(async () => {
                            setSuccess('Revisione del mezzo registrata.');
                            setRevisionForm({ data_revisione: '', esito: 'regolare', km_rilevati: '', scadenza_revisione: '', scadenza_verifica_sicurezza: '', note: '' });
                            await loadVehicle();
                          })
                          .catch((err) => setError(err.message || 'Impossibile registrare la revisione.'));
                      }}
                    >
                      Salva revisione
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === 'assegnazioni' && (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card padding="md">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Assegnazioni mezzo</h3>
                    <div className="mt-3 space-y-3">
                      {vehicle.assignments.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna assegnazione registrata.</p>}
                      {vehicle.assignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{assignment.organization_display_name || assignment.employee_display_name || assignment.user_display_name || 'Assegnatario non definito'}</p>
                            <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>{assignment.stato}</span>
                          </div>
                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            <Info label="Assegnato il" value={formatDateTime(assignment.assegnato_il)} />
                            <Info label="Riconsegnato il" value={formatDateTime(assignment.riconsegnato_il)} />
                            <Info label="Documento assegnazione" value={assignment.documento_assegnazione_numero || '-'} />
                            <Info label="Assegnatario persona" value={assignment.employee_display_name || '---'} />
                            <Info label="Assegnatario reparto/sede" value={assignment.organization_display_name || '---'} />
                            <Info label="Km iniziali" value={assignment.km_iniziali.toLocaleString('it-IT')} />
                            <Info label="Documento restituzione" value={assignment.documento_restituzione_numero || '-'} />
                            <Info label="Km finali" value={assignment.km_finali?.toLocaleString('it-IT') || '-'} />
                          </div>
                          {assignment.note ? <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{assignment.note}</p> : null}
                          {!assignment.riconsegnato_il ? (
                            <>
                            <button
                              type="button"
                              className="mt-3 text-sm font-medium"
                              style={{ color: 'var(--cv-primary)' }}
                              onClick={() => {
                                setReturnForm({
                                  assignment_id: String(assignment.id),
                                  km_finali: assignment.km_finali ? String(assignment.km_finali) : '',
                                  riconsegnato_il: '',
                                  documento_restituzione_numero: assignment.documento_restituzione_numero || '',
                                  documento_restituzione_data: assignment.documento_restituzione_data || '',
                                  note: '',
                                });
                                setActionModal('return');
                              }}
                            >
                              Apri restituzione mezzo
                            </button>
                            <button
                              type="button"
                              className="mt-3 ml-4 text-sm font-medium"
                              style={{ color: 'var(--cv-primary)' }}
                              onClick={() => {
                                setExtensionForm({
                                  assignment_id: String(assignment.id),
                                  riconsegnato_il: assignment.riconsegnato_il || '',
                                  note: '',
                                });
                                setActionModal('extension');
                              }}
                            >
                              Proroga consegna
                            </button>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Utilizzi registrati</h3>
                    <div className="mt-3 space-y-3">
                      {vehicle.usage_logs.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun utilizzo registrato.</p>}
                      {vehicle.usage_logs.map((usage) => (
                        <div key={usage.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{usage.actor_display_name || 'Operatore'}</p>
                            <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>{formatDateTime(usage.started_at)}</span>
                          </div>
                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            <Info label="Km partenza" value={usage.km_partenza.toLocaleString('it-IT')} />
                            <Info label="Km rientro" value={usage.km_rientro?.toLocaleString('it-IT') || '-'} />
                            <Info label="Inizio utilizzo" value={formatDateTime(usage.started_at)} />
                            <Info label="Fine utilizzo" value={formatDateTime(usage.ended_at)} />
                          </div>
                          {usage.note_presa ? <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Presa: {usage.note_presa}</p> : null}
                          {usage.note_rientro ? <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Rientro: {usage.note_rientro}</p> : null}
                          {usage.issue_flags.length > 0 ? <p className="mt-1 text-sm" style={{ color: 'var(--cv-warning)' }}>Segnalazioni: {usage.issue_flags.join(', ')}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="space-y-6">
                  <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <h3 className="text-lg font-semibold">Nuova assegnazione</h3>
                    <Select label="Operatore" value={assignmentForm.employee_id} onChange={(event) => setAssignmentForm((current) => ({ ...current, employee_id: event.target.value }))} options={employeeOptions} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Km iniziali" type="number" value={assignmentForm.km_iniziali} onChange={(event) => setAssignmentForm((current) => ({ ...current, km_iniziali: event.target.value }))} />
                      <Select
                        label="Stato assegnazione"
                        value={assignmentForm.stato}
                        onChange={(event) => setAssignmentForm((current) => ({ ...current, stato: event.target.value }))}
                        options={[
                          { value: 'assegnato', label: 'Assegnato' },
                          { value: 'temporaneo', label: 'Temporaneo' },
                          { value: 'indefinito', label: 'Tempo indefinito' },
                        ]}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Assegnato il" type="datetime-local" value={assignmentForm.assegnato_il} onChange={(event) => setAssignmentForm((current) => ({ ...current, assegnato_il: event.target.value }))} />
                      <Input label="Riconsegnato il" type="datetime-local" value={assignmentForm.riconsegnato_il} onChange={(event) => setAssignmentForm((current) => ({ ...current, riconsegnato_il: event.target.value }))} />
                    </div>
                    <Input label="Documento assegnazione" value={assignmentForm.documento_assegnazione_numero} onChange={(event) => setAssignmentForm((current) => ({ ...current, documento_assegnazione_numero: event.target.value }))} />
                    <TextareaField label="Note assegnazione" value={assignmentForm.note} onChange={(value) => setAssignmentForm((current) => ({ ...current, note: value }))} />
                    <Button
                      type="button"
                      onClick={() => {
                        api.post(`/fleet/vehicles/${vehicle.id}/assignments`, {
                          employee_id: assignmentForm.employee_id ? Number(assignmentForm.employee_id) : null,
                          km_iniziali: Number(assignmentForm.km_iniziali),
                          assegnato_il: assignmentForm.assegnato_il || null,
                          riconsegnato_il: assignmentForm.riconsegnato_il || null,
                          documento_assegnazione_numero: assignmentForm.documento_assegnazione_numero || null,
                          note: assignmentForm.note || null,
                          stato: assignmentForm.stato,
                        })
                          .then(async () => {
                            setSuccess('Assegnazione del mezzo registrata.');
                            setAssignmentForm({ employee_id: '', organization_id: '', km_iniziali: '', assegnato_il: '', riconsegnato_il: '', documento_assegnazione_numero: '', note: '', note_responsabile: '', note_assegnatario: '', stato: 'assegnato' });
                            await loadVehicle();
                          })
                          .catch((err) => setError(err.message || 'Impossibile registrare l’assegnazione.'));
                      }}
                    >
                      Salva assegnazione
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <h3 className="text-lg font-semibold">Registra utilizzo</h3>
                    <Select label="Assegnazione" value={usageForm.assignment_id} onChange={(event) => setUsageForm((current) => ({ ...current, assignment_id: event.target.value }))} options={assignmentOptions} />
                    <Select label="Operatore" value={usageForm.employee_id} onChange={(event) => setUsageForm((current) => ({ ...current, employee_id: event.target.value }))} options={employeeOptions} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Km partenza" type="number" value={usageForm.km_partenza} onChange={(event) => setUsageForm((current) => ({ ...current, km_partenza: event.target.value }))} />
                      <Input label="Km rientro" type="number" value={usageForm.km_rientro} onChange={(event) => setUsageForm((current) => ({ ...current, km_rientro: event.target.value }))} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Partenza" type="datetime-local" value={usageForm.started_at} onChange={(event) => setUsageForm((current) => ({ ...current, started_at: event.target.value }))} />
                      <Input label="Rientro" type="datetime-local" value={usageForm.ended_at} onChange={(event) => setUsageForm((current) => ({ ...current, ended_at: event.target.value }))} />
                    </div>
                    <TextareaField label="Note presa mezzo" value={usageForm.note_presa} onChange={(value) => setUsageForm((current) => ({ ...current, note_presa: value }))} />
                    <TextareaField label="Note rientro mezzo" value={usageForm.note_rientro} onChange={(value) => setUsageForm((current) => ({ ...current, note_rientro: value }))} />
                    <Input label="Problemi rilevati (separati da virgola)" value={usageForm.issue_flags} onChange={(event) => setUsageForm((current) => ({ ...current, issue_flags: event.target.value }))} placeholder="graffio lato destro, pneumatico posteriore" />
                    <Button
                      type="button"
                      disabled={!usageForm.assignment_id}
                      onClick={() => {
                        api.post(`/fleet/assignments/${usageForm.assignment_id}/usage`, {
                          employee_id: usageForm.employee_id ? Number(usageForm.employee_id) : null,
                          km_partenza: Number(usageForm.km_partenza),
                          km_rientro: usageForm.km_rientro ? Number(usageForm.km_rientro) : null,
                          started_at: usageForm.started_at || null,
                          ended_at: usageForm.ended_at || null,
                          note_presa: usageForm.note_presa || null,
                          note_rientro: usageForm.note_rientro || null,
                          issue_flags: usageForm.issue_flags ? usageForm.issue_flags.split(',').map((item) => item.trim()).filter(Boolean) : [],
                        })
                          .then(async () => {
                            setSuccess('Utilizzo del mezzo registrato.');
                            setUsageForm({ assignment_id: '', employee_id: '', km_partenza: '', km_rientro: '', started_at: '', ended_at: '', note_presa: '', note_rientro: '', issue_flags: '' });
                            await loadVehicle();
                          })
                          .catch((err) => setError(err.message || 'Impossibile registrare l’utilizzo.'));
                      }}
                    >
                      Registra utilizzo
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <h3 className="text-lg font-semibold">Restituzione mezzo</h3>
                    <Select
                      label="Assegnazione attiva"
                      value={returnForm.assignment_id}
                      onChange={(event) => setReturnForm((current) => ({ ...current, assignment_id: event.target.value }))}
                      options={[{ value: '', label: 'Seleziona assegnazione' }, ...activeAssignments.map((item) => ({ value: String(item.id), label: `${item.employee_display_name || item.user_display_name || 'Operatore'} - ${item.stato}` }))]}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Km finali" type="number" value={returnForm.km_finali} onChange={(event) => setReturnForm((current) => ({ ...current, km_finali: event.target.value }))} />
                      <Input label="Data restituzione" type="datetime-local" value={returnForm.riconsegnato_il} onChange={(event) => setReturnForm((current) => ({ ...current, riconsegnato_il: event.target.value }))} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Documento restituzione" value={returnForm.documento_restituzione_numero} onChange={(event) => setReturnForm((current) => ({ ...current, documento_restituzione_numero: event.target.value }))} />
                      <Input label="Data documento restituzione" type="date" value={returnForm.documento_restituzione_data} onChange={(event) => setReturnForm((current) => ({ ...current, documento_restituzione_data: event.target.value }))} />
                    </div>
                    <TextareaField label="Note restituzione" value={returnForm.note} onChange={(value) => setReturnForm((current) => ({ ...current, note: value }))} />
                    <Button
                      type="button"
                      disabled={!returnForm.assignment_id || !returnForm.km_finali}
                      onClick={() => {
                        api.patch(`/fleet/assignments/${returnForm.assignment_id}/return`, {
                          km_finali: Number(returnForm.km_finali),
                          riconsegnato_il: returnForm.riconsegnato_il || null,
                          documento_restituzione_numero: returnForm.documento_restituzione_numero || null,
                          documento_restituzione_data: returnForm.documento_restituzione_data || null,
                          note: returnForm.note || null,
                        })
                          .then(async () => {
                            setSuccess('Restituzione del mezzo registrata.');
                            setReturnForm({ assignment_id: '', km_finali: '', riconsegnato_il: '', documento_restituzione_numero: '', documento_restituzione_data: '', note: '' });
                            await loadVehicle();
                          })
                          .catch((err) => setError(err.message || 'Impossibile registrare la restituzione del mezzo.'));
                      }}
                    >
                      Registra restituzione
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === 'documenti' && (
            <Card padding="md">
              <div className="space-y-3">
                {vehicle.documents.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    Nessun documento mezzo registrato. Qui confluiscono libretto, polizza, verbali, allegati di assegnazione e restituzione.
                  </p>
                )}
                {vehicle.documents.map((document) => (
                  <div key={document.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{document.titolo || document.tipo_documento}</p>
                      <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>{document.stato}</span>
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <Info label="Tipo documento" value={document.tipo_documento} />
                      <Info label="Numero documento" value={document.numero_documento || '-'} />
                      <Info label="Data rilascio" value={formatDate(document.data_rilascio)} />
                      <Info label="Scadenza" value={formatDate(document.data_scadenza)} />
                    </div>
                    {document.note ? <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{document.note}</p> : null}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'sinistri' && (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card padding="md">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Alert operativi</h3>
                    <div className="mt-3 space-y-3">
                      {vehicle.alerts.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun alert registrato per il mezzo.</p>}
                      {vehicle.alerts.map((alert) => (
                        <div key={alert.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{alert.title}</p>
                            <span className="text-xs font-semibold" style={{ color: alert.alert_type === 'sos' ? 'var(--cv-danger)' : 'var(--cv-primary-dark)' }}>
                              {alert.alert_type} - {alert.severity}
                            </span>
                          </div>
                          <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{alert.description}</p>
                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            <Info label="Luogo" value={alert.location_text || '-'} />
                            <Info label="Provincia" value={alert.province_code || '-'} />
                            <Info label="Momento evento" value={formatDateTime(alert.event_at)} />
                            <Info label="Operatore" value={alert.actor_display_name || '-'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Sinistri registrati</h3>
                    <div className="mt-3 space-y-3">
                      {vehicle.incidents.length === 0 && <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessun sinistro registrato.</p>}
                      {vehicle.incidents.map((incident) => (
                        <div key={incident.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{incident.tipo || 'Sinistro'}</p>
                            <span className="text-xs font-semibold" style={{ color: incident.data_chiusura ? 'var(--cv-primary-dark)' : 'var(--cv-danger)' }}>{incident.stato}</span>
                          </div>
                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            <Info label="Data evento" value={formatDate(incident.data_evento)} />
                            <Info label="Luogo" value={incident.luogo || '-'} />
                            <Info label="Numero sinistro" value={incident.numero_sinistro || '-'} />
                            <Info label="Data chiusura" value={formatDate(incident.data_chiusura)} />
                          </div>
                          {incident.descrizione ? <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{incident.descrizione}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="space-y-3 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                  <h3 className="text-lg font-semibold">Attiva SOS o segnala sinistro</h3>
                  <Select label="Assegnazione" value={alertForm.assignment_id} onChange={(event) => setAlertForm((current) => ({ ...current, assignment_id: event.target.value }))} options={assignmentOptions} />
                  <Select label="Operatore" value={alertForm.employee_id} onChange={(event) => setAlertForm((current) => ({ ...current, employee_id: event.target.value }))} options={employeeOptions} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select
                      label="Tipo alert"
                      value={alertForm.alert_type}
                      onChange={(event) => setAlertForm((current) => ({ ...current, alert_type: event.target.value }))}
                      options={[
                        { value: 'sos', label: 'SOS' },
                        { value: 'sinistro', label: 'Sinistro' },
                        { value: 'segnalazione', label: 'Segnalazione mezzo' },
                      ]}
                    />
                    <Select
                      label="Gravità"
                      value={alertForm.severity}
                      onChange={(event) => setAlertForm((current) => ({ ...current, severity: event.target.value }))}
                      options={[
                        { value: 'alta', label: 'Alta' },
                        { value: 'media', label: 'Media' },
                        { value: 'bassa', label: 'Bassa' },
                      ]}
                    />
                  </div>
                  <Input label="Titolo" value={alertForm.title} onChange={(event) => setAlertForm((current) => ({ ...current, title: event.target.value }))} />
                  <Input label="Luogo / località" value={alertForm.location_text} onChange={(event) => setAlertForm((current) => ({ ...current, location_text: event.target.value }))} />
                  <Input label="Provincia competente" value={alertForm.province_code} onChange={(event) => setAlertForm((current) => ({ ...current, province_code: event.target.value.toUpperCase() }))} />
                  <TextareaField label="Descrizione evento" value={alertForm.description} onChange={(value) => setAlertForm((current) => ({ ...current, description: value }))} rows={4} />
                  <Button
                    type="button"
                    onClick={() => {
                      api.post(`/fleet/vehicles/${vehicle.id}/alerts`, {
                        assignment_id: alertForm.assignment_id ? Number(alertForm.assignment_id) : null,
                        employee_id: alertForm.employee_id ? Number(alertForm.employee_id) : null,
                        alert_type: alertForm.alert_type,
                        severity: alertForm.severity,
                        title: alertForm.title,
                        description: alertForm.description,
                        location_text: alertForm.location_text || null,
                        province_code: alertForm.province_code || null,
                      })
                        .then(async () => {
                          setSuccess('Alert registrato e inserito nel registro comunicazioni ufficiali.');
                          setAlertForm({ assignment_id: '', employee_id: '', alert_type: 'sos', severity: 'alta', title: '', description: '', location_text: '', province_code: '' });
                          await loadVehicle();
                        })
                        .catch((err) => setError(err.message || 'Impossibile registrare l’alert operativo.'));
                    }}
                  >
                    Invia alert operativo
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {tab === 'comunicazioni' && (
            <Card padding="md">
              <div className="space-y-3">
                {communications.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    Nessuna comunicazione ufficiale registrata per questo mezzo.
                  </p>
                )}
                {communications.map((item) => (
                  <div key={item.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.subject}</p>
                        <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                          {item.event_type} - {item.channel} - {formatDateTime(item.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>{item.message}</p>
                    <div className="mt-3 space-y-2">
                      {item.recipients.map((recipient) => (
                        <div key={recipient.id} className="rounded-[var(--cv-radius-sm)] border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          <span className="font-medium">{recipient.recipient_label}</span>
                          <span style={{ color: 'var(--cv-neutral-600)' }}> - {recipient.channel}</span>
                          {recipient.destination ? <span style={{ color: 'var(--cv-neutral-600)' }}> - {recipient.destination}</span> : null}
                          <span style={{ color: 'var(--cv-neutral-600)' }}> - {recipient.delivery_status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card padding="md">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Elenco operazioni del mezzo</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  Qui trovi tutta la storia del mezzo. Clicca su una riga per aprire il dettaglio dell&apos;operazione.
                </p>
              </div>
              <div className="space-y-3">
                {operations.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    Nessuna operazione registrata su questo mezzo.
                  </p>
                )}
                {operations.map((operation) => {
                  const expanded = expandedOperationId === operation.id;
                  return (
                    <button
                      key={operation.id}
                      type="button"
                      className="w-full rounded-[var(--cv-radius-md)] border p-4 text-left"
                      style={{ borderColor: 'var(--cv-border-subtle)', background: 'white' }}
                      onClick={() => setExpandedOperationId((current) => current === operation.id ? null : operation.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                            {operation.title}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                            {operation.summary}
                          </p>
                        </div>
                      </div>
                      {expanded ? (
                        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                          {operation.details.map((detail) => (
                            <Info key={`${operation.id}-${detail.label}`} label={detail.label} value={detail.value} />
                          ))}
                          {operation.note ? (
                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                                Note
                              </p>
                              <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                                {operation.note}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      )}

      <Modal
        isOpen={actionModal === 'km'}
        onClose={() => setActionModal(null)}
        title="Aggiorna chilometraggio"
        description="Registra il chilometraggio attuale del mezzo."
        size="md"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Annulla</Button>
            <Button type="button" disabled={!kmUpdateForm.km_attuali} onClick={() => submitKmUpdate().catch((err) => setError(err.message || 'Impossibile aggiornare i km del mezzo.'))}>
              Salva km
            </Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <Input label="Km attuali" type="number" value={kmUpdateForm.km_attuali} onChange={(event) => setKmUpdateForm((current) => ({ ...current, km_attuali: event.target.value }))} />
          <TextareaField label="Note aggiornamento" value={kmUpdateForm.note} onChange={(value) => setKmUpdateForm((current) => ({ ...current, note: value }))} />
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'insurance'}
        onClose={() => setActionModal(null)}
        title="Aggiungi assicurazione"
        description="Inserisci i dati comuni e il numero polizza specifico del mezzo."
        size="lg"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Annulla</Button>
            <Button type="button" disabled={!insuranceForm.compagnia || !insuranceForm.data_scadenza} onClick={() => submitInsurance().catch((err) => setError(err.message || 'Impossibile salvare i dati assicurativi.'))}>
              Salva assicurazione
            </Button>
          </>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Compagnia" value={insuranceForm.compagnia} onChange={(event) => setInsuranceForm((current) => ({ ...current, compagnia: event.target.value }))} />
          <Input label="Broker / agenzia" value={insuranceForm.broker} onChange={(event) => setInsuranceForm((current) => ({ ...current, broker: event.target.value }))} />
          <Input label="Pacchetto / convenzione" value={insuranceForm.package_name} onChange={(event) => setInsuranceForm((current) => ({ ...current, package_name: event.target.value }))} />
          <Input label="Numero polizza mezzo" value={insuranceForm.numero_polizza} onChange={(event) => setInsuranceForm((current) => ({ ...current, numero_polizza: event.target.value }))} />
          <Input label="Copertura dal" type="date" value={insuranceForm.copertura_dal} onChange={(event) => setInsuranceForm((current) => ({ ...current, copertura_dal: event.target.value }))} />
          <Input label="Copertura al" type="date" value={insuranceForm.copertura_al} onChange={(event) => setInsuranceForm((current) => ({ ...current, copertura_al: event.target.value }))} />
          <Input label="Scadenza assicurazione" type="date" value={insuranceForm.data_scadenza} onChange={(event) => setInsuranceForm((current) => ({ ...current, data_scadenza: event.target.value }))} />
          <div className="md:col-span-2">
            <TextareaField label="Note" value={insuranceForm.note} onChange={(value) => setInsuranceForm((current) => ({ ...current, note: value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'revision'}
        onClose={() => setActionModal(null)}
        title="Aggiungi revisione"
        description="Registra la revisione del mezzo e aggiorna le scadenze operative."
        size="lg"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Annulla</Button>
            <Button type="button" disabled={!revisionForm.data_revisione} onClick={() => submitRevision().catch((err) => setError(err.message || 'Impossibile salvare la revisione.'))}>
              Salva revisione
            </Button>
          </>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Data revisione" type="date" value={revisionForm.data_revisione} onChange={(event) => setRevisionForm((current) => ({ ...current, data_revisione: event.target.value }))} />
          <Input label="Km rilevati" type="number" value={revisionForm.km_rilevati} onChange={(event) => setRevisionForm((current) => ({ ...current, km_rilevati: event.target.value }))} />
          <Input label="Scadenza revisione" type="date" value={revisionForm.scadenza_revisione} onChange={(event) => setRevisionForm((current) => ({ ...current, scadenza_revisione: event.target.value }))} />
          <Input label="Scadenza verifica sicurezza" type="date" value={revisionForm.scadenza_verifica_sicurezza} onChange={(event) => setRevisionForm((current) => ({ ...current, scadenza_verifica_sicurezza: event.target.value }))} />
          <Select
            label="Esito"
            value={revisionForm.esito}
            onChange={(event) => setRevisionForm((current) => ({ ...current, esito: event.target.value }))}
            options={[
              { value: 'regolare', label: 'Regolare' },
              { value: 'con_riserva', label: 'Con riserva' },
              { value: 'non_regolare', label: 'Non regolare' },
            ]}
          />
          <div className="md:col-span-2">
            <TextareaField label="Note" value={revisionForm.note} onChange={(value) => setRevisionForm((current) => ({ ...current, note: value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'assignment'}
        onClose={() => setActionModal(null)}
        title="Assegna mezzo"
        description="Seleziona una persona dall'anagrafica interna. Il sistema registra il verbale nel registro comunicazioni."
        size="lg"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Annulla</Button>
            <Button
              type="button"
              disabled={(!assignmentForm.employee_id && !assignmentForm.organization_id) || !assignmentForm.km_iniziali || (needsKmConfirmation && !kmConfirmed)}
              onClick={() => submitAssignment().catch((err) => setError(err.message || 'Impossibile assegnare il mezzo.'))}
            >
              Assegna e registra comunicazione
            </Button>
          </>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Cerca personale" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Cognome, nome, matricola o codice fiscale..." />
          <Select label="Assegnatario persona" value={assignmentForm.employee_id} onChange={(event) => setAssignmentForm((current) => ({ ...current, employee_id: event.target.value }))} options={employeeOptions} />
          <Input label="Cerca reparto o sede" value={assignmentUnitSearch} onChange={(event) => setAssignmentUnitSearch(event.target.value)} placeholder="Distretto, sala operativa, vivaio..." />
          <Select label="Assegnatario reparto/sede" value={assignmentForm.organization_id} onChange={(event) => setAssignmentForm((current) => ({ ...current, organization_id: event.target.value }))} options={assignmentUnitOptions} />
          <Input
            label="Km consegna"
            type="number"
            value={assignmentForm.km_iniziali}
            onChange={(event) => {
              setKmConfirmed(false);
              setAssignmentForm((current) => ({ ...current, km_iniziali: event.target.value }));
            }}
          />
          <Input label="Data e ora consegna" type="datetime-local" value={assignmentForm.assegnato_il} onChange={(event) => setAssignmentForm((current) => ({ ...current, assegnato_il: event.target.value }))} />
          <Input label="Scadenza prevista / proroga" type="datetime-local" value={assignmentForm.riconsegnato_il} onChange={(event) => setAssignmentForm((current) => ({ ...current, riconsegnato_il: event.target.value }))} />
          <Input label="Numero verbale" value="Progressivo automatico alla conferma" disabled />
          {needsKmConfirmation ? (
            <div className="md:col-span-2 rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-warning)', background: 'rgba(180, 83, 9, 0.06)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--cv-warning)' }}>
                Stai registrando {Math.abs(kmDelta).toLocaleString('it-IT')} km {kmDelta > 0 ? 'in piu' : 'in meno'} rispetto all&apos;ultima registrazione.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                <input type="checkbox" checked={kmConfirmed} onChange={(event) => setKmConfirmed(event.target.checked)} className="mt-1" />
                <span>Confermo che i km inseriti sono esatti e verificati visivamente sul contachilometri.</span>
              </label>
              <div className="mt-3">
                <TextareaField label="Nota verifica km" value={kmConfirmationNote} onChange={setKmConfirmationNote} />
              </div>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <TextareaField label="Note responsabile / delegato" value={assignmentForm.note_responsabile} onChange={(value) => setAssignmentForm((current) => ({ ...current, note_responsabile: value }))} />
          </div>
          <div className="md:col-span-2">
            <TextareaField label="Note assegnatario" value={assignmentForm.note_assegnatario} onChange={(value) => setAssignmentForm((current) => ({ ...current, note_assegnatario: value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'extension'}
        onClose={() => setActionModal(null)}
        title="Proroga consegna"
        description="Aggiorna solo la data prevista di riconsegna. Gli altri dati del verbale restano bloccati."
        size="md"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Annulla</Button>
            <Button type="button" disabled={!extensionForm.assignment_id || !extensionForm.riconsegnato_il} onClick={() => submitExtension().catch((err) => setError(err.message || 'Impossibile registrare la proroga.'))}>
              Conferma proroga
            </Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <Input label="Nuova data prevista di riconsegna" type="datetime-local" value={extensionForm.riconsegnato_il} onChange={(event) => setExtensionForm((current) => ({ ...current, riconsegnato_il: event.target.value }))} />
          <TextareaField label="Note proroga" value={extensionForm.note} onChange={(value) => setExtensionForm((current) => ({ ...current, note: value }))} />
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'return'}
        onClose={() => setActionModal(null)}
        title="Restituisci mezzo"
        description="Chiude l'assegnazione attiva e aggiorna i chilometri del mezzo."
        size="md"
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Annulla</Button>
            <Button type="button" disabled={!returnForm.assignment_id || !returnForm.km_finali} onClick={() => submitReturn().catch((err) => setError(err.message || 'Impossibile registrare la restituzione.'))}>
              Registra restituzione
            </Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <Select label="Assegnazione attiva" value={returnForm.assignment_id} onChange={(event) => setReturnForm((current) => ({ ...current, assignment_id: event.target.value }))} options={[{ value: '', label: 'Seleziona assegnazione' }, ...activeAssignments.map((item) => ({ value: String(item.id), label: `${item.employee_display_name || item.user_display_name || 'Operatore'} - ${formatDateTime(item.assegnato_il)}` }))]} />
          <Input label="Km restituzione" type="number" value={returnForm.km_finali} onChange={(event) => setReturnForm((current) => ({ ...current, km_finali: event.target.value }))} />
          <Input label="Data restituzione" type="datetime-local" value={returnForm.riconsegnato_il} onChange={(event) => setReturnForm((current) => ({ ...current, riconsegnato_il: event.target.value }))} />
          <Input label="Numero documento restituzione" value={returnForm.documento_restituzione_numero} onChange={(event) => setReturnForm((current) => ({ ...current, documento_restituzione_numero: event.target.value }))} />
          <Input label="Data documento" type="date" value={returnForm.documento_restituzione_data} onChange={(event) => setReturnForm((current) => ({ ...current, documento_restituzione_data: event.target.value }))} />
          <TextareaField label="Note" value={returnForm.note} onChange={(value) => setReturnForm((current) => ({ ...current, note: value }))} />
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
        {label}
      </p>
      <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
        {value}
      </p>
    </div>
  );
}
