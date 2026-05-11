'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';

// ============================================
// TIPI
// ============================================
interface Qualification {
  id: number;
  tipo_qualifica: string;
  is_attiva: boolean;
  data_conseguimento?: string;
  data_scadenza?: string;
  ente_rilascio?: string;
  numero_documento?: string;
  note?: string;
}

interface EmployeeDetail {
  id: number;
  codice_fiscale: string;
  nome: string;
  cognome: string;
  genere?: string;
  data_nascita?: string;
  luogo_nascita?: string;
  provincia_nascita?: string;
  luogo_nascita_estero?: string;
  email_istituzionale?: string;
  email_personale?: string;
  pec?: string;
  telefono_lavoro?: string;
  telefono_personale?: string;
  telefono_secondario?: string;
  tipo: 'interno' | 'esterno';
  tipo_contratto?: string;
  data_assunzione?: string;
  data_fine_contratto?: string;
  numero_matricola?: string;
  mansione?: string;
  livello_inquadramento?: string;
  stato: string;
  stato_quiescenza?: string;
  organization_id?: number;
  is_aib_qualificato: boolean;
  is_dos: boolean;
  is_emergency_available: boolean;
  is_emergency_coordinator: boolean;
  is_operations_room_manager: boolean;
  is_operations_room_operator: boolean;
  is_mechanical_operator: boolean;
  is_aib_pc_operator: boolean;
  is_pc_operator: boolean;
  is_driver: boolean;
  patenti?: string[];
  abilitazioni?: string[];
  documenti_scadenza?: Record<string, string>;
  note?: string;
  created_at: string;
  updated_at: string;
  qualifiche?: Qualification[];
}

type EmployeeFormState = {
  nome: string;
  cognome: string;
  genere: string;
  data_nascita: string;
  luogo_nascita: string;
  provincia_nascita: string;
  email_istituzionale: string;
  email_personale: string;
  pec: string;
  telefono_lavoro: string;
  telefono_personale: string;
  telefono_secondario: string;
  tipo_contratto: string;
  numero_matricola: string;
  mansione: string;
  livello_inquadramento: string;
  stato: string;
  is_aib_qualificato: boolean;
  is_dos: boolean;
  is_driver: boolean;
  is_emergency_available: boolean;
  is_emergency_coordinator: boolean;
  is_operations_room_manager: boolean;
  is_operations_room_operator: boolean;
  is_mechanical_operator: boolean;
  is_aib_pc_operator: boolean;
  is_pc_operator: boolean;
  note: string;
};

// ============================================
// HELPERS
// ============================================
const STATO_BADGE: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'; label: string }> = {
  in_servizio: { variant: 'success', label: 'In servizio' },
  malattia:    { variant: 'warning', label: 'Malattia' },
  infortunio:  { variant: 'warning', label: 'Infortunio' },
  aspettativa: { variant: 'info',    label: 'Aspettativa' },
  maternita:   { variant: 'info',    label: 'Maternità' },
  distaccato:  { variant: 'neutral', label: 'Distaccato' },
  sospeso:     { variant: 'warning', label: 'Sospeso' },
  cessato:     { variant: 'danger',  label: 'Cessato' },
  pensionato:  { variant: 'neutral', label: 'Pensionato' },
};

const CONTRATTO_LABEL: Record<string, string> = {
  indeterminato:   'Tempo indeterminato',
  determinato:     'Tempo determinato',
  stagionale:      'Stagionale',
  somministrazione:'Somministrazione',
  collaborazione:  'Collaborazione',
  volontario:      'Volontario',
};

function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getInitials(nome: string, cognome: string): string {
  return `${cognome[0] || ''}${nome[0] || ''}`.toUpperCase();
}

type Tab = 'anagrafica' | 'contratto' | 'operativo' | 'qualifiche' | 'documenti';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'anagrafica', label: 'Anagrafica',  icon: '👤' },
  { id: 'contratto',  label: 'Contratto',   icon: '📋' },
  { id: 'operativo',  label: 'Operativo',   icon: '🔥' },
  { id: 'qualifiche', label: 'Qualifiche',  icon: '🎖️' },
  { id: 'documenti',  label: 'Documenti',   icon: '📁' },
];

const GENERE_OPTIONS = [
  { value: '', label: 'Non indicato' },
  { value: 'M', label: 'Maschile' },
  { value: 'F', label: 'Femminile' },
  { value: 'NB', label: 'Non binario' },
];

const STATO_OPTIONS = [
  { value: 'in_servizio', label: 'In servizio' },
  { value: 'malattia', label: 'Malattia' },
  { value: 'infortunio', label: 'Infortunio' },
  { value: 'aspettativa', label: 'Aspettativa' },
  { value: 'maternita', label: 'Maternita' },
  { value: 'distaccato', label: 'Distaccato' },
  { value: 'sospeso', label: 'Sospeso' },
  { value: 'cessato', label: 'Cessato' },
  { value: 'pensionato', label: 'Pensionato' },
];

const CONTRATTO_OPTIONS = [
  { value: 'indeterminato', label: 'Tempo indeterminato' },
  { value: 'determinato', label: 'Tempo determinato' },
  { value: 'stagionale', label: 'Stagionale' },
  { value: 'somministrazione', label: 'Somministrazione' },
  { value: 'collaborazione', label: 'Collaborazione' },
  { value: 'volontario', label: 'Volontario' },
];

const OPERATIONAL_FLAGS: { key: keyof EmployeeFormState; label: string }[] = [
  { key: 'is_aib_qualificato', label: 'AIB qualificato' },
  { key: 'is_dos', label: 'DOS' },
  { key: 'is_driver', label: 'Autista' },
  { key: 'is_emergency_available', label: 'Reperibile emergenza' },
  { key: 'is_emergency_coordinator', label: 'Coordinatore emergenza' },
  { key: 'is_operations_room_manager', label: 'Responsabile sala operativa' },
  { key: 'is_operations_room_operator', label: 'Operatore sala operativa' },
  { key: 'is_mechanical_operator', label: 'Operatore meccanico' },
  { key: 'is_aib_pc_operator', label: 'Operatore AIB PC2' },
  { key: 'is_pc_operator', label: 'Operatore PC' },
];

function toInputDate(value?: string): string {
  return value ? value.slice(0, 10) : '';
}

function employeeToForm(emp: EmployeeDetail): EmployeeFormState {
  return {
    nome: emp.nome || '',
    cognome: emp.cognome || '',
    genere: emp.genere || '',
    data_nascita: toInputDate(emp.data_nascita),
    luogo_nascita: emp.luogo_nascita || '',
    provincia_nascita: emp.provincia_nascita || '',
    email_istituzionale: emp.email_istituzionale || '',
    email_personale: emp.email_personale || '',
    pec: emp.pec || '',
    telefono_lavoro: emp.telefono_lavoro || '',
    telefono_personale: emp.telefono_personale || '',
    telefono_secondario: emp.telefono_secondario || '',
    tipo_contratto: emp.tipo_contratto || 'indeterminato',
    numero_matricola: emp.numero_matricola || '',
    mansione: emp.mansione || '',
    livello_inquadramento: emp.livello_inquadramento || '',
    stato: emp.stato || 'in_servizio',
    is_aib_qualificato: emp.is_aib_qualificato,
    is_dos: emp.is_dos,
    is_driver: emp.is_driver,
    is_emergency_available: emp.is_emergency_available,
    is_emergency_coordinator: emp.is_emergency_coordinator,
    is_operations_room_manager: emp.is_operations_room_manager,
    is_operations_room_operator: emp.is_operations_room_operator,
    is_mechanical_operator: emp.is_mechanical_operator,
    is_aib_pc_operator: emp.is_aib_pc_operator,
    is_pc_operator: emp.is_pc_operator,
    note: emp.note || '',
  };
}

function normalizePayload(form: EmployeeFormState) {
  const payload: Record<string, string | boolean | null> = {};
  Object.entries(form).forEach(([key, value]) => {
    payload[key] = typeof value === 'boolean' ? value : value.trim() || null;
  });
  return payload;
}

// ============================================
// SUB-COMPONENTI
// ============================================
function FieldRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5"
      style={{ borderBottom: '1px solid var(--cv-neutral-200)' }}>
      <span className="text-xs font-semibold uppercase tracking-wider sm:w-48 flex-shrink-0"
        style={{ color: 'var(--cv-neutral-500)' }}>
        {label}
      </span>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}
        style={{ color: value ? 'var(--cv-neutral-900)' : 'var(--cv-neutral-400)' }}>
        {value || '—'}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest mb-3 mt-6 first:mt-0"
      style={{ color: 'var(--cv-primary)' }}>
      {children}
    </h3>
  );
}

function FlagChip({ active, label, color }: { active: boolean; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
      style={{
        background: active ? `${color}18` : 'var(--cv-neutral-100)',
        color: active ? color : 'var(--cv-neutral-400)',
        border: `1px solid ${active ? `${color}40` : 'var(--cv-neutral-300)'}`,
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? color : 'var(--cv-neutral-300)',
        flexShrink: 0,
        display: 'inline-block',
      }} />
      {label}
    </div>
  );
}

// ============================================
// TABS
// ============================================
function TabAnagrafica({ emp }: { emp: EmployeeDetail }) {
  return (
    <div>
      <SectionTitle>Dati personali</SectionTitle>
      <FieldRow label="Cognome" value={emp.cognome} />
      <FieldRow label="Nome" value={emp.nome} />
      <FieldRow label="Codice Fiscale" value={emp.codice_fiscale} mono />
      <FieldRow label="Genere" value={emp.genere === 'M' ? 'Maschile' : emp.genere === 'F' ? 'Femminile' : emp.genere} />
      <FieldRow label="Data di nascita" value={formatDate(emp.data_nascita)} />
      <FieldRow label="Luogo di nascita"
        value={emp.luogo_nascita ? `${emp.luogo_nascita}${emp.provincia_nascita ? ` (${emp.provincia_nascita})` : ''}` : emp.luogo_nascita_estero} />

      <SectionTitle>Contatti istituzionali</SectionTitle>
      <FieldRow label="Email istituzionale" value={emp.email_istituzionale} />
      <FieldRow label="PEC" value={emp.pec} />
      <FieldRow label="Telefono ufficio" value={emp.telefono_lavoro} />

      <SectionTitle>Contatti personali</SectionTitle>
      <FieldRow label="Email personale" value={emp.email_personale} />
      <FieldRow label="Telefono personale" value={emp.telefono_personale} />
      <FieldRow label="Telefono secondario" value={emp.telefono_secondario} />

      {emp.note && (
        <>
          <SectionTitle>Note</SectionTitle>
          <p className="text-sm py-2" style={{ color: 'var(--cv-neutral-700)' }}>{emp.note}</p>
        </>
      )}
    </div>
  );
}

function TabContratto({ emp }: { emp: EmployeeDetail }) {
  return (
    <div>
      <SectionTitle>Tipo rapporto</SectionTitle>
      <FieldRow label="Tipo dipendente" value={emp.tipo === 'interno' ? 'Interno (dipendente diretto)' : 'Esterno (collaboratore/stagionale)'} />
      <FieldRow label="Tipo contratto" value={CONTRATTO_LABEL[emp.tipo_contratto || ''] || emp.tipo_contratto} />

      <SectionTitle>Date contrattuali</SectionTitle>
      <FieldRow label="Data assunzione" value={formatDate(emp.data_assunzione)} />
      <FieldRow label="Fine contratto" value={formatDate(emp.data_fine_contratto)} />

      <SectionTitle>Posizione</SectionTitle>
      <FieldRow label="Numero matricola" value={emp.numero_matricola} mono />
      <FieldRow label="Mansione" value={emp.mansione} />
      <FieldRow label="Livello inquadramento" value={emp.livello_inquadramento} />
      <FieldRow label="Stato quiescenza" value={emp.stato_quiescenza?.replace(/_/g, ' ')} />
    </div>
  );
}

function TabOperativo({ emp }: { emp: EmployeeDetail }) {
  const flags = [
    { label: 'AIB Qualificato',        active: emp.is_aib_qualificato,          color: '#CC8400' },
    { label: 'DOS',                    active: emp.is_dos,                       color: '#9B59B6' },
    { label: 'Autista',               active: emp.is_driver,                    color: '#2980B9' },
    { label: 'Reperibile emergenza',  active: emp.is_emergency_available,       color: '#CC3344' },
    { label: 'Coordinatore emergenza',active: emp.is_emergency_coordinator,     color: '#CC3344' },
    { label: 'Resp. sala operativa',  active: emp.is_operations_room_manager,   color: '#339966' },
    { label: 'Op. sala operativa',    active: emp.is_operations_room_operator,  color: '#339966' },
    { label: 'Operatore meccanico',   active: emp.is_mechanical_operator,       color: '#748A9D' },
    { label: 'Operatore AIB PC2',     active: emp.is_aib_pc_operator,           color: '#CC8400' },
    { label: 'Operatore PC',          active: emp.is_pc_operator,               color: '#5B8FCC' },
  ];

  return (
    <div>
      <SectionTitle>Flag operativi</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
        {flags.map((f) => (
          <FlagChip key={f.label} active={f.active} label={f.label} color={f.color} />
        ))}
      </div>

      <SectionTitle>Patenti di guida</SectionTitle>
      {emp.patenti && emp.patenti.length > 0 ? (
        <div className="flex flex-wrap gap-2 py-2">
          {emp.patenti.map((p) => (
            <span key={p} className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary-dark)', border: '1px solid var(--cv-primary-light)' }}>
              {p.toUpperCase()}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm py-2" style={{ color: 'var(--cv-neutral-400)' }}>Nessuna patente registrata</p>
      )}

      <SectionTitle>Abilitazioni</SectionTitle>
      {emp.abilitazioni && emp.abilitazioni.length > 0 ? (
        <div className="flex flex-wrap gap-2 py-2">
          {emp.abilitazioni.map((a) => (
            <span key={a} className="px-3 py-1 rounded-full text-sm font-medium capitalize"
              style={{ background: 'var(--cv-neutral-200)', color: 'var(--cv-neutral-800)' }}>
              {a.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm py-2" style={{ color: 'var(--cv-neutral-400)' }}>Nessuna abilitazione registrata</p>
      )}

      {emp.documenti_scadenza && Object.keys(emp.documenti_scadenza).length > 0 && (
        <>
          <SectionTitle>Scadenze documenti</SectionTitle>
          <div className="space-y-1">
            {Object.entries(emp.documenti_scadenza).map(([tipo, data]) => {
              const scaduto = new Date(data) < new Date();
              return (
                <div key={tipo} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--cv-neutral-200)' }}>
                  <span className="text-sm capitalize" style={{ color: 'var(--cv-neutral-800)' }}>
                    {tipo.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold"
                    style={{ color: scaduto ? 'var(--cv-danger)' : 'var(--cv-neutral-600)' }}>
                    {scaduto ? '⚠ ' : ''}{formatDate(data)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TabQualifiche({ empId }: { empId: number }) {
  const [qualifiche, setQualifiche] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Qualification[]>(`/hr/employees/${empId}/qualifications`)
      .then(setQualifiche)
      .catch(() => setQualifiche([]))
      .finally(() => setLoading(false));
  }, [empId]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg" style={{ background: 'var(--cv-neutral-200)' }} />
        ))}
      </div>
    );
  }

  if (qualifiche.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-4xl mb-3">🎖️</p>
        <p className="font-semibold" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna qualifica registrata</p>
        <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-400)' }}>Le qualifiche operative appariranno qui</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {qualifiche.map((q) => {
        const scaduta = q.data_scadenza && new Date(q.data_scadenza) < new Date();
        return (
          <div key={q.id} className="p-4 rounded-lg"
            style={{
              border: `1px solid ${scaduta ? 'var(--cv-danger)' : q.is_attiva ? 'var(--cv-primary-light)' : 'var(--cv-neutral-300)'}`,
              background: scaduta ? '#CC334408' : q.is_attiva ? 'var(--cv-primary-lighter)' : 'var(--cv-neutral-100)',
            }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm capitalize" style={{ color: 'var(--cv-neutral-900)' }}>
                  {q.tipo_qualifica.replace(/_/g, ' ')}
                </p>
                {q.ente_rilascio && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--cv-neutral-600)' }}>
                    Rilasciato da: {q.ente_rilascio}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                  {q.data_conseguimento && <span>Conseguita: {formatDate(q.data_conseguimento)}</span>}
                  {q.data_scadenza && (
                    <span style={{ color: scaduta ? 'var(--cv-danger)' : 'inherit' }}>
                      {scaduta ? '⚠ Scaduta: ' : 'Scade: '}{formatDate(q.data_scadenza)}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={!q.is_attiva ? 'neutral' : scaduta ? 'danger' : 'success'} size="sm">
                {!q.is_attiva ? 'Inattiva' : scaduta ? 'Scaduta' : 'Attiva'}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabDocumenti() {
  return (
    <div className="py-12 text-center">
      <p className="text-4xl mb-3">📁</p>
      <p className="font-semibold" style={{ color: 'var(--cv-neutral-600)' }}>Gestione documenti</p>
      <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-400)' }}>
        Upload e gestione documenti allegati — disponibile nella prossima versione
      </p>
    </div>
  );
}

function EmployeeEditModal({
  employee,
  isOpen,
  onClose,
  onSaved,
}: {
  employee: EmployeeDetail;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (employee: EmployeeDetail) => void;
}) {
  const [form, setForm] = useState<EmployeeFormState>(() => employeeToForm(employee));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof EmployeeFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.put<EmployeeDetail>(`/hr/employees/${employee.id}`, normalizePayload(form));
      onSaved(updated);
      onClose();
    } catch {
      setError('Salvataggio non riuscito. Verifica i dati e riprova.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica fascicolo personale"
      description={`${employee.cognome} ${employee.nome}`}
      size="lg"
      footer={(
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Annulla
          </Button>
          <Button type="button" onClick={save} loading={saving}>
            Salva modifiche
          </Button>
        </>
      )}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-5">
        {error && (
          <div className="rounded-md border px-3 py-2 text-sm font-medium" style={{ color: 'var(--cv-danger)', borderColor: 'var(--cv-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <SectionTitle>Dati personali</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Cognome" value={form.cognome} onChange={(e) => update('cognome', e.target.value)} required />
            <Input label="Nome" value={form.nome} onChange={(e) => update('nome', e.target.value)} required />
            <Select label="Genere" options={GENERE_OPTIONS} value={form.genere} onChange={(e) => update('genere', e.target.value)} />
            <Input label="Data di nascita" type="date" value={form.data_nascita} onChange={(e) => update('data_nascita', e.target.value)} />
            <Input label="Luogo di nascita" value={form.luogo_nascita} onChange={(e) => update('luogo_nascita', e.target.value)} />
            <Input label="Provincia" maxLength={5} value={form.provincia_nascita} onChange={(e) => update('provincia_nascita', e.target.value.toUpperCase())} />
          </div>
        </div>

        <div>
          <SectionTitle>Contatti</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Email istituzionale" type="email" value={form.email_istituzionale} onChange={(e) => update('email_istituzionale', e.target.value)} />
            <Input label="Email personale" type="email" value={form.email_personale} onChange={(e) => update('email_personale', e.target.value)} />
            <Input label="PEC" type="email" value={form.pec} onChange={(e) => update('pec', e.target.value)} />
            <Input label="Telefono ufficio" value={form.telefono_lavoro} onChange={(e) => update('telefono_lavoro', e.target.value)} />
            <Input label="Telefono personale" value={form.telefono_personale} onChange={(e) => update('telefono_personale', e.target.value)} />
            <Input label="Telefono secondario" value={form.telefono_secondario} onChange={(e) => update('telefono_secondario', e.target.value)} />
          </div>
        </div>

        <div>
          <SectionTitle>Contratto e posizione</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Tipo contratto" options={CONTRATTO_OPTIONS} value={form.tipo_contratto} onChange={(e) => update('tipo_contratto', e.target.value)} />
            <Select label="Stato" options={STATO_OPTIONS} value={form.stato} onChange={(e) => update('stato', e.target.value)} />
            <Input label="Matricola" value={form.numero_matricola} onChange={(e) => update('numero_matricola', e.target.value)} />
            <Input label="Mansione" value={form.mansione} onChange={(e) => update('mansione', e.target.value)} />
            <Input label="Livello inquadramento" value={form.livello_inquadramento} onChange={(e) => update('livello_inquadramento', e.target.value)} />
          </div>
        </div>

        <div>
          <SectionTitle>Flag operativi</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPERATIONAL_FLAGS.map((flag) => (
              <label key={flag.key} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-neutral-300)' }}>
                <input
                  type="checkbox"
                  checked={Boolean(form[flag.key])}
                  onChange={(e) => update(flag.key, e.target.checked)}
                />
                {flag.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Note</SectionTitle>
          <textarea
            className="w-full min-h-24 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cv-primary)]"
            style={{ borderColor: 'var(--cv-neutral-300)', color: 'var(--cv-neutral-900)' }}
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// PAGINA PRINCIPALE
// ============================================
export default function EmployeeDetailPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') || routeId;
  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('anagrafica');
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    api.get<EmployeeDetail>(`/hr/employees/${id}`)
      .then(setEmp)
      .catch(() => setError('Dipendente non trovato o backend non raggiungibile.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="text-center py-12">
            <p className="text-lg font-semibold" style={{ color: 'var(--cv-danger)' }}>
              Dipendente non specificato.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/hr')}>
              Torna alla lista
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded" style={{ background: 'var(--cv-neutral-300)' }} />
        <div className="h-40 rounded-xl" style={{ background: 'var(--cv-neutral-200)' }} />
        <div className="h-96 rounded-xl" style={{ background: 'var(--cv-neutral-200)' }} />
      </div>
    );
  }

  // Errore
  if (error || !emp) {
    return (
      <div className="space-y-4">
        <Link href="/hr">
          <Button variant="ghost" size="sm">← Torna alla lista</Button>
        </Link>
        <Card>
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-semibold" style={{ color: 'var(--cv-danger)' }}>{error || 'Dipendente non trovato'}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/hr')}>
              Torna alla lista HR
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stato = STATO_BADGE[emp.stato] || { variant: 'neutral' as const, label: emp.stato };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/hr" className="hover:underline" style={{ color: 'var(--cv-primary)' }}>
          Risorse Umane
        </Link>
        <span style={{ color: 'var(--cv-neutral-400)' }}>›</span>
        <span style={{ color: 'var(--cv-neutral-600)' }}>Fascicolo dipendente</span>
      </nav>

      {/* Header fascicolo */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--cv-primary-light), var(--cv-primary-lighter))',
              color: 'var(--cv-primary-dark)',
              border: '3px solid var(--cv-primary-light)',
            }}
          >
            {getInitials(emp.nome, emp.cognome)}
          </div>

          {/* Info principali */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
                {emp.cognome} {emp.nome}
              </h1>
              <Badge variant={stato.variant} dot>{stato.label}</Badge>
              <Badge variant={emp.tipo === 'interno' ? 'primary' : 'info'} size="sm">
                {emp.tipo === 'interno' ? 'Interno' : 'Esterno'}
              </Badge>
            </div>
            <p className="font-mono text-sm mb-2" style={{ color: 'var(--cv-neutral-500)' }}>
              CF: {emp.codice_fiscale}
            </p>
            <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              {emp.mansione && <span>📌 {emp.mansione}</span>}
              {emp.numero_matricola && <span>🆔 Matr. {emp.numero_matricola}</span>}
              {emp.email_istituzionale && <span>✉️ {emp.email_istituzionale}</span>}
            </div>

            {/* Badge flag AIB */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {emp.is_aib_qualificato && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: '#CC840018', color: '#CC8400', border: '1px solid #CC840040' }}>
                  🔥 AIB
                </span>
              )}
              {emp.is_dos && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: '#9B59B618', color: '#9B59B6', border: '1px solid #9B59B640' }}>
                  🎯 DOS
                </span>
              )}
              {emp.is_driver && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: '#2980B918', color: '#2980B9', border: '1px solid #2980B940' }}>
                  🚗 Autista
                </span>
              )}
              {emp.is_emergency_coordinator && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: '#CC334418', color: 'var(--cv-danger)', border: '1px solid #CC334440' }}>
                  🚨 Coord. Emergenza
                </span>
              )}
            </div>
          </div>

          {/* Azioni */}
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              ✏️ Modifica
            </Button>
          </div>
        </div>

        {/* Meta footer */}
        <div className="mt-4 pt-4 flex gap-6 text-xs" style={{ borderTop: '1px solid var(--cv-neutral-200)', color: 'var(--cv-neutral-400)' }}>
          <span>Inserito il {formatDate(emp.created_at)}</span>
          <span>Aggiornato il {formatDate(emp.updated_at)}</span>
          <span>ID: #{emp.id}</span>
        </div>
      </Card>

      {/* Tab navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--cv-neutral-200)' }}
        role="tablist"
        aria-label="Sezioni fascicolo"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--cv-primary-dark)' : 'var(--cv-neutral-600)',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card padding="md">
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'anagrafica' && <TabAnagrafica emp={emp} />}
          {activeTab === 'contratto'  && <TabContratto  emp={emp} />}
          {activeTab === 'operativo'  && <TabOperativo  emp={emp} />}
          {activeTab === 'qualifiche' && <TabQualifiche empId={emp.id} />}
          {activeTab === 'documenti'  && <TabDocumenti />}
        </div>
      </Card>

      {isEditOpen && (
        <EmployeeEditModal
          employee={emp}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={setEmp}
        />
      )}

    </div>
  );
}
