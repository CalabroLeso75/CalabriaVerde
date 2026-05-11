'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api, ApiError } from '@/lib/api';

type Attachment = {
  id: number;
  document_kind: string;
  original_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  note?: string | null;
  created_at?: string | null;
  download_url: string;
};

type ContractTypeItem = {
  id: number;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  weekly_hours?: number | null;
  supports_integrative: boolean;
  allows_partial_application: boolean;
  is_active: boolean;
  notes?: string | null;
  attachments: Attachment[];
  created_at?: string | null;
  updated_at?: string | null;
};

type ContractForm = {
  code: string;
  name: string;
  category: string;
  description: string;
  weekly_hours: string;
  supports_integrative: boolean;
  allows_partial_application: boolean;
  is_active: boolean;
  notes: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const ATTACHMENT_KIND_OPTIONS = [
  { value: 'ccnl', label: 'Copia CCNL' },
  { value: 'integrativo', label: 'Contrattazione integrativa' },
  { value: 'altro', label: 'Altro allegato' },
];

const PRESET_CONTRACTS: ContractForm[] = [
  {
    code: 'idraulico_forestale',
    name: 'CCNL idraulico-forestale e idraulico-agraria',
    category: 'comparto idraulico-forestale e agrario',
    description: 'Contratto prevalente per operai e impiegati forestali con gestione livelli, orario standard e integrativo regionale.',
    weekly_hours: '39',
    supports_integrative: true,
    allows_partial_application: false,
    is_active: true,
    notes: 'Prevedere livelli operai e impiegati, gestione anzianita e contrattazione integrativa regionale Calabria.',
  },
  {
    code: 'funzioni_locali',
    name: 'CCNL Funzioni Locali',
    category: 'comparto funzioni locali',
    description: 'Per personale proveniente da Comunita montane, LSU e LPU assorbiti nell’ente.',
    weekly_hours: '36',
    supports_integrative: true,
    allows_partial_application: true,
    is_active: true,
    notes: 'Distinguere provenienza ex Comunita montana, ex LSU, ex LPU ed eventuale applicazione solo parziale del contratto.',
  },
];

function emptyForm(): ContractForm {
  return {
    code: '',
    name: '',
    category: '',
    description: '',
    weekly_hours: '',
    supports_integrative: true,
    allows_partial_application: false,
    is_active: true,
    notes: '',
  };
}

function contractToForm(contract: ContractTypeItem): ContractForm {
  return {
    code: contract.code,
    name: contract.name,
    category: contract.category,
    description: contract.description || '',
    weekly_hours: contract.weekly_hours ? String(contract.weekly_hours) : '',
    supports_integrative: contract.supports_integrative,
    allows_partial_application: contract.allows_partial_application,
    is_active: contract.is_active,
    notes: contract.notes || '',
  };
}

function normalizePayload(form: ContractForm) {
  return {
    code: form.code.trim().toLowerCase(),
    name: form.name.trim(),
    category: form.category.trim(),
    description: form.description.trim() || null,
    weekly_hours: form.weekly_hours.trim() ? Number(form.weekly_hours) : null,
    supports_integrative: form.supports_integrative,
    allows_partial_application: form.allows_partial_application,
    is_active: form.is_active,
    notes: form.notes.trim() || null,
  };
}

function formatBytes(value?: number | null) {
  if (!value) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function labelAttachmentKind(kind: string) {
  return ATTACHMENT_KIND_OPTIONS.find((item) => item.value === kind)?.label || kind;
}

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || '';
}

function toApiUrl(endpoint: string) {
  if (endpoint.startsWith('http')) return endpoint;
  if (API_BASE.endsWith('/api') && endpoint.startsWith('/admin/')) {
    return `${API_BASE}${endpoint}`;
  }
  if (API_BASE.endsWith('/api') && endpoint.startsWith('/api/')) {
    return `${API_BASE}${endpoint.slice(4)}`;
  }
  return `${API_BASE}${endpoint}`;
}

function applyCompartoHints(current: ContractForm, category: string): ContractForm {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes('funzioni locali')) {
    return {
      ...current,
      category,
      weekly_hours: current.weekly_hours || '36',
      allows_partial_application: true,
      supports_integrative: true,
    };
  }

  if (normalized.includes('idraulico') || normalized.includes('forestale') || normalized.includes('agrario')) {
    return {
      ...current,
      category,
      weekly_hours: current.weekly_hours || '39',
      supports_integrative: true,
    };
  }

  return {
    ...current,
    category,
  };
}

export default function AdminContractTypesPage() {
  const [contracts, setContracts] = useState<ContractTypeItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadKind, setUploadKind] = useState('ccnl');
  const [uploadNote, setUploadNote] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const selectedContract = useMemo(
    () => contracts.find((item) => item.id === selectedId) || null,
    [contracts, selectedId],
  );

  const loadContracts = async (preferredId?: number | null) => {
    setLoading(true);
    setError('');
    try {
      const items = await api.get<ContractTypeItem[]>('/admin/contracts/types');
      setContracts(items);

      if (preferredId) {
        const found = items.find((item) => item.id === preferredId);
        if (found) {
          setSelectedId(found.id);
          setForm(contractToForm(found));
          return;
        }
      }

      if (items.length > 0) {
        setSelectedId(items[0].id);
        setForm(contractToForm(items[0]));
      } else {
        setSelectedId(null);
        setForm(emptyForm());
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Caricamento non riuscito.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await loadContracts();
    })();
  }, []);

  const handleNew = () => {
    setSelectedId(null);
    setForm(emptyForm());
    setError('');
    setSuccess('');
  };

  const updateField = (field: keyof ContractForm, value: string | boolean) => {
    setForm((current) => {
      if (field === 'category' && typeof value === 'string') {
        return applyCompartoHints(current, value);
      }
      return { ...current, [field]: value };
    });
  };

  const saveContract = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = normalizePayload(form);
      const saved = selectedId
        ? await api.put<ContractTypeItem>(`/admin/contracts/types/${selectedId}`, payload)
        : await api.post<ContractTypeItem>('/admin/contracts/types', payload);

      setSuccess(selectedId ? 'Tipo di contratto aggiornato.' : 'Tipo di contratto creato.');
      await loadContracts(saved.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Salvataggio non riuscito.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAttachment = async () => {
    if (!selectedId || !uploadFile) return;

    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('document_kind', uploadKind);
      if (uploadNote.trim()) data.append('note', uploadNote.trim());
      data.append('file', uploadFile);

      const response = await fetch(toApiUrl(`/admin/contracts/types/${selectedId}/attachments`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: data,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: 'Upload non riuscito' }));
        throw new Error(payload.detail || 'Upload non riuscito');
      }

      const updated = await response.json() as ContractTypeItem;
      setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedId(updated.id);
      setForm(contractToForm(updated));
      setUploadFile(null);
      setUploadNote('');
      setSuccess('Allegato caricato correttamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload non riuscito.');
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    setError('');
    try {
      const response = await fetch(toApiUrl(attachment.download_url), {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error('Download non riuscito');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.original_name;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download non riuscito.');
    }
  };

  const deleteAttachment = async (attachmentId: number) => {
    if (!selectedId) return;

    setError('');
    setSuccess('');
    try {
      const updated = await api.delete<ContractTypeItem>(`/admin/contracts/attachments/${attachmentId}`);
      setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedId(updated.id);
      setForm(contractToForm(updated));
      setSuccess('Allegato rimosso.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Rimozione allegato non riuscita.';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
            Tipi di contratto
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
            Anagrafica dei contratti gestiti dal sistema, con allegati CCNL e contrattazione integrativa.
          </p>
        </div>
        <Button type="button" onClick={handleNew}>
          Nuovo tipo di contratto
        </Button>
      </div>

      {(error || success) && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: error ? 'var(--cv-danger)' : 'var(--cv-primary-light)',
            background: error ? '#CC334408' : 'var(--cv-primary-lighter)',
            color: error ? 'var(--cv-danger)' : 'var(--cv-primary-dark)',
          }}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>
            Contratti configurati
          </div>
          {loading ? (
            <Card>
              <div className="space-y-3 animate-pulse">
                <div className="h-12 rounded-lg" style={{ background: 'var(--cv-neutral-200)' }} />
                <div className="h-12 rounded-lg" style={{ background: 'var(--cv-neutral-200)' }} />
                <div className="h-12 rounded-lg" style={{ background: 'var(--cv-neutral-200)' }} />
              </div>
            </Card>
          ) : contracts.length === 0 ? (
            <Card>
              <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                Nessun tipo di contratto ancora inserito.
              </p>
            </Card>
          ) : (
            contracts.map((item) => {
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setForm(contractToForm(item));
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full rounded-lg border px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: active ? 'var(--cv-primary)' : 'var(--cv-neutral-300)',
                    background: active ? 'var(--cv-primary-lighter)' : 'white',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                        {item.name}
                      </p>
                      <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--cv-neutral-500)' }}>
                        {item.code}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: item.is_active ? '#33996618' : 'var(--cv-neutral-200)',
                        color: item.is_active ? '#339966' : 'var(--cv-neutral-500)',
                      }}
                    >
                      {item.is_active ? 'Attivo' : 'Disattivo'}
                    </span>
                  </div>
                </button>
              );
            })
          )}

          <Card>
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>
                Contratti base censiti
              </div>
              {PRESET_CONTRACTS.map((preset) => (
                <div key={preset.code} className="rounded-lg border px-4 py-3" style={{ borderColor: 'var(--cv-neutral-300)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                    {preset.name}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                    {preset.description}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedId(null);
                        setForm({ ...preset });
                        setError('');
                        setSuccess('Contratto base caricato nel form per modifica o salvataggio.');
                      }}
                    >
                      Apri nel form
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <Card>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                    {selectedId ? 'Modifica tipo di contratto' : 'Nuovo tipo di contratto'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    I contratti gia censiti si modificano selezionandoli dall’elenco; per un nuovo contratto inserisci liberamente il comparto, senza menu chiusi.
                  </p>
                </div>
                {selectedContract && (
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cv-neutral-500)' }}>
                    Allegati: {selectedContract.attachments.length}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input label="Codice" value={form.code} onChange={(e) => updateField('code', e.target.value)} required />
                <Input label="Nome" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
                <Input label="Categoria / comparto" value={form.category} onChange={(e) => updateField('category', e.target.value)} />
                <Input label="Ore settimanali standard" type="number" min="0" max="48" value={form.weekly_hours} onChange={(e) => updateField('weekly_hours', e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="Descrizione" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-neutral-300)' }}>
                  <input
                    type="checkbox"
                    checked={form.supports_integrative}
                    onChange={(e) => updateField('supports_integrative', e.target.checked)}
                  />
                  Prevede contrattazione integrativa
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-neutral-300)' }}>
                  <input
                    type="checkbox"
                    checked={form.allows_partial_application}
                    onChange={(e) => updateField('allows_partial_application', e.target.checked)}
                  />
                  Consente applicazione parziale
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--cv-neutral-300)' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                  />
                  Contratto attivo e selezionabile
                </label>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                  Note operative
                </label>
                <textarea
                  className="min-h-28 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cv-primary)]"
                  style={{ borderColor: 'var(--cv-neutral-300)', color: 'var(--cv-neutral-900)' }}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={saveContract} loading={saving}>
                  {selectedId ? 'Salva modifiche' : 'Crea contratto'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  Allegati normativi
                </h3>
                <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  Carica copia del CCNL, accordi integrativi regionali o altri documenti di riferimento.
                </p>
              </div>

              {!selectedId ? (
                <p className="text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                  Salva prima il tipo di contratto per poter allegare i documenti.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
                    <Select label="Tipo allegato" options={ATTACHMENT_KIND_OPTIONS} value={uploadKind} onChange={(e) => setUploadKind(e.target.value)} />
                    <Input label="Nota allegato" value={uploadNote} onChange={(e) => setUploadNote(e.target.value)} />
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                        File
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="block w-full rounded-md border px-3 py-2 text-sm"
                        style={{ borderColor: 'var(--cv-neutral-300)', color: 'var(--cv-neutral-900)' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={uploadAttachment} disabled={!uploadFile} loading={uploading}>
                      Carica allegato
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedContract && selectedContract.attachments.length > 0 ? (
                      selectedContract.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex flex-col gap-3 rounded-lg border px-4 py-3 md:flex-row md:items-center md:justify-between"
                          style={{ borderColor: 'var(--cv-neutral-300)' }}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                                {attachment.original_name}
                              </p>
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                style={{ background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary-dark)' }}
                              >
                                {labelAttachmentKind(attachment.document_kind)}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                              {formatBytes(attachment.size_bytes)}{attachment.note ? ` • ${attachment.note}` : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => downloadAttachment(attachment)}>
                              Scarica
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => deleteAttachment(attachment.id)}>
                              Rimuovi
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                        Nessun allegato caricato per questo contratto.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
