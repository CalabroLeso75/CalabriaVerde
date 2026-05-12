'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { analyzeFiscalCode, generateFiscalCode } from '@/lib/fiscalCode';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type EmployeeHit = {
  id: number;
  codice_fiscale: string;
  nome: string;
  cognome: string;
  tipo: 'interno' | 'esterno';
  mansione?: string;
  stato: string;
};

type EmployeeListResponse = {
  items: EmployeeHit[];
  total: number;
};

type MunicipalityHit = {
  id: number;
  province_id: number;
  name: string;
  cadastral_code?: string | null;
  istat_code?: string | null;
  status?: string | null;
};

type CountryHit = {
  id: number;
  name: string;
  iso2?: string | null;
  cadastral_code?: string | null;
  is_italy: boolean;
};

type ProvinceHit = {
  id: number;
  name: string;
  code?: string | null;
};

type GeoPaginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

type PlaceHit =
  | (MunicipalityHit & { kind: 'municipality' })
  | (CountryHit & { kind: 'country' });

type Mode = 'search' | 'decode' | 'generate' | 'places';

const modeButtons: { value: Mode; label: string }[] = [
  { value: 'search', label: 'Ricerca per CF' },
  { value: 'decode', label: 'Analizza codice' },
  { value: 'generate', label: 'Codice inverso' },
  { value: 'places', label: 'Codici luogo' },
];

export default function FiscalCodeWorkbench() {
  const [mode, setMode] = useState<Mode>('search');
  const [searchCf, setSearchCf] = useState('');
  const [hits, setHits] = useState<EmployeeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [decodeCf, setDecodeCf] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeHits, setPlaceHits] = useState<PlaceHit[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [provinceLookup, setProvinceLookup] = useState<Record<number, ProvinceHit>>({});
  const [generator, setGenerator] = useState({
    surname: '',
    name: '',
    birthDate: '',
    gender: 'M',
    placeCode: '',
  });

  const decoded = useMemo(() => analyzeFiscalCode(decodeCf), [decodeCf]);
  const generatedCode = useMemo(() => {
    if (!generator.surname || !generator.name || !generator.birthDate || !generator.placeCode) {
      return '';
    }
    try {
      return generateFiscalCode({
        surname: generator.surname,
        name: generator.name,
        birthDate: generator.birthDate,
        gender: generator.gender as 'M' | 'F',
        placeCode: generator.placeCode,
      });
    } catch {
      return '';
    }
  }, [generator]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const provinces = await api.get<ProvinceHit[]>('/admin/geography/provinces');
        setProvinceLookup(
          provinces.reduce<Record<number, ProvinceHit>>((accumulator, item) => {
            accumulator[item.id] = item;
            return accumulator;
          }, {}),
        );
      } catch {
        setProvinceLookup({});
      }
    };

    void loadProvinces();
  }, []);

  useEffect(() => {
    if (mode !== 'search') {
      return;
    }
    const normalized = searchCf.trim().toUpperCase();
    if (normalized.length < 6) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError('');
      try {
        const data = await api.get<EmployeeListResponse>(`/hr/employees?search=${encodeURIComponent(normalized)}&page=1&page_size=20`);
        const ordered = [...data.items].sort((a, b) => {
          const aExact = a.codice_fiscale === normalized ? 0 : 1;
          const bExact = b.codice_fiscale === normalized ? 0 : 1;
          return aExact - bExact || a.cognome.localeCompare(b.cognome);
        });
        setHits(ordered);
      } catch (err) {
        setHits([]);
        setSearchError(err instanceof ApiError ? err.message : 'Ricerca non riuscita.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [mode, searchCf]);

  useEffect(() => {
    if (mode !== 'places') {
      return;
    }

    const normalized = placeSearch.trim();
    if (normalized.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setPlaceLoading(true);
      setPlaceError('');
      try {
        const [municipalityData, countryData] = await Promise.all([
          api.get<GeoPaginated<MunicipalityHit>>(`/admin/geography/municipalities?search=${encodeURIComponent(normalized)}&page=1&page_size=15`),
          api.get<CountryHit[]>(`/admin/geography/countries?search=${encodeURIComponent(normalized)}`),
        ]);

        const municipalityHits: PlaceHit[] = municipalityData.items.map((item) => ({ ...item, kind: 'municipality' }));
        const countryHits: PlaceHit[] = countryData
          .filter((item) => item.cadastral_code)
          .map((item) => ({ ...item, kind: 'country' }));

        setPlaceHits([...municipalityHits, ...countryHits]);
      } catch (err) {
        setPlaceHits([]);
        setPlaceError(err instanceof ApiError ? err.message : 'Ricerca codici luogo non riuscita.');
      } finally {
        setPlaceLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [mode, placeSearch]);

  const applyPlaceCode = (placeCode: string) => {
    setGenerator((current) => ({ ...current, placeCode }));
    setMode('generate');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Strumento rapido per ricerca anagrafica, analisi e generazione del codice fiscale.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {modeButtons.map((item) => (
          <Button
            key={item.value}
            variant={mode === item.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {mode === 'search' && (
        <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
          <Card padding="md">
            <div className="space-y-4">
              <Input
                id="tool-search-cf"
                label="Codice fiscale"
                placeholder="Inserisci o incolla il CF"
                value={searchCf}
                onChange={(e) => {
                  setSearchCf(e.target.value.toUpperCase());
                  if (e.target.value.trim().length < 6) {
                    setHits([]);
                    setSearchError('');
                  }
                }}
              />
              <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Cerca in anagrafica interna ed esterna e ordina in alto le corrispondenze esatte.
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--cv-neutral-200)', background: 'var(--cv-neutral-50)' }}>
                    {['Dipendente', 'Codice Fiscale', 'Tipo', 'Stato', 'Mansione'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                        Ricerca in corso...
                      </td>
                    </tr>
                  ) : searchError ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-danger)' }}>
                        {searchError}
                      </td>
                    </tr>
                  ) : hits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                        Inserisci almeno 6 caratteri per avviare la ricerca.
                      </td>
                    </tr>
                  ) : hits.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--cv-neutral-200)' }}>
                      <td className="px-4 py-3 text-sm font-medium">{item.cognome} {item.nome}</td>
                      <td className="px-4 py-3 text-sm font-mono">{item.codice_fiscale}</td>
                      <td className="px-4 py-3 text-sm">{item.tipo === 'interno' ? 'Interno' : 'Esterno'}</td>
                      <td className="px-4 py-3 text-sm">{item.stato}</td>
                      <td className="px-4 py-3 text-sm">{item.mansione || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {mode === 'decode' && (
        <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
          <Card padding="md">
            <div className="space-y-4">
              <Input
                id="tool-decode-cf"
                label="Codice fiscale da analizzare"
                placeholder="RSSMRA85M01H501U"
                value={decodeCf}
                onChange={(e) => setDecodeCf(e.target.value.toUpperCase())}
              />
              <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Controlla formato, carattere di controllo e parti anagrafiche estraibili.
              </p>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>Validazione</p>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-semibold">Formato:</span> {decoded.isFormatValid ? 'valido' : 'non valido'}</p>
                <p><span className="font-semibold">Carattere di controllo:</span> {decoded.isCheckCharValid ? 'coerente' : 'non coerente'}</p>
                <p><span className="font-semibold">Codice comune/stato:</span> <span className="font-mono">{decoded.placeCode || '-'}</span></p>
              </div>
            </Card>
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>Estrazione</p>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-semibold">Anno:</span> {decoded.year || '-'}</p>
                <p><span className="font-semibold">Mese:</span> {decoded.month || '-'}</p>
                <p><span className="font-semibold">Giorno:</span> {decoded.day || '-'}</p>
                <p><span className="font-semibold">Sesso:</span> {decoded.gender || '-'}</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {mode === 'generate' && (
        <div className="grid gap-4 xl:grid-cols-[1fr,360px]">
          <Card padding="md">
            <div className="grid gap-4 md:grid-cols-2">
              <Input id="tool-gen-surname" label="Cognome" value={generator.surname} onChange={(e) => setGenerator((current) => ({ ...current, surname: e.target.value }))} />
              <Input id="tool-gen-name" label="Nome" value={generator.name} onChange={(e) => setGenerator((current) => ({ ...current, name: e.target.value }))} />
              <Input id="tool-gen-birth" label="Data di nascita" type="date" value={generator.birthDate} onChange={(e) => setGenerator((current) => ({ ...current, birthDate: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="tool-gen-gender">Sesso</label>
                <div className="flex gap-2">
                  <Button variant={generator.gender === 'M' ? 'primary' : 'outline'} size="sm" onClick={() => setGenerator((current) => ({ ...current, gender: 'M' }))}>M</Button>
                  <Button variant={generator.gender === 'F' ? 'primary' : 'outline'} size="sm" onClick={() => setGenerator((current) => ({ ...current, gender: 'F' }))}>F</Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <Input
                  id="tool-gen-place"
                  label="Codice catastale comune / stato estero"
                  placeholder="Esempio: H501 oppure Z404"
                  value={generator.placeCode}
                  onChange={(e) => setGenerator((current) => ({ ...current, placeCode: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>Risultato</p>
            <p className="mt-3 text-2xl font-bold font-mono break-all" style={{ color: 'var(--cv-primary)' }}>
              {generatedCode || 'Compila i dati per generare il codice'}
            </p>
            <p className="mt-3 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Il campo luogo usa il codice catastale del comune italiano oppure il codice dello stato estero.
              Il tab Codici luogo ti aiuta a trovarlo e a copiarlo nel generatore.
            </p>
          </Card>
        </div>
      )}

      {mode === 'places' && (
        <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
          <Card padding="md">
            <div className="space-y-4">
              <Input
                id="tool-place-search"
                label="Comune o stato estero"
                placeholder="Esempio: Catanzaro, Roma, Germania"
                value={placeSearch}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setPlaceSearch(nextValue);
                  if (nextValue.trim().length < 2) {
                    setPlaceHits([]);
                    setPlaceError('');
                  }
                }}
              />
              <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Cerca il codice catastale del comune oppure il codice dello stato estero e usalo subito nel calcolo inverso.
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--cv-neutral-200)', background: 'var(--cv-neutral-50)' }}>
                    {['Tipo', 'Nome', 'Provincia / ISO', 'Codice', 'Azione'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {placeLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                        Ricerca luoghi in corso...
                      </td>
                    </tr>
                  ) : placeError ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-danger)' }}>
                        {placeError}
                      </td>
                    </tr>
                  ) : placeHits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                        Inserisci almeno 2 caratteri per cercare un codice luogo.
                      </td>
                    </tr>
                  ) : placeHits.map((item) => {
                    const code = item.cadastral_code || '-';
                    const meta = item.kind === 'municipality'
                      ? provinceLookup[item.province_id]?.name || '-'
                      : item.iso2 || '-';
                    return (
                      <tr key={`${item.kind}-${item.id}`} style={{ borderBottom: '1px solid var(--cv-neutral-200)' }}>
                        <td className="px-4 py-3 text-sm">{item.kind === 'municipality' ? 'Comune' : 'Stato estero'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{meta}</td>
                        <td className="px-4 py-3 text-sm font-mono">{code}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!item.cadastral_code}
                            onClick={() => item.cadastral_code && applyPlaceCode(item.cadastral_code)}
                          >
                            Usa nel generatore
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
