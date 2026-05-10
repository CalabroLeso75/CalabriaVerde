'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Tipi per il dipendente
interface Employee {
  id: number;
  codice_fiscale: string;
  nome: string;
  cognome: string;
  email_istituzionale?: string;
  telefono_lavoro?: string;
  tipo_contratto?: string;
  stato: string;
  mansione?: string;
  data_assunzione?: string;
  organization_id?: number;
}

const statoColors: Record<string, { bg: string; text: string; label: string }> = {
  in_servizio:  { bg: '#00804015', text: '#008040', label: 'In servizio' },
  malattia:     { bg: '#CC840015', text: '#CC8400', label: 'Malattia' },
  aspettativa:  { bg: '#5B8FCC15', text: '#5B8FCC', label: 'Aspettativa' },
  distaccato:   { bg: '#33996615', text: '#339966', label: 'Distaccato' },
  infortunio:   { bg: '#CC334415', text: '#CC3344', label: 'Infortunio' },
  maternita:    { bg: '#A8870A15', text: '#A8870A', label: 'Maternità' },
  sospeso:      { bg: '#40404015', text: '#404040', label: 'Sospeso' },
  cessato:      { bg: '#40404015', text: '#A3A3A3', label: 'Cessato' },
};

// Dati demo per sviluppo (verranno sostituiti con chiamate API reali)
const DEMO_EMPLOYEES: Employee[] = [
  { id: 1, codice_fiscale: 'CSNRFL75A12F537W', nome: 'Raffaele', cognome: 'Cusano', email_istituzionale: 'raffaele.cusano@calabriaverde.eu', telefono_lavoro: '0965 123456', tipo_contratto: 'indeterminato', stato: 'in_servizio', mansione: 'Direttore Generale', data_assunzione: '2010-03-15' },
  { id: 2, codice_fiscale: 'FRRMNC82B45F537K', nome: 'Monica', cognome: 'Ferraro', email_istituzionale: 'monica.ferraro@calabriaverde.eu', telefono_lavoro: '0965 123457', tipo_contratto: 'indeterminato', stato: 'in_servizio', mansione: 'Responsabile HR', data_assunzione: '2012-06-01' },
  { id: 3, codice_fiscale: 'CTLLNZ90C15F537M', nome: 'Lorenzo', cognome: 'Cataldo', email_istituzionale: 'lorenzo.cataldo@calabriaverde.eu', telefono_lavoro: '0965 123458', tipo_contratto: 'determinato', stato: 'in_servizio', mansione: 'DOS - Distaccamento Cosenza', data_assunzione: '2020-04-01' },
  { id: 4, codice_fiscale: 'MLRGRG88D22F537R', nome: 'Giorgio', cognome: 'Malara', email_istituzionale: 'giorgio.malara@calabriaverde.eu', tipo_contratto: 'stagionale', stato: 'in_servizio', mansione: 'Operatore AIB Squadra 3', data_assunzione: '2024-05-01' },
  { id: 5, codice_fiscale: 'GRCPTR85E10F537Z', nome: 'Pietro', cognome: 'Greco', email_istituzionale: 'pietro.greco@calabriaverde.eu', tipo_contratto: 'indeterminato', stato: 'malattia', mansione: 'Autista - Parco Macchine', data_assunzione: '2015-09-10' },
];

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(DEMO_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [statoFilter, setStatoFilter] = useState('');
  const [loading] = useState(false);

  // Filtro client-side (demo) — in produzione sarà server-side
  const filtered = employees.filter((emp) => {
    const searchMatch =
      !search ||
      `${emp.nome} ${emp.cognome} ${emp.codice_fiscale} ${emp.email_istituzionale || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const statoMatch = !statoFilter || emp.stato === statoFilter;
    return searchMatch && statoMatch;
  });

  const stats = {
    total: employees.length,
    in_servizio: employees.filter((e) => e.stato === 'in_servizio').length,
    malattia: employees.filter((e) => e.stato === 'malattia').length,
    altri: employees.filter((e) => !['in_servizio', 'malattia'].includes(e.stato)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header pagina */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
            Risorse Umane
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
            Anagrafica evoluta dei dipendenti
          </p>
        </div>
        <Link href="/hr/new">
          <Button
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Nuovo Dipendente
          </Button>
        </Link>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Totale', value: stats.total, color: 'var(--cv-primary)' },
          { label: 'In servizio', value: stats.in_servizio, color: 'var(--cv-success)' },
          { label: 'Malattia/Infort.', value: stats.malattia, color: 'var(--cv-warning)' },
          { label: 'Altri stati', value: stats.altri, color: 'var(--cv-neutral-600)' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 rounded-lg border bg-white flex items-center gap-3"
            style={{ borderColor: 'var(--cv-neutral-300)' }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--cv-neutral-600)' }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filtri e ricerca */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <Input
              id="hr-search"
              label="Cerca dipendente"
              placeholder="Nome, cognome, codice fiscale, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-sm font-semibold block mb-1" style={{ color: 'var(--cv-neutral-800)' }}>
              Stato
            </label>
            <select
              id="hr-stato-filter"
              value={statoFilter}
              onChange={(e) => setStatoFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                borderColor: 'var(--cv-neutral-300)',
                color: 'var(--cv-neutral-800)',
              }}
            >
              <option value="">Tutti gli stati</option>
              {Object.entries(statoColors).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          {(search || statoFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setStatoFilter(''); }}
            >
              Pulisci filtri
            </Button>
          )}
        </div>
      </Card>

      {/* Tabella dipendenti */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--cv-neutral-200)', background: 'var(--cv-neutral-100)' }}>
                {['Dipendente', 'Codice Fiscale', 'Contatti', 'Contratto', 'Mansione', 'Stato', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--cv-neutral-600)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--cv-neutral-500)' }}>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Caricamento...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--cv-neutral-500)' }}>
                    Nessun dipendente trovato
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const stato = statoColors[emp.stato] || statoColors.cessato;
                  return (
                    <tr
                      key={emp.id}
                      className="transition-colors border-b"
                      style={{ borderColor: 'var(--cv-neutral-200)' }}
                    >
                      {/* Nome */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary-dark)' }}
                          >
                            {emp.cognome[0]}{emp.nome[0]}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                              {emp.cognome} {emp.nome}
                            </p>
                            {emp.data_assunzione && (
                              <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                                Dal {new Date(emp.data_assunzione).toLocaleDateString('it-IT', { year: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CF */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: 'var(--cv-neutral-700)' }}>
                          {emp.codice_fiscale}
                        </span>
                      </td>

                      {/* Contatti */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {emp.email_istituzionale && (
                            <p className="text-xs" style={{ color: 'var(--cv-neutral-700)' }}>
                              {emp.email_istituzionale}
                            </p>
                          )}
                          {emp.telefono_lavoro && (
                            <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                              {emp.telefono_lavoro}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Contratto */}
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize" style={{ color: 'var(--cv-neutral-700)' }}>
                          {emp.tipo_contratto?.replace('_', ' ') || '—'}
                        </span>
                      </td>

                      {/* Mansione */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--cv-neutral-700)' }}>
                          {emp.mansione || '—'}
                        </span>
                      </td>

                      {/* Stato */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: stato.bg, color: stato.text }}
                        >
                          {stato.label}
                        </span>
                      </td>

                      {/* Azioni */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/hr/${emp.id}`}
                          className="text-xs font-medium transition-colors"
                          style={{ color: 'var(--cv-primary)' }}
                        >
                          Fascicolo →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tabella */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between text-xs"
          style={{ borderColor: 'var(--cv-neutral-200)', color: 'var(--cv-neutral-500)' }}
        >
          <span>
            Mostrando {filtered.length} di {employees.length} dipendenti
          </span>
          <span>
            Dati aggiornati in tempo reale
          </span>
        </div>
      </Card>
    </div>
  );
}
