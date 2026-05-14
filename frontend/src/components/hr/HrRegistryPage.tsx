'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/common/MetricCard';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SectionLead } from '@/components/common/SectionLead';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface Employee {
  id: number;
  codice_fiscale: string;
  nome: string;
  cognome: string;
  email_istituzionale?: string;
  email_personale?: string;
  tipo: 'interno' | 'esterno';
  tipo_contratto?: string;
  mansione?: string;
  stato: string;
  is_aib_qualificato: boolean;
  is_dos: boolean;
  is_driver: boolean;
}

interface EmployeeList {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface HrStats {
  totale: number;
  interni: number;
  esterni: number;
  in_servizio: number;
  cessati: number;
  aib_qualificati: number;
  dos: number;
}

const STATO_BADGE: Record<string, { variant: 'success'|'warning'|'danger'|'neutral'|'info'; label: string }> = {
  in_servizio: { variant: 'success', label: 'In servizio' },
  malattia: { variant: 'warning', label: 'Malattia' },
  infortunio: { variant: 'warning', label: 'Infortunio' },
  aspettativa: { variant: 'info', label: 'Aspettativa' },
  maternita: { variant: 'info', label: 'Maternita' },
  distaccato: { variant: 'neutral', label: 'Distaccato' },
  sospeso: { variant: 'warning', label: 'Sospeso' },
  cessato: { variant: 'danger', label: 'Cessato' },
  pensionato: { variant: 'neutral', label: 'Pensionato' },
};

const TIPO_CONTRATTO_LABEL: Record<string, string> = {
  indeterminato: 'Indeterminato',
  determinato: 'Determinato',
  stagionale: 'Stagionale',
  somministrazione: 'Somministrazione',
  collaborazione: 'Collaborazione',
  volontario: 'Volontario',
};

function getInitials(nome: string, cognome: string): string {
  return `${cognome[0] || ''}${nome[0] || ''}`.toUpperCase();
}

function avatarColor(id: number): string {
  const colors = [
    '#33996622', '#5B8FCC22', '#CC840022', '#9B59B622',
    '#16A08522', '#E67E2222', '#2980B922', '#C0392B22',
  ];
  return colors[id % colors.length];
}

interface HrRegistryPageProps {
  scope: 'all' | 'interno' | 'esterno';
  subtitle: string;
}

export default function HrRegistryPage({ scope, subtitle }: HrRegistryPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<HrStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStato, setFilterStato] = useState('');
  const [filterContratto, setFilterContratto] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const PAGE_SIZE = 25;
  const fixedTipo = scope === 'all' ? '' : scope;

  useEffect(() => {
    api.get<HrStats>('/hr/employees/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterStato) params.set('stato', filterStato);
      if (fixedTipo) params.set('tipo', fixedTipo);
      if (filterContratto) params.set('tipo_contratto', filterContratto);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));

      const data = await api.get<EmployeeList>(`/hr/employees?${params}`);
      setEmployees(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      setError('Errore nel caricamento dell\'anagrafica. Verifica che il backend sia attivo.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStato, filterContratto, fixedTipo, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchEmployees();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchEmployees]);

  const resetFilters = () => {
    setPage(1);
    setSearchInput('');
    setFilterStato('');
    setFilterContratto('');
  };

  const scopeTotal =
    scope === 'interno' ? stats?.interni :
    scope === 'esterno' ? stats?.esterni :
    stats?.totale;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SectionLead
          description={subtitle}
          detail={total > 0 ? `${total.toLocaleString('it-IT')} record in elenco` : 'Caricamento anagrafica in corso...'}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/hr/interna"><Button variant={scope === 'interno' ? 'primary' : 'outline'} size="sm">Anagrafica interna</Button></Link>
          <Link href="/hr/esterna"><Button variant={scope === 'esterno' ? 'primary' : 'outline'} size="sm">Anagrafica esterna</Button></Link>
          <Button>+ Nuovo dipendente</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <MetricCard label="Perimetro" value={statsLoading ? '...' : (scopeTotal ?? 0)} />
        </div>
        <MetricCard label="Interni" value={statsLoading ? '...' : (stats?.interni ?? 0)} accent="var(--cv-primary)" />
        <MetricCard label="Esterni" value={statsLoading ? '...' : (stats?.esterni ?? 0)} accent="var(--cv-info)" />
        <MetricCard label="In servizio" value={statsLoading ? '...' : (stats?.in_servizio ?? 0)} accent="var(--cv-success)" />
        <MetricCard label="Cessati" value={statsLoading ? '...' : (stats?.cessati ?? 0)} accent="var(--cv-danger)" />
        <MetricCard label="AIB qual." value={statsLoading ? '...' : (stats?.aib_qualificati ?? 0)} accent="#CC8400" />
        <MetricCard label="DOS" value={statsLoading ? '...' : (stats?.dos ?? 0)} accent="#9B59B6" />
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              id="hr-search"
              label=""
              placeholder="Cerca per nome, cognome, CF, email, matricola..."
              value={searchInput}
              onChange={(e) => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
            />
          </div>
          <Select
            id="hr-filter-stato"
            label=""
            value={filterStato}
            onChange={(e) => { setPage(1); setFilterStato(e.target.value); }}
            placeholder="Tutti gli stati"
            options={[
              { value: 'in_servizio', label: 'In servizio' },
              { value: 'malattia', label: 'Malattia' },
              { value: 'infortunio', label: 'Infortunio' },
              { value: 'aspettativa', label: 'Aspettativa' },
              { value: 'cessato', label: 'Cessato' },
              { value: 'pensionato', label: 'Pensionato' },
              { value: 'sospeso', label: 'Sospeso' },
            ]}
            className="sm:w-40"
          />
          <Select
            id="hr-filter-contratto"
            label=""
            value={filterContratto}
            onChange={(e) => { setPage(1); setFilterContratto(e.target.value); }}
            placeholder="Contratto"
            options={[
              { value: 'indeterminato', label: 'Indeterminato' },
              { value: 'determinato', label: 'Determinato' },
              { value: 'stagionale', label: 'Stagionale' },
              { value: 'collaborazione', label: 'Collaborazione' },
              { value: 'volontario', label: 'Volontario' },
            ]}
            className="sm:w-40"
          />
          {(filterStato || filterContratto || searchInput) && (
            <Button variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {error && <NoticeBanner title="Errore caricamento" message={error} tone="error" />}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Tabella anagrafica personale">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--cv-neutral-200)', background: 'var(--cv-neutral-50)' }}>
                {['Dipendente', 'Codice Fiscale', 'Mansione', 'Contratto', 'Tipo', 'Stato', 'Flag', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--cv-neutral-500)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded" style={{ background: 'var(--cv-neutral-200)', width: j === 0 ? '80%' : '60%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--cv-neutral-500)' }}>
                    <p className="font-semibold">Nessun record trovato</p>
                    <p className="text-sm mt-1">Prova a modificare i filtri di ricerca</p>
                  </td>
                </tr>
              ) : employees.map((emp) => {
                const stato = STATO_BADGE[emp.stato] || { variant: 'neutral' as const, label: emp.stato };
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--cv-neutral-200)' }} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: avatarColor(emp.id), color: 'var(--cv-primary)' }}>
                          {getInitials(emp.nome, emp.cognome)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--cv-neutral-900)' }}>
                            {emp.cognome} {emp.nome}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                            {emp.email_istituzionale || emp.email_personale || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs" style={{ color: 'var(--cv-neutral-700)' }}>{emp.codice_fiscale}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: 'var(--cv-neutral-700)' }}>{emp.mansione || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                        {TIPO_CONTRATTO_LABEL[emp.tipo_contratto || ''] || emp.tipo_contratto || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.tipo === 'interno' ? 'primary' : 'info'} size="sm">
                        {emp.tipo === 'interno' ? 'Interno' : 'Esterno'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={stato.variant} size="sm" dot>{stato.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {emp.is_aib_qualificato && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#CC840018', color: '#CC8400' }}>AIB</span>}
                        {emp.is_dos && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#9B59B618', color: '#9B59B6' }}>DOS</span>}
                        {emp.is_driver && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#2980B918', color: '#2980B9' }}>AUT</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/hr/dettaglio?id=${emp.id}`}>
                        <Button variant="ghost" size="sm">Fascicolo</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && employees.length > 0 && (
          <PaginationBar
            label={`Mostrando ${((page - 1) * PAGE_SIZE) + 1}-${Math.min(page * PAGE_SIZE, total)} di ${total.toLocaleString('it-IT')} record`}
            page={page}
            pages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </Card>
    </div>
  );
}
