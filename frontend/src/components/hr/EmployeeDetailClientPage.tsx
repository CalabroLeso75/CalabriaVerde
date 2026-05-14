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
import { withAppBasePath } from '@/lib/app-path';
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

interface QualificationDraft {
  tipo_qualifica: string;
  ente_rilascio: string;
  data_conseguimento: string;
  data_scadenza: string;
  note: string;
}

interface DocumentDraft {
  tipo: string;
  data_scadenza: string;
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
  ccnl_code?: string;
  ccnl_comparto?: string;
  macro_inquadramento?: string;
  profilo_professionale?: string;
  categoria_inquadramento?: string;
  posizione_economica?: string;
  orario_settimanale?: number;
  regime_orario?: string;
  scatti_anzianita?: number;
  data_prossimo_scatto?: string;
  integrativo_regionale: boolean;
  integrativo_regionale_note?: string;
  applicazione_parziale_contratto: boolean;
  applicazione_parziale_note?: string;
  provenienza_assorbimento?: string;
  ente_provenienza?: string;
  tipo_collaborazione?: string;
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
  ccnl_code: string;
  ccnl_comparto: string;
  macro_inquadramento: string;
  profilo_professionale: string;
  categoria_inquadramento: string;
  posizione_economica: string;
  orario_settimanale: string;
  regime_orario: string;
  scatti_anzianita: string;
  data_prossimo_scatto: string;
  integrativo_regionale: boolean;
  integrativo_regionale_note: string;
  applicazione_parziale_contratto: boolean;
  applicazione_parziale_note: string;
  provenienza_assorbimento: string;
  ente_provenienza: string;
  tipo_collaborazione: string;
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

function getTabsForEmployee(tipo: 'interno' | 'esterno') {
  if (tipo === 'esterno') {
    return TABS.map((tab) => tab.id === 'contratto' ? { ...tab, label: 'Collaborazione' } : tab);
  }
  return TABS;
}

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

const COLLABORAZIONE_OPTIONS = [
  { value: '', label: 'Non definita' },
  { value: 'collaborazione_generica', label: 'Collaborazione generica / da classificare' },
  { value: 'consulenza_professionale', label: 'Consulenza professionale' },
  { value: 'incarico_tecnico_specialistico', label: 'Incarico tecnico specialistico' },
  { value: 'libero_professionista_partita_iva', label: 'Libero professionista / Partita IVA' },
  { value: 'collaborazione_coordinata_continuativa', label: 'Collaborazione coordinata e continuativa' },
  { value: 'prestazione_occasionale', label: 'Prestazione occasionale' },
  { value: 'somministrazione_lavoro', label: 'Somministrazione di lavoro' },
  { value: 'appalto_servizi', label: 'Appalto di servizi' },
  { value: 'cooperativa_sociale', label: 'Cooperativa sociale / soggetto convenzionato' },
  { value: 'distacco_comando', label: 'Distacco / comando da altro ente' },
  { value: 'convenzione_ente_pubblico', label: 'Convenzione con ente pubblico' },
  { value: 'convenzione_associazione', label: 'Convenzione con associazione / ETS' },
  { value: 'tirocinio_stage', label: 'Tirocinio / stage' },
  { value: 'borsa_lavoro', label: 'Borsa lavoro / inclusione' },
  { value: 'servizio_civile', label: 'Servizio civile' },
  { value: 'volontariato', label: 'Volontariato' },
  { value: 'stagionale_esterno', label: 'Operatore stagionale esterno' },
  { value: 'altro', label: 'Altro / da definire' },
];

const CCNL_OPTIONS = [
  { value: '', label: 'Non definito' },
  { value: 'idraulico_forestale', label: 'CCNL idraulico-forestale e idraulico-agraria' },
  { value: 'funzioni_locali', label: 'CCNL funzioni locali' },
];

const MACRO_INQUADRAMENTO_OPTIONS = [
  { value: '', label: 'Non definito' },
  { value: 'operaio', label: 'Operaio' },
  { value: 'impiegato', label: 'Impiegato' },
];

const REGIME_ORARIO_OPTIONS = [
  { value: '', label: 'Non definito' },
  { value: 'tempo_pieno', label: 'Tempo pieno' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'turni', label: 'Turni' },
  { value: 'flessibile', label: 'Flessibile' },
  { value: 'multiperiodale', label: 'Multiperiodale' },
];

const PROVENIENZA_OPTIONS = [
  { value: '', label: 'Non definita' },
  { value: 'afor', label: 'Ex AFOR' },
  { value: 'comunita_montana', label: 'Ex Comunità montana' },
  { value: 'fondo_sollievo', label: 'Ex Fondo Sollievo' },
  { value: 'legge_15_2008', label: 'Ex L.R. 15/2008' },
  { value: 'lsu', label: 'Ex LSU' },
  { value: 'lpu', label: 'Ex LPU' },
  { value: 'nessuna', label: 'Nessun assorbimento' },
  { value: 'altro', label: 'Altro' },
];

const FUNZIONI_LOCALI_AREE_OPTIONS = [
  { value: '', label: 'Non definita' },
  { value: 'area_operatori', label: 'Area Operatori' },
  { value: 'area_operatori_esperti', label: 'Area Operatori esperti' },
  { value: 'area_istruttori', label: 'Area Istruttori' },
  { value: 'area_funzionari_eq', label: 'Area Funzionari ed EQ' },
  { value: 'categoria_b_storica', label: 'Categoria B storica' },
  { value: 'categoria_c_storica', label: 'Categoria C storica' },
  { value: 'categoria_d_storica', label: 'Categoria D storica' },
];

const FORESTALE_LEVEL_OPTIONS = [
  { value: '', label: 'Non definito' },
  { value: '1', label: '1° livello - Operaio comune' },
  { value: '2', label: '2° livello - Operaio qualificato' },
  { value: '3', label: '3° livello - Operaio qualificato super' },
  { value: '4', label: '4° livello - Operaio specializzato' },
  { value: '5', label: '5° livello - Operaio specializzato super' },
  { value: '1_imp', label: '1° livello impiegati' },
  { value: '2_imp', label: '2° livello impiegati' },
  { value: '3_imp', label: '3° livello impiegati' },
  { value: '4_imp', label: '4° livello impiegati' },
  { value: '5_imp', label: '5° livello impiegati' },
  { value: '6_imp', label: '6° livello impiegati' },
];

const CONTRACT_SOURCE_NOTES: Record<string, string> = {
  idraulico_forestale: 'CCNL 2021-2024: orario ordinario 39 ore; livelli operai 1-5 e impiegati 1-6; salario integrativo e altre materie rinviate al CIRL regionale.',
  funzioni_locali: 'CCNL Funzioni Locali 2019-2021: orario ordinario 36 ore; sistema per aree con progressioni economiche interne tramite differenziali stipendiali; per ex LSU/LPU assorbiti può essere necessario gestire un’applicazione solo parziale.',
};

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
    ccnl_code: emp.ccnl_code || '',
    ccnl_comparto: emp.ccnl_comparto || '',
    macro_inquadramento: emp.macro_inquadramento || '',
    profilo_professionale: emp.profilo_professionale || '',
    categoria_inquadramento: emp.categoria_inquadramento || '',
    posizione_economica: emp.posizione_economica || '',
    orario_settimanale: emp.orario_settimanale ? String(emp.orario_settimanale) : '',
    regime_orario: emp.regime_orario || '',
    scatti_anzianita: typeof emp.scatti_anzianita === 'number' ? String(emp.scatti_anzianita) : '',
    data_prossimo_scatto: toInputDate(emp.data_prossimo_scatto),
    integrativo_regionale: Boolean(emp.integrativo_regionale),
    integrativo_regionale_note: emp.integrativo_regionale_note || '',
    applicazione_parziale_contratto: Boolean(emp.applicazione_parziale_contratto),
    applicazione_parziale_note: emp.applicazione_parziale_note || '',
    provenienza_assorbimento: emp.provenienza_assorbimento || '',
    ente_provenienza: emp.ente_provenienza || '',
    tipo_collaborazione: emp.tipo_collaborazione || '',
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

function applyContractDefaults(current: EmployeeFormState, ccnlCode: string): EmployeeFormState {
  if (ccnlCode === 'idraulico_forestale') {
    return {
      ...current,
      ccnl_code: ccnlCode,
      ccnl_comparto: 'CCNL idraulico-forestale e idraulico-agraria',
      orario_settimanale: current.orario_settimanale || '39',
      regime_orario: current.regime_orario || 'tempo_pieno',
      integrativo_regionale: true,
    };
  }

  if (ccnlCode === 'funzioni_locali') {
    return {
      ...current,
      ccnl_code: ccnlCode,
      ccnl_comparto: 'CCNL funzioni locali',
      orario_settimanale: current.orario_settimanale || '36',
      regime_orario: current.regime_orario || 'flessibile',
    };
  }

  return {
    ...current,
    ccnl_code: '',
    ccnl_comparto: '',
  };
}

function normalizePayload(form: EmployeeFormState) {
  const numericFields = new Set(['orario_settimanale', 'scatti_anzianita']);
  const payload: Record<string, string | boolean | number | null> = {};
  Object.entries(form).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      payload[key] = value;
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      payload[key] = null;
      return;
    }
    payload[key] = numericFields.has(key) ? Number(trimmed) : trimmed;
  });
  return payload;
}

function normalizeCollection(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function normalizeDocumentType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9àèéìòù_\-\s]/gi, '')
    .replace(/\s+/g, '_');
}

function documentDraftsToPayload(items: DocumentDraft[]): Record<string, string> | null {
  const payload = items.reduce<Record<string, string>>((acc, item) => {
    const tipo = normalizeDocumentType(item.tipo);
    const data = item.data_scadenza.trim();
    if (tipo && data) {
      acc[tipo] = data;
    }
    return acc;
  }, {});

  return Object.keys(payload).length > 0 ? payload : null;
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
  if (emp.tipo === 'esterno') {
    const collaborazioneLabel =
      COLLABORAZIONE_OPTIONS.find((option) => option.value === emp.tipo_collaborazione)?.label
      || emp.tipo_collaborazione
      || 'Collaborazione generica';

    return (
      <div>
        <SectionTitle>Collaborazione esterna</SectionTitle>
        <FieldRow label="Tipo rapporto" value="Personale esterno" />
        <FieldRow label="Tipo collaborazione" value={collaborazioneLabel} />
        <FieldRow label="Incarico / ruolo" value={emp.mansione} />
        <FieldRow label="Ente / organizzazione" value={emp.ente_provenienza} />
        <FieldRow label="Stato" value={STATO_BADGE[emp.stato]?.label || emp.stato} />

        <SectionTitle>Decorrenza</SectionTitle>
        <FieldRow label="Data inizio" value={formatDate(emp.data_assunzione)} />
        <FieldRow label="Data fine" value={formatDate(emp.data_fine_contratto)} />

        <SectionTitle>Riferimenti</SectionTitle>
        <FieldRow label="Provenienza / sorgente" value={emp.provenienza_assorbimento?.replace(/_/g, ' ')} />
        <FieldRow label="Contatto organizzativo" value={emp.email_istituzionale || emp.telefono_lavoro} />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Tipo rapporto</SectionTitle>
      <FieldRow label="Tipo dipendente" value={emp.tipo === 'interno' ? 'Interno (dipendente diretto)' : 'Esterno (collaboratore/stagionale)'} />
      <FieldRow label="Tipo contratto" value={CONTRATTO_LABEL[emp.tipo_contratto || ''] || emp.tipo_contratto} />
      <FieldRow label="CCNL applicato" value={emp.ccnl_comparto} />
      <FieldRow label="Origine assorbimento" value={emp.provenienza_assorbimento?.replace(/_/g, ' ')} />
      <FieldRow label="Ente provenienza" value={emp.ente_provenienza} />

      <SectionTitle>Date contrattuali</SectionTitle>
      <FieldRow label="Data assunzione" value={formatDate(emp.data_assunzione)} />
      <FieldRow label="Fine contratto" value={formatDate(emp.data_fine_contratto)} />
      <FieldRow label="Prossimo scatto" value={formatDate(emp.data_prossimo_scatto)} />

      <SectionTitle>Posizione</SectionTitle>
      <FieldRow label="Numero matricola" value={emp.numero_matricola} mono />
      <FieldRow label="Mansione" value={emp.mansione} />
      <FieldRow label="Livello inquadramento" value={emp.livello_inquadramento} />
      <FieldRow label="Macro inquadramento" value={emp.macro_inquadramento} />
      <FieldRow label="Profilo professionale" value={emp.profilo_professionale} />
      <FieldRow label="Categoria / Area" value={emp.categoria_inquadramento} />
      <FieldRow label="Posizione economica" value={emp.posizione_economica} />
      <FieldRow label="Orario settimanale" value={emp.orario_settimanale ? `${emp.orario_settimanale} ore` : undefined} />
      <FieldRow label="Regime orario" value={emp.regime_orario?.replace(/_/g, ' ')} />
      <FieldRow label="Scatti / differenziali maturati" value={typeof emp.scatti_anzianita === 'number' ? String(emp.scatti_anzianita) : undefined} />
      <FieldRow label="Integrativo regionale" value={emp.integrativo_regionale ? 'Attivo' : 'Non attivo'} />
      <FieldRow label="Note integrativo" value={emp.integrativo_regionale_note} />
      <FieldRow label="Applicazione parziale contratto" value={emp.applicazione_parziale_contratto ? 'Sì' : 'No'} />
      <FieldRow label="Note applicazione parziale" value={emp.applicazione_parziale_note} />
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

function TabDocumenti({ emp }: { emp: EmployeeDetail }) {
  const allegati = Object.entries(emp.documenti_scadenza || {});

  if (emp.tipo === 'esterno') {
    return (
      <div className="space-y-5">
        <div>
          <SectionTitle>Allegati collaborazione</SectionTitle>
          {allegati.length > 0 ? (
            <div className="space-y-2">
              {allegati.map(([tipo, data]) => (
                <div
                  key={tipo}
                  className="flex items-center justify-between rounded-lg border px-3 py-3"
                  style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-surface-2)' }}
                >
                  <div>
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--cv-neutral-900)' }}>
                      {tipo.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                      Scadenza registrata
                    </p>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--cv-neutral-700)' }}>
                    {formatDate(data)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-lg border px-4 py-4"
              style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-neutral-100)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-700)' }}>
                Nessun allegato registrato
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-500)' }}>
                Qui vanno tracciati incarico o convenzione, documento di identita, curriculum, coperture assicurative e ogni altro allegato utile alla collaborazione esterna.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
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
  const [patenti, setPatenti] = useState<string[]>(employee.patenti || []);
  const [abilitazioni, setAbilitazioni] = useState<string[]>(employee.abilitazioni || []);
  const [patenteInput, setPatenteInput] = useState('');
  const [abilitazioneInput, setAbilitazioneInput] = useState('');
  const [documenti, setDocumenti] = useState<DocumentDraft[]>(
    Object.entries(employee.documenti_scadenza || {}).map(([tipo, data_scadenza]) => ({ tipo, data_scadenza }))
  );
  const [qualificationDrafts, setQualificationDrafts] = useState<QualificationDraft[]>([]);

  const update = (field: keyof EmployeeFormState, value: string | boolean) => {
    setForm((current) => {
      if (field === 'ccnl_code' && typeof value === 'string') {
        return applyContractDefaults({ ...current, ccnl_code: value }, value);
      }
      return { ...current, [field]: value };
    });
  };

  const addPatente = () => {
    const value = patenteInput.trim().toUpperCase();
    if (!value) return;
    setPatenti((current) => normalizeCollection([...current, value]));
    setPatenteInput('');
  };

  const addAbilitazione = () => {
    const value = abilitazioneInput.trim();
    if (!value) return;
    setAbilitazioni((current) => normalizeCollection([...current, value]));
    setAbilitazioneInput('');
  };

  const removePatente = (value: string) => {
    setPatenti((current) => current.filter((item) => item !== value));
  };

  const removeAbilitazione = (value: string) => {
    setAbilitazioni((current) => current.filter((item) => item !== value));
  };

  const addDocumento = () => {
    setDocumenti((current) => [...current, { tipo: '', data_scadenza: '' }]);
  };

  const updateDocumento = (index: number, field: keyof DocumentDraft, value: string) => {
    setDocumenti((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const removeDocumento = (index: number) => {
    setDocumenti((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addQualificationDraft = () => {
    setQualificationDrafts((current) => [
      ...current,
      {
        tipo_qualifica: '',
        ente_rilascio: '',
        data_conseguimento: '',
        data_scadenza: '',
        note: '',
      },
    ]);
  };

  const updateQualificationDraft = (index: number, field: keyof QualificationDraft, value: string) => {
    setQualificationDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const removeQualificationDraft = (index: number) => {
    setQualificationDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const employeePayload = {
        ...normalizePayload(form),
        patenti: patenti.length > 0 ? normalizeCollection(patenti) : null,
        abilitazioni: abilitazioni.length > 0 ? normalizeCollection(abilitazioni) : null,
        documenti_scadenza: documentDraftsToPayload(documenti),
      };

      await api.put<EmployeeDetail>(`/hr/employees/${employee.id}`, employeePayload);

      const validQualificationDrafts = qualificationDrafts.filter((item) => item.tipo_qualifica.trim());
      for (const draft of validQualificationDrafts) {
        await api.post<Qualification>(`/hr/employees/${employee.id}/qualifications`, {
          tipo_qualifica: draft.tipo_qualifica.trim(),
          ente_rilascio: draft.ente_rilascio.trim() || null,
          data_conseguimento: draft.data_conseguimento || null,
          data_scadenza: draft.data_scadenza || null,
          note: draft.note.trim() || null,
          is_attiva: true,
        });
      }

      const refreshed = await api.get<EmployeeDetail>(`/hr/employees/${employee.id}`);
      onSaved(refreshed);
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
      <div className="space-y-5 pr-1">
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

        {employee.tipo === 'interno' ? (
        <div>
          <SectionTitle>Contratto e posizione</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Tipo contratto" options={CONTRATTO_OPTIONS} value={form.tipo_contratto} onChange={(e) => update('tipo_contratto', e.target.value)} />
            <Select label="CCNL applicato" options={CCNL_OPTIONS} value={form.ccnl_code} onChange={(e) => update('ccnl_code', e.target.value)} />
            <Select label="Stato" options={STATO_OPTIONS} value={form.stato} onChange={(e) => update('stato', e.target.value)} />
            <Input label="Matricola" value={form.numero_matricola} onChange={(e) => update('numero_matricola', e.target.value)} />
            <Input label="Mansione" value={form.mansione} onChange={(e) => update('mansione', e.target.value)} />
            <Input label="Livello inquadramento" value={form.livello_inquadramento} onChange={(e) => update('livello_inquadramento', e.target.value)} />
          </div>
          {form.ccnl_code && (
            <p className="mt-3 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
              {CONTRACT_SOURCE_NOTES[form.ccnl_code]}
            </p>
          )}
        </div>
        ) : (
        <div>
          <SectionTitle>Collaborazione</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Tipo collaborazione" options={COLLABORAZIONE_OPTIONS} value={form.tipo_collaborazione} onChange={(e) => update('tipo_collaborazione', e.target.value)} />
            <Select label="Stato" options={STATO_OPTIONS} value={form.stato} onChange={(e) => update('stato', e.target.value)} />
            <Input label="Incarico / ruolo" value={form.mansione} onChange={(e) => update('mansione', e.target.value)} />
            <Input label="Ente / organizzazione" value={form.ente_provenienza} onChange={(e) => update('ente_provenienza', e.target.value)} />
          </div>
          <div className="mt-3 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-600)' }}>
            La scheda del personale esterno non usa il profilo contrattuale dei dipendenti interni. Qui gestiamo solo la natura della collaborazione con Calabria Verde.
          </div>
        </div>
        )}

        {employee.tipo === 'interno' && (
        <div>
          <SectionTitle>Profilo contrattuale</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Comparto CCNL" value={form.ccnl_comparto} onChange={(e) => update('ccnl_comparto', e.target.value)} />
            <Select label="Macro inquadramento" options={MACRO_INQUADRAMENTO_OPTIONS} value={form.macro_inquadramento} onChange={(e) => update('macro_inquadramento', e.target.value)} />
            {form.ccnl_code === 'idraulico_forestale' ? (
              <Select label="Livello contrattuale" options={FORESTALE_LEVEL_OPTIONS} value={form.livello_inquadramento} onChange={(e) => update('livello_inquadramento', e.target.value)} />
            ) : (
              <Select label="Categoria / Area" options={FUNZIONI_LOCALI_AREE_OPTIONS} value={form.categoria_inquadramento} onChange={(e) => update('categoria_inquadramento', e.target.value)} />
            )}
            <Input label="Profilo professionale" value={form.profilo_professionale} onChange={(e) => update('profilo_professionale', e.target.value)} />
            <Input label="Posizione economica" value={form.posizione_economica} onChange={(e) => update('posizione_economica', e.target.value)} />
            <Input label="Orario settimanale" type="number" min="0" max="48" value={form.orario_settimanale} onChange={(e) => update('orario_settimanale', e.target.value)} />
            <Select label="Regime orario" options={REGIME_ORARIO_OPTIONS} value={form.regime_orario} onChange={(e) => update('regime_orario', e.target.value)} />
            <Input label="Scatti / differenziali maturati" type="number" min="0" max="12" value={form.scatti_anzianita} onChange={(e) => update('scatti_anzianita', e.target.value)} />
            <Input label="Data prossimo scatto" type="date" value={form.data_prossimo_scatto} onChange={(e) => update('data_prossimo_scatto', e.target.value)} />
            <Select label="Provenienza assorbimento" options={PROVENIENZA_OPTIONS} value={form.provenienza_assorbimento} onChange={(e) => update('provenienza_assorbimento', e.target.value)} />
            <Input label="Ente provenienza" value={form.ente_provenienza} onChange={(e) => update('ente_provenienza', e.target.value)} />
          </div>
          <label className="mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-neutral-300)' }}>
            <input
              type="checkbox"
              checked={form.integrativo_regionale}
              onChange={(e) => update('integrativo_regionale', e.target.checked)}
            />
            Applicazione integrativo regionale
          </label>
          <label className="mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-neutral-300)' }}>
            <input
              type="checkbox"
              checked={form.applicazione_parziale_contratto}
              onChange={(e) => update('applicazione_parziale_contratto', e.target.checked)}
            />
            Applicazione solo parziale del contratto
          </label>
          <div className="mt-3">
            <Input label="Note integrativo / particolarità contrattuali" value={form.integrativo_regionale_note} onChange={(e) => update('integrativo_regionale_note', e.target.value)} />
          </div>
          <div className="mt-3">
            <Input label="Note applicazione parziale" value={form.applicazione_parziale_note} onChange={(e) => update('applicazione_parziale_note', e.target.value)} />
          </div>
        </div>
        )}

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
          <SectionTitle>Patenti di guida</SectionTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              label="Aggiungi patente"
              placeholder="Es. B, C, D, CE"
              value={patenteInput}
              onChange={(e) => setPatenteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPatente();
                }
              }}
            />
            <div className="sm:self-end">
              <Button type="button" variant="outline" onClick={addPatente}>
                Aggiungi patente
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {patenti.length > 0 ? patenti.map((patente) => (
              <button
                key={patente}
                type="button"
                onClick={() => removePatente(patente)}
                className="rounded-full border px-3 py-1 text-sm font-semibold"
                style={{ borderColor: 'var(--cv-primary-light)', background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary-dark)' }}
              >
                {patente} ×
              </button>
            )) : (
              <p className="text-sm" style={{ color: 'var(--cv-neutral-500)' }}>Nessuna patente inserita.</p>
            )}
          </div>
        </div>

        <div>
          <SectionTitle>Abilitazioni</SectionTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              label="Aggiungi abilitazione"
              placeholder="Es. motosega, gru, decespugliatore"
              value={abilitazioneInput}
              onChange={(e) => setAbilitazioneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAbilitazione();
                }
              }}
            />
            <div className="sm:self-end">
              <Button type="button" variant="outline" onClick={addAbilitazione}>
                Aggiungi abilitazione
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {abilitazioni.length > 0 ? abilitazioni.map((abilitazione) => (
              <button
                key={abilitazione}
                type="button"
                onClick={() => removeAbilitazione(abilitazione)}
                className="rounded-full border px-3 py-1 text-sm font-medium"
                style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-800)' }}
              >
                {abilitazione} ×
              </button>
            )) : (
              <p className="text-sm" style={{ color: 'var(--cv-neutral-500)' }}>Nessuna abilitazione inserita.</p>
            )}
          </div>
        </div>

        <div>
          <SectionTitle>Documenti e scadenze</SectionTitle>
          <div className="space-y-3">
            {documenti.map((documento, index) => (
              <div key={`${documento.tipo}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 rounded-lg border p-3"
                style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-neutral-100)' }}>
                <Input
                  label="Tipo documento"
                  placeholder="Es. carta_identita, contratto, patentino"
                  value={documento.tipo}
                  onChange={(e) => updateDocumento(index, 'tipo', e.target.value)}
                />
                <Input
                  label="Scadenza"
                  type="date"
                  value={documento.data_scadenza}
                  onChange={(e) => updateDocumento(index, 'data_scadenza', e.target.value)}
                />
                <div className="sm:self-end">
                  <Button type="button" variant="ghost" onClick={() => removeDocumento(index)}>
                    Rimuovi
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addDocumento}>
              Aggiungi documento
            </Button>
          </div>
        </div>

        <div>
          <SectionTitle>Qualifiche</SectionTitle>
          {employee.qualifiche && employee.qualifiche.length > 0 && (
            <div className="mb-4 space-y-2">
              {employee.qualifiche.map((qualifica) => (
                <div key={qualifica.id} className="rounded-lg border px-3 py-3"
                  style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-neutral-100)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                    {qualifica.tipo_qualifica.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                    {qualifica.ente_rilascio || 'Ente non indicato'}
                    {qualifica.data_scadenza ? ` • Scade ${formatDate(qualifica.data_scadenza)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {qualificationDrafts.map((draft, index) => (
              <div key={`qualification-draft-${index}`} className="rounded-lg border p-3"
                style={{ borderColor: 'var(--cv-neutral-300)', background: 'var(--cv-neutral-100)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Tipo qualifica"
                    placeholder="Es. DOS, motosega, AIB"
                    value={draft.tipo_qualifica}
                    onChange={(e) => updateQualificationDraft(index, 'tipo_qualifica', e.target.value)}
                  />
                  <Input
                    label="Ente rilascio"
                    value={draft.ente_rilascio}
                    onChange={(e) => updateQualificationDraft(index, 'ente_rilascio', e.target.value)}
                  />
                  <Input
                    label="Data conseguimento"
                    type="date"
                    value={draft.data_conseguimento}
                    onChange={(e) => updateQualificationDraft(index, 'data_conseguimento', e.target.value)}
                  />
                  <Input
                    label="Data scadenza"
                    type="date"
                    value={draft.data_scadenza}
                    onChange={(e) => updateQualificationDraft(index, 'data_scadenza', e.target.value)}
                  />
                </div>
                <div className="mt-3">
                  <label className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                    Note
                  </label>
                  <textarea
                    className="mt-1 w-full min-h-20 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cv-primary)]"
                    style={{ borderColor: 'var(--cv-neutral-300)', color: 'var(--cv-neutral-900)' }}
                    value={draft.note}
                    onChange={(e) => updateQualificationDraft(index, 'note', e.target.value)}
                  />
                </div>
                <div className="mt-3">
                  <Button type="button" variant="ghost" onClick={() => removeQualificationDraft(index)}>
                    Rimuovi qualifica
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addQualificationDraft}>
              Aggiungi qualifica
            </Button>
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
            <Button variant="outline" className="mt-4" onClick={() => router.push(withAppBasePath('/hr'))}>
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
        <Link href={withAppBasePath('/hr')}>
          <Button variant="ghost" size="sm">← Torna alla lista</Button>
        </Link>
        <Card>
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-semibold" style={{ color: 'var(--cv-danger)' }}>{error || 'Dipendente non trovato'}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(withAppBasePath('/hr'))}>
              Torna alla lista HR
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stato = STATO_BADGE[emp.stato] || { variant: 'neutral' as const, label: emp.stato };
  const tabs = getTabsForEmployee(emp.tipo);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href={withAppBasePath('/hr')} className="hover:underline" style={{ color: 'var(--cv-primary)' }}>
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
        {tabs.map((tab) => (
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
          {activeTab === 'documenti'  && <TabDocumenti emp={emp} />}
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
