'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MetricCard } from '@/components/common/MetricCard';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SectionLead } from '@/components/common/SectionLead';

type Summary = {
  countries: number;
  regions: number;
  provinces: number;
  municipalities: number;
  province_boundaries: number;
  municipality_boundaries: number;
  calabria_toponyms: number;
};

type Country = { id: number; name: string; iso2?: string | null; cadastral_code?: string | null; is_italy: boolean };
type Region = { id: number; country_id: number; name: string; code?: string | null };
type Province = { id: number; region_id: number; name: string; code?: string | null; istat_code?: string | null };
type Municipality = { id: number; province_id: number; name: string; cadastral_code?: string | null; status?: string | null };
type Toponym = { id: number; province_id?: number | null; municipality_id?: number | null; name: string; latitude: number; longitude: number };
type Boundary = { id: number; source_name?: string | null; centroid_latitude?: number | null; centroid_longitude?: number | null };
type Paginated<T> = { items: T[]; total: number; page: number; page_size: number; pages: number };
type RowItem = Country | Region | Province | Municipality | Boundary | Toponym;

type DatasetKey = 'countries' | 'regions' | 'provinces' | 'municipalities' | 'province-boundaries' | 'municipality-boundaries' | 'toponyms';

const DATASET_OPTIONS: { value: DatasetKey; label: string }[] = [
  { value: 'countries', label: 'Stati' },
  { value: 'regions', label: 'Regioni' },
  { value: 'provinces', label: 'Province' },
  { value: 'municipalities', label: 'Comuni' },
  { value: 'province-boundaries', label: 'Confini province' },
  { value: 'municipality-boundaries', label: 'Confini comuni' },
  { value: 'toponyms', label: 'Toponimi Calabria' },
];

export default function GeographyWorkbench() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [dataset, setDataset] = useState<DatasetKey>('countries');
  const [countryId, setCountryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedCountryId = countryId ? Number(countryId) : undefined;
  const selectedRegionId = regionId ? Number(regionId) : undefined;
  const selectedProvinceId = provinceId ? Number(provinceId) : undefined;

  const filteredRegions = useMemo(
    () => regions.filter((item) => !selectedCountryId || item.country_id === selectedCountryId),
    [regions, selectedCountryId],
  );

  const filteredProvinces = useMemo(
    () => provinces.filter((item) => !selectedRegionId || item.region_id === selectedRegionId),
    [provinces, selectedRegionId],
  );

  const loadLookups = useCallback(async () => {
    const [summaryData, countryData, regionData, provinceData] = await Promise.all([
      api.get<Summary>('/admin/geography/summary'),
      api.get<Country[]>('/admin/geography/countries'),
      api.get<Region[]>('/admin/geography/regions'),
      api.get<Province[]>('/admin/geography/provinces'),
    ]);
    setSummary(summaryData);
    setCountries(countryData);
    setRegions(regionData);
    setProvinces(provinceData);
  }, []);

  const loadDataset = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCountryId && dataset === 'regions') params.set('country_id', String(selectedCountryId));
      if (selectedRegionId && dataset === 'provinces') params.set('region_id', String(selectedRegionId));
      if (selectedProvinceId && (dataset === 'municipalities' || dataset === 'toponyms')) params.set('province_id', String(selectedProvinceId));
      params.set('page', String(page));
      params.set('page_size', '25');

      if (dataset === 'countries') {
        const items = await api.get<Country[]>(`/admin/geography/countries${search ? `?search=${encodeURIComponent(search)}` : ''}`);
        setRows(items);
        setTotal(items.length);
        setPages(1);
      } else if (dataset === 'regions') {
        const items = await api.get<Region[]>(`/admin/geography/regions?${params}`);
        setRows(items);
        setTotal(items.length);
        setPages(1);
      } else if (dataset === 'provinces') {
        const items = await api.get<Province[]>(`/admin/geography/provinces?${params}`);
        setRows(items);
        setTotal(items.length);
        setPages(1);
      } else if (dataset === 'municipalities') {
        const data = await api.get<Paginated<Municipality>>(`/admin/geography/municipalities?${params}`);
        setRows(data.items);
        setTotal(data.total);
        setPages(data.pages || 1);
      } else if (dataset === 'province-boundaries') {
        const data = await api.get<Paginated<Boundary>>(`/admin/geography/province-boundaries?${params}`);
        setRows(data.items);
        setTotal(data.total);
        setPages(data.pages || 1);
      } else if (dataset === 'municipality-boundaries') {
        const data = await api.get<Paginated<Boundary>>(`/admin/geography/municipality-boundaries?${params}`);
        setRows(data.items);
        setTotal(data.total);
        setPages(data.pages || 1);
      } else {
        const data = await api.get<Paginated<Toponym>>(`/admin/geography/calabria-toponyms?${params}`);
        setRows(data.items);
        setTotal(data.total);
        setPages(data.pages || 1);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Caricamento modulo geografico non riuscito.');
      setRows([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [dataset, search, selectedCountryId, selectedRegionId, selectedProvinceId, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLookups();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLookups]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDataset();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDataset]);

  const resetFilters = () => {
    setCountryId('');
    setRegionId('');
    setProvinceId('');
    setSearch('');
    setPage(1);
  };

  const italyCountry = countries.find((item) => item.is_italy);

  const renderRow = (row: RowItem) => {
    switch (dataset) {
      case 'countries': {
        const item = row as Country;
        return (
          <>
            <td className="px-4 py-3 text-sm">{item.name}</td>
            <td className="px-4 py-3 text-sm">{item.iso2 || '-'}</td>
            <td className="px-4 py-3 text-sm">{item.cadastral_code || '-'}</td>
            <td className="px-4 py-3 text-sm">{item.is_italy ? 'Si' : 'No'}</td>
          </>
        );
      }
      case 'regions': {
        const item = row as Region;
        return (
          <>
            <td className="px-4 py-3 text-sm">{item.name}</td>
            <td className="px-4 py-3 text-sm">{item.code || '-'}</td>
            <td className="px-4 py-3 text-sm">{countries.find((c) => c.id === item.country_id)?.name || '-'}</td>
          </>
        );
      }
      case 'provinces': {
        const item = row as Province;
        return (
          <>
            <td className="px-4 py-3 text-sm">{item.name}</td>
            <td className="px-4 py-3 text-sm">{item.code || '-'}</td>
            <td className="px-4 py-3 text-sm">{item.istat_code || '-'}</td>
          </>
        );
      }
      case 'municipalities': {
        const item = row as Municipality;
        return (
          <>
            <td className="px-4 py-3 text-sm">{item.name}</td>
            <td className="px-4 py-3 text-sm">{item.cadastral_code || '-'}</td>
            <td className="px-4 py-3 text-sm">{item.status || '-'}</td>
          </>
        );
      }
      case 'toponyms': {
        const item = row as Toponym;
        return (
          <>
            <td className="px-4 py-3 text-sm">{item.name}</td>
            <td className="px-4 py-3 text-sm">{item.latitude}</td>
            <td className="px-4 py-3 text-sm">{item.longitude}</td>
          </>
        );
      }
      default: {
        const item = row as Boundary;
        return (
          <>
            <td className="px-4 py-3 text-sm">{item.source_name || '-'}</td>
            <td className="px-4 py-3 text-sm">{item.centroid_latitude ?? '-'}</td>
            <td className="px-4 py-3 text-sm">{item.centroid_longitude ?? '-'}</td>
          </>
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <SectionLead
        description="Modulo geografico multiuso per anagrafiche territoriali, confini amministrativi e toponimi."
        detail={`Dataset attivo: ${DATASET_OPTIONS.find((item) => item.value === dataset)?.label}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard label="Stati" value={summary?.countries ?? '...'} />
        <MetricCard label="Regioni" value={summary?.regions ?? '...'} />
        <MetricCard label="Province" value={summary?.provinces ?? '...'} />
        <MetricCard label="Comuni" value={summary?.municipalities ?? '...'} />
        <MetricCard label="Confini prov." value={summary?.province_boundaries ?? '...'} />
        <MetricCard label="Confini com." value={summary?.municipality_boundaries ?? '...'} />
        <MetricCard label="Toponimi" value={summary?.calabria_toponyms ?? '...'} />
      </div>

      <Card padding="sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select id="geo-dataset" label="" value={dataset} onChange={(e) => { setDataset(e.target.value as DatasetKey); setPage(1); }} options={DATASET_OPTIONS} />
          <Select
            id="geo-country"
            label=""
            value={countryId}
            onChange={(e) => { setCountryId(e.target.value); setRegionId(''); setProvinceId(''); setPage(1); }}
            placeholder={italyCountry ? `Stato (${italyCountry.name} disponibile)` : 'Stato'}
            options={countries.map((item) => ({ value: String(item.id), label: item.name }))}
          />
          <Select
            id="geo-region"
            label=""
            value={regionId}
            onChange={(e) => { setRegionId(e.target.value); setProvinceId(''); setPage(1); }}
            placeholder="Regione"
            options={filteredRegions.map((item) => ({ value: String(item.id), label: item.name }))}
          />
          <Select
            id="geo-province"
            label=""
            value={provinceId}
            onChange={(e) => { setProvinceId(e.target.value); setPage(1); }}
            placeholder="Provincia"
            options={filteredProvinces.map((item) => ({ value: String(item.id), label: `${item.name}${item.code ? ` (${item.code})` : ''}` }))}
          />
          <Input
            id="geo-search"
            label=""
            placeholder="Cerca nome o codice..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" onClick={resetFilters}>Reset</Button>
        </div>
      </Card>

      {error && <NoticeBanner title="Errore caricamento" message={error} tone="error" />}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--cv-neutral-200)', background: 'var(--cv-neutral-50)' }}>
                {dataset === 'countries' && ['Nome', 'ISO2', 'Codice catastale', 'Italia'].map((h) => <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>)}
                {dataset === 'regions' && ['Nome', 'Codice', 'Stato'].map((h) => <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>)}
                {dataset === 'provinces' && ['Nome', 'Sigla', 'ISTAT'].map((h) => <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>)}
                {dataset === 'municipalities' && ['Nome', 'Codice catastale', 'Stato'].map((h) => <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>)}
                {(dataset === 'province-boundaries' || dataset === 'municipality-boundaries') && ['Sorgente', 'Centro lat', 'Centro lon'].map((h) => <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>)}
                {dataset === 'toponyms' && ['Nome', 'Latitudine', 'Longitudine'].map((h) => <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                    Caricamento dataset...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                    Nessun dato disponibile per i filtri correnti.
                  </td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--cv-neutral-200)' }}>
                  {renderRow(row)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(dataset === 'municipalities' || dataset === 'province-boundaries' || dataset === 'municipality-boundaries' || dataset === 'toponyms') && !loading && rows.length > 0 && (
          <PaginationBar
            label={`Totale ${total.toLocaleString('it-IT')} record`}
            page={page}
            pages={pages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(pages, p + 1))}
          />
        )}
      </Card>
    </div>
  );
}
