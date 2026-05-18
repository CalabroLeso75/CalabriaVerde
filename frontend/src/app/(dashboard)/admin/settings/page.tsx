'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';

interface FleetPlateIntegration {
  external_lookup_enabled: boolean;
  plate_provider: string;
  plate_api_url: string;
  plate_username: string;
  plate_api_key_configured: boolean;
  plate_job_types: string;
  plate_timeout_seconds: number;
  vin_provider: string;
}

const providerOptions = [
  { value: 'targa_co_it', label: 'Targa.co.it / RegCheck' },
  { value: 'tuttotarghe', label: 'TuttoTarghe' },
  { value: 'none', label: 'Disattivato' },
];

const inputClass = 'h-10 w-full rounded-[var(--cv-radius-sm)] border border-[var(--cv-border-strong)] bg-white px-3 text-sm text-[var(--cv-neutral-900)] outline-none focus:border-[var(--cv-primary)] focus:ring-2 focus:ring-[rgba(36,104,71,0.14)]';

export default function AdminSettingsPage() {
  const [form, setForm] = useState<FleetPlateIntegration | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<FleetPlateIntegration>('/admin/integrations/fleet-plate')
      .then(setForm)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Errore caricamento configurazione API'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = <K extends keyof FleetPlateIntegration>(key: K, value: FleetPlateIntegration[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await api.put<FleetPlateIntegration>('/admin/integrations/fleet-plate', {
        ...form,
        plate_api_key: apiKey,
      });
      setForm(updated);
      setApiKey('');
      setMessage('Configurazione salvata e attivata sul backend.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore salvataggio configurazione API');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-[var(--cv-neutral-600)]">Caricamento configurazione...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--cv-neutral-900)]">Configurazione</h2>
        <p className="mt-1 text-sm text-[var(--cv-neutral-600)]">Integrazioni API e servizi esterni del gestionale</p>
      </div>

      {error && (
        <div className="rounded-[var(--cv-radius-md)] border border-[var(--cv-danger)] bg-red-50 px-4 py-3 text-sm font-medium text-[var(--cv-danger)]">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-[var(--cv-radius-md)] border border-[var(--cv-success)] bg-green-50 px-4 py-3 text-sm font-medium text-[var(--cv-success)]">
          {message}
        </div>
      )}

      {form && (
        <Card>
          <CardHeader
            title="API targhe e catalogo mezzi"
            subtitle="Gestisce il provider usato dal Parco Macchine per recuperare dati tecnici da targa."
            action={<Button onClick={save} loading={saving}>Salva</Button>}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">Provider</span>
              <select
                className={inputClass}
                value={form.plate_provider}
                onChange={(event) => updateField('plate_provider', event.target.value)}
              >
                {providerOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[var(--cv-radius-md)] border border-[var(--cv-border-subtle)] bg-[var(--cv-surface-1)] px-4 py-3">
              <input
                type="checkbox"
                checked={form.external_lookup_enabled}
                onChange={(event) => updateField('external_lookup_enabled', event.target.checked)}
                className="h-4 w-4 accent-[var(--cv-primary)]"
              />
              <span className="text-sm font-semibold text-[var(--cv-neutral-800)]">Lookup esterno attivo</span>
            </label>

            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">Endpoint API</span>
              <input
                className={inputClass}
                value={form.plate_api_url}
                onChange={(event) => updateField('plate_api_url', event.target.value)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">Username API</span>
              <input
                className={inputClass}
                value={form.plate_username}
                onChange={(event) => updateField('plate_username', event.target.value)}
                autoComplete="off"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">API key opzionale</span>
              <input
                className={inputClass}
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={form.plate_api_key_configured ? 'Gia configurata, lascia vuoto per non cambiarla' : 'Non richiesta da Targa.co.it'}
                autoComplete="new-password"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">Job provider</span>
              <input
                className={inputClass}
                value={form.plate_job_types}
                onChange={(event) => updateField('plate_job_types', event.target.value)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">Provider VIN</span>
              <input
                className={inputClass}
                value={form.vin_provider}
                onChange={(event) => updateField('vin_provider', event.target.value)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-neutral-600)]">Timeout targa secondi</span>
              <input
                className={inputClass}
                type="number"
                min={10}
                max={120}
                value={form.plate_timeout_seconds}
                onChange={(event) => updateField('plate_timeout_seconds', Number(event.target.value))}
              />
            </label>
          </div>

          <div className="mt-5 rounded-[var(--cv-radius-md)] bg-[var(--cv-primary-lighter)] px-4 py-3 text-sm text-[var(--cv-neutral-800)]">
            Per Targa.co.it / RegCheck non serve una API key separata: il gestionale usa lo username dell&apos;account. La password non viene salvata qui.
          </div>
        </Card>
      )}
    </div>
  );
}
