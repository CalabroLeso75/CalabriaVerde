'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

// Tipi
interface PendingUser {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  codice_fiscale: string;
  telefono?: string;
  created_at: string;
  settore_interesse?: string;
  tipo_contratto?: string;
  mansione_interesse?: string;
  note_aggiuntive?: string;
}

// Dati demo — verranno sostituiti da API /users/pending
const DEMO_PENDING: PendingUser[] = [
  {
    id: 101, nome: 'Giuseppe', cognome: 'Amendola',
    email: 'giuseppe.amendola@calabriaverde.eu',
    codice_fiscale: 'MNDGPP90D15F537A',
    telefono: '+39 333 1112233',
    created_at: '2026-05-10T08:22:00Z',
    settore_interesse: 'Antincendio Boschivo (AIB)',
    tipo_contratto: 'Stagionale',
    mansione_interesse: 'Operatore AIB Squadra',
  },
  {
    id: 102, nome: 'Carmela', cognome: 'Bruni',
    email: 'carmela.bruni@calabriaverde.eu',
    codice_fiscale: 'BRNCML85F55F537B',
    created_at: '2026-05-10T09:45:00Z',
    settore_interesse: 'Risorse Umane',
    tipo_contratto: 'Indeterminato',
    mansione_interesse: 'Addetto HR',
  },
  {
    id: 103, nome: 'Antonio', cognome: 'Sculco',
    email: 'antonio.sculco@calabriaverde.eu',
    codice_fiscale: 'SCLNTN78A10F537C',
    telefono: '+39 347 9988776',
    created_at: '2026-05-09T16:10:00Z',
    settore_interesse: 'Magazzino',
    tipo_contratto: 'Determinato',
    mansione_interesse: 'Operatore Magazzino',
    note_aggiuntive: 'Già dipendente stagionale negli anni precedenti.',
  },
  {
    id: 104, nome: 'Maria', cognome: 'Paonessa',
    email: 'maria.paonessa@calabriaverde.eu',
    codice_fiscale: 'PNSMRA92C68F537D',
    created_at: '2026-05-09T11:30:00Z',
    settore_interesse: 'Cantieri Forestali',
    tipo_contratto: 'Stagionale',
    mansione_interesse: 'DOS - Direttore Operazioni di Spegnimento',
  },
  {
    id: 105, nome: 'Rocco', cognome: 'Mammoliti',
    email: 'rocco.mammoliti@calabriaverde.eu',
    codice_fiscale: 'MMMRCC88E10F537E',
    telefono: '+39 366 5544332',
    created_at: '2026-05-08T14:05:00Z',
    settore_interesse: 'Parco Macchine',
    tipo_contratto: 'Indeterminato',
    mansione_interesse: 'Autista - Mezzi pesanti',
  },
];

const RUOLI = [
  { value: 'operatore_aib', label: 'Operatore AIB' },
  { value: 'capo_squadra', label: 'Capo Squadra AIB' },
  { value: 'dos', label: 'DOS (Direttore Operazioni Spegnimento)' },
  { value: 'direttore_lavori', label: 'Direttore dei Lavori' },
  { value: 'operatore_cantiere', label: 'Operatore di Cantiere' },
  { value: 'operatore_magazzino', label: 'Operatore Magazzino' },
  { value: 'addetto_flotta', label: 'Addetto Parco Macchine' },
  { value: 'addetto_hr', label: 'Addetto Risorse Umane' },
  { value: 'responsabile_distretto', label: 'Responsabile di Distretto' },
  { value: 'admin', label: 'Amministratore' },
];

const ORGANIZZAZIONI = [
  { value: '1', label: 'Sede Centrale — Catanzaro' },
  { value: '2', label: 'Distretto Nord — Cosenza' },
  { value: '3', label: 'Distretto Sud — Reggio Calabria' },
  { value: '4', label: 'Distretto Centro — Catanzaro' },
  { value: '5', label: 'Distretto Est — Crotone/Vibo' },
];

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'pochi minuti fa';
  if (hours < 24) return `${hours}h fa`;
  return `${Math.floor(hours / 24)}g fa`;
}

export default function PendingUsersPage() {
  const [pending, setPending] = useState<PendingUser[]>(DEMO_PENDING);
  const [processed, setProcessed] = useState<{ id: number; action: 'approved' | 'rejected' }[]>([]);
  const [search, setSearch] = useState('');

  // Modal Approva
  const [approveModal, setApproveModal] = useState<{ open: boolean; user: PendingUser | null }>({ open: false, user: null });
  const [approveRole, setApproveRole] = useState('');
  const [approveOrg, setApproveOrg] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  // Modal Rifiuta
  const [rejectModal, setRejectModal] = useState<{ open: boolean; user: PendingUser | null }>({ open: false, user: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Modal Dettaglio
  const [detailModal, setDetailModal] = useState<{ open: boolean; user: PendingUser | null }>({ open: false, user: null });

  const filtered = pending.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return `${u.nome} ${u.cognome} ${u.email} ${u.codice_fiscale}`.toLowerCase().includes(term);
  });

  const handleApprove = async () => {
    if (!approveModal.user || !approveRole) return;
    setApproveLoading(true);
    // Simulazione chiamata API: await api.post(`/users/${approveModal.user.id}/approve`, { role_id: ..., organization_id: ... })
    await new Promise((r) => setTimeout(r, 800));
    setProcessed((prev) => [...prev, { id: approveModal.user!.id, action: 'approved' }]);
    setPending((prev) => prev.filter((u) => u.id !== approveModal.user!.id));
    setApproveModal({ open: false, user: null });
    setApproveRole('');
    setApproveOrg('');
    setApproveLoading(false);
  };

  const handleReject = async () => {
    if (!rejectModal.user || !rejectReason.trim()) return;
    setRejectLoading(true);
    // Simulazione: await api.post(`/users/${rejectModal.user.id}/reject`, { reason: rejectReason })
    await new Promise((r) => setTimeout(r, 600));
    setProcessed((prev) => [...prev, { id: rejectModal.user!.id, action: 'rejected' }]);
    setPending((prev) => prev.filter((u) => u.id !== rejectModal.user!.id));
    setRejectModal({ open: false, user: null });
    setRejectReason('');
    setRejectLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
            Registrazioni in Attesa
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
            Richieste di accesso da approvare o rifiutare
          </p>
        </div>
        <Badge variant="warning" dot size="md">
          {pending.length} in attesa
        </Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold" style={{ color: 'var(--cv-warning)' }}>{pending.length}</div>
            <div className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>In attesa</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold" style={{ color: 'var(--cv-success)' }}>
              {processed.filter(p => p.action === 'approved').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Approvati oggi</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold" style={{ color: 'var(--cv-danger)' }}>
              {processed.filter(p => p.action === 'rejected').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Rifiutati oggi</div>
          </div>
        </Card>
      </div>

      {/* Ricerca */}
      <Card padding="sm">
        <Input
          id="pending-search"
          label=""
          placeholder="Cerca per nome, email, codice fiscale..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Lista pending */}
      {filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary)' }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: 'var(--cv-neutral-700)' }}>
              {search ? 'Nessun risultato trovato' : 'Nessuna richiesta in attesa'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-500)' }}>
              {search ? 'Prova a modificare i termini di ricerca' : 'Tutte le richieste sono state elaborate'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card key={user.id} padding="md">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar + nome */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--cv-warning)18', color: 'var(--cv-warning)' }}
                  >
                    {user.cognome[0]}{user.nome[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                        {user.cognome} {user.nome}
                      </p>
                      <Badge variant="warning" size="sm">Pending</Badge>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{user.email}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--cv-neutral-500)' }}>
                      {user.codice_fiscale}
                    </p>
                  </div>
                </div>

                {/* Info rapide */}
                <div className="hidden lg:flex flex-col gap-1 text-xs flex-shrink-0 min-w-48">
                  {user.settore_interesse && (
                    <span style={{ color: 'var(--cv-neutral-700)' }}>
                      📂 {user.settore_interesse}
                    </span>
                  )}
                  {user.tipo_contratto && (
                    <span style={{ color: 'var(--cv-neutral-600)' }}>
                      📋 {user.tipo_contratto}
                    </span>
                  )}
                  {user.mansione_interesse && (
                    <span style={{ color: 'var(--cv-neutral-600)' }}>
                      👤 {user.mansione_interesse}
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="hidden xl:block text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                    {timeAgo(user.created_at)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--cv-neutral-400)' }}>
                    {formatDate(user.created_at)}
                  </p>
                </div>

                {/* Azioni */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailModal({ open: true, user })}
                    aria-label={`Dettaglio di ${user.cognome} ${user.nome}`}
                  >
                    Dettaglio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setRejectModal({ open: true, user }); setRejectReason(''); }}
                    aria-label={`Rifiuta ${user.cognome} ${user.nome}`}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Rifiuta
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setApproveModal({ open: true, user }); setApproveRole(''); setApproveOrg(''); }}
                    aria-label={`Approva ${user.cognome} ${user.nome}`}
                  >
                    Approva
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ===== MODAL APPROVA ===== */}
      <Modal
        isOpen={approveModal.open}
        onClose={() => setApproveModal({ open: false, user: null })}
        title={`Approva — ${approveModal.user?.cognome} ${approveModal.user?.nome}`}
        description="Assegna il ruolo e l'organizzazione di appartenenza. L'utente riceverà una notifica email."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveModal({ open: false, user: null })} disabled={approveLoading}>
              Annulla
            </Button>
            <Button
              onClick={handleApprove}
              loading={approveLoading}
              disabled={!approveRole}
            >
              Conferma approvazione
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Riepilogo utente */}
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: 'var(--cv-neutral-100)', borderLeft: '3px solid var(--cv-primary)' }}
          >
            <p><span className="font-semibold">Email:</span> {approveModal.user?.email}</p>
            <p><span className="font-semibold">CF:</span> <span className="font-mono">{approveModal.user?.codice_fiscale}</span></p>
            {approveModal.user?.settore_interesse && (
              <p><span className="font-semibold">Settore richiesto:</span> {approveModal.user.settore_interesse}</p>
            )}
            {approveModal.user?.mansione_interesse && (
              <p><span className="font-semibold">Mansione richiesta:</span> {approveModal.user.mansione_interesse}</p>
            )}
          </div>

          <Select
            id="approve-role"
            label="Ruolo da assegnare"
            value={approveRole}
            onChange={(e) => setApproveRole(e.target.value)}
            placeholder="Seleziona ruolo..."
            options={RUOLI}
            required
            helpText="Definisce i permessi dell'utente nel sistema"
          />

          <Select
            id="approve-org"
            label="Organizzazione di appartenenza"
            value={approveOrg}
            onChange={(e) => setApproveOrg(e.target.value)}
            placeholder="Seleziona organizzazione..."
            options={ORGANIZZAZIONI}
            helpText="Distretto o sede operativa di riferimento"
          />

          {!approveRole && (
            <p className="text-xs" style={{ color: 'var(--cv-warning)' }}>
              ⚠ Il ruolo è obbligatorio per procedere con l&apos;approvazione
            </p>
          )}
        </div>
      </Modal>

      {/* ===== MODAL RIFIUTA ===== */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, user: null })}
        title={`Rifiuta richiesta — ${rejectModal.user?.cognome} ${rejectModal.user?.nome}`}
        description="Indica il motivo del rifiuto. L'utente riceverà una notifica con la spiegazione."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectModal({ open: false, user: null })} disabled={rejectLoading}>
              Annulla
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectLoading}
              disabled={!rejectReason.trim()}
            >
              Conferma rifiuto
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: '#CC334408', borderLeft: '3px solid var(--cv-danger)' }}
          >
            <p style={{ color: 'var(--cv-neutral-700)' }}>
              <span className="font-semibold">Utente:</span> {rejectModal.user?.email}
            </p>
            <p style={{ color: 'var(--cv-neutral-700)' }}>
              <span className="font-semibold">CF:</span>{' '}
              <span className="font-mono">{rejectModal.user?.codice_fiscale}</span>
            </p>
          </div>

          <div>
            <label
              htmlFor="reject-reason"
              className="text-sm font-semibold block mb-1"
              style={{ color: 'var(--cv-neutral-800)' }}
            >
              Motivazione del rifiuto <span style={{ color: 'var(--cv-danger)' }}>*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Esempio: Il codice fiscale non corrisponde ad alcun dipendente registrato..."
              className="w-full px-3 py-2 rounded-md border text-sm resize-none"
              style={{ borderColor: 'var(--cv-neutral-300)', color: 'var(--cv-neutral-900)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--cv-neutral-500)' }}>
              Minimo 10 caratteri. Il testo sarà inviato all&apos;utente via email.
            </p>
          </div>
        </div>
      </Modal>

      {/* ===== MODAL DETTAGLIO ===== */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, user: null })}
        title={`Dettaglio — ${detailModal.user?.cognome} ${detailModal.user?.nome}`}
        size="md"
        footer={
          <Button variant="ghost" onClick={() => setDetailModal({ open: false, user: null })}>
            Chiudi
          </Button>
        }
      >
        {detailModal.user && (
          <div className="space-y-3 text-sm">
            {[
              { label: 'Codice Fiscale', value: detailModal.user.codice_fiscale, mono: true },
              { label: 'Email', value: detailModal.user.email },
              { label: 'Telefono', value: detailModal.user.telefono || '—' },
              { label: 'Settore richiesto', value: detailModal.user.settore_interesse || '—' },
              { label: 'Tipo contratto', value: detailModal.user.tipo_contratto || '—' },
              { label: 'Mansione richiesta', value: detailModal.user.mansione_interesse || '—' },
              { label: 'Registrato il', value: formatDate(detailModal.user.created_at) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--cv-neutral-200)' }}>
                <span style={{ color: 'var(--cv-neutral-600)' }}>{row.label}</span>
                <span
                  className={row.mono ? 'font-mono text-xs' : 'font-medium'}
                  style={{ color: 'var(--cv-neutral-900)' }}
                >
                  {row.value}
                </span>
              </div>
            ))}
            {detailModal.user.note_aggiuntive && (
              <div className="pt-2">
                <p className="font-semibold mb-1" style={{ color: 'var(--cv-neutral-700)' }}>Note aggiuntive</p>
                <p className="text-sm p-3 rounded-lg" style={{ background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-700)' }}>
                  {detailModal.user.note_aggiuntive}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
