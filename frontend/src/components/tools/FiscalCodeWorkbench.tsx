'use client';

import React, { useMemo, useState } from 'react';
import { analyzeFiscalCode, generateFiscalCode } from '@/lib/fiscalCode';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type Mode = 'generate' | 'decode';

const modeButtons: { value: Mode; label: string }[] = [
  { value: 'generate', label: 'Generatore' },
  { value: 'decode', label: 'Codice fiscale inverso' },
];

export default function FiscalCodeWorkbench() {
  const [mode, setMode] = useState<Mode>('generate');
  const [decodeCf, setDecodeCf] = useState('');
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Strumento essenziale per generare un codice fiscale o leggerne i dati principali.
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

      {mode === 'generate' && (
        <div className="grid gap-4 xl:grid-cols-[1fr,360px]">
          <Card padding="md">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="tool-gen-surname"
                label="Cognome"
                value={generator.surname}
                onChange={(e) => setGenerator((current) => ({ ...current, surname: e.target.value }))}
              />
              <Input
                id="tool-gen-name"
                label="Nome"
                value={generator.name}
                onChange={(e) => setGenerator((current) => ({ ...current, name: e.target.value }))}
              />
              <Input
                id="tool-gen-birth"
                label="Data di nascita"
                type="date"
                value={generator.birthDate}
                onChange={(e) => setGenerator((current) => ({ ...current, birthDate: e.target.value }))}
              />
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
              Inserisci il codice catastale del comune italiano oppure il codice dello stato estero.
            </p>
          </Card>
        </div>
      )}

      {mode === 'decode' && (
        <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
          <Card padding="md">
            <div className="space-y-4">
              <Input
                id="tool-decode-cf"
                label="Codice fiscale"
                placeholder="RSSMRA85M01H501U"
                value={decodeCf}
                onChange={(e) => setDecodeCf(e.target.value.toUpperCase())}
              />
              <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Estrae anno, mese, giorno, sesso e codice luogo dal codice fiscale inserito.
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
    </div>
  );
}
