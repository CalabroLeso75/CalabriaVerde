'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/common/MetricCard';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { ObjectCard } from '@/components/common/ObjectCard';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SectionLead } from '@/components/common/SectionLead';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { withAppBasePath } from '@/lib/app-path';

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

function objectStatusTone(stato: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const badge = STATO_BADGE[stato];
  if (!badge) return 'neutral';
  if (badge.variant === 'success') return 'success';
  if (badge.variant === 'warning') return 'warning';
  if (badge.variant === 'danger') return 'danger';
  if (badge.variant === 'info') return 'info';
  return 'neutral';
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
          <Link href={withAppBasePath('/hr/interna')}><Button variant={scope === 'interno' ? 'primary' : 'outline'} size="sm">Anagrafica interna</Button></Link>
          <Link href={withAppBasePath('/hr/esterna')}><Button variant={scope === 'esterno' ? 'primary' : 'outline'} size="sm">Anagrafica esterna</Button></Link>
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

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} padding="md" className="animate-pulse">
              <div className="h-5 w-1/3 rounded bg-[var(--cv-neutral-200)]" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((__, itemIndex) => (
                  <div key={itemIndex} className="h-4 rounded bg-[var(--cv-neutral-200)]" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card padding="md">
          <div className="py-8 text-center" style={{ color: 'var(--cv-neutral-500)' }}>
            <p className="font-semibold">Nessun record trovato</p>
            <p className="mt-1 text-sm">Prova a modificare i filtri di ricerca</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {employees.map((emp) => {
            const stato = STATO_BADGE[emp.stato] || { variant: 'neutral' as const, label: emp.stato };
            const email = emp.email_istituzionale || emp.email_personale || '-';
            return (
              <ObjectCard
                key={emp.id}
                objectType={emp.tipo === 'interno' ? 'Persona interna' : 'Persona esterna'}
                objectKey={emp.codice_fiscale}
                title={`${emp.cognome} ${emp.nome}`}
                subtitle={email}
                status={stato.label}
                statusTone={objectStatusTone(emp.stato)}
                avatar={<span style={{ background: avatarColor(emp.id) }} className="flex h-full w-full items-center justify-center rounded-[var(--cv-radius-md)]">{getInitials(emp.nome, emp.cognome)}</span>}
                draggable
                properties={[
                  { label: 'Mansione', value: emp.mansione || '-' },
                  { label: 'Contratto', value: TIPO_CONTRATTO_LABEL[emp.tipo_contratto || ''] || emp.tipo_contratto || '-' },
                  { label: 'Tipo', value: emp.tipo === 'interno' ? 'Interno' : 'Esterno', tone: emp.tipo === 'interno' ? 'primary' : 'info' },
                  { label: 'Email', value: email },
                ]}
                relations={[
                  ...(emp.is_aib_qualificato ? [{ label: 'Qualifica', value: 'AIB', tone: 'warning' as const }] : []),
                  ...(emp.is_dos ? [{ label: 'Ruolo', value: 'DOS', tone: 'info' as const }] : []),
                  ...(emp.is_driver ? [{ label: 'Abilitazione', value: 'Autista', tone: 'primary' as const }] : []),
                ]}
                actions={[{ label: 'Fascicolo', href: withAppBasePath(`/hr/dettaglio?id=${emp.id}`), variant: 'primary' }]}
              />
            );
          })}
        </div>
      )}

      {!loading && employees.length > 0 && (
        <PaginationBar
          label={`Mostrando ${((page - 1) * PAGE_SIZE) + 1}-${Math.min(page * PAGE_SIZE, total)} di ${total.toLocaleString('it-IT')} record`}
          page={page}
          pages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}
