'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { SectionLead } from '@/components/common/SectionLead';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

type VehicleDetail = {
  id: number;
  targa: string;
  marca: string;
  modello: string;
  tipo: string;
  stato?: string | null;
  km_attuali: number;
  localizzazione_corrente?: string | null;
  immatricolazione_date?: string | null;
  alimentazione?: string | null;
  euro_classe?: string | null;
  colore?: string | null;
  proprieta_tipo?: string | null;
  numero_telaio?: string | null;
  assicurazione_compagnia?: string | null;
  assicurazione_polizza?: string | null;
  scadenza_assicurazione?: string | null;
  assicurazione_copertura?: string | null;
  scadenza_revisione?: string | null;
  ultima_revisione?: string | null;
  scadenza_verifica_sicurezza?: string | null;
  rottamazione_date?: string | null;
  tracker_enabled: boolean;
  note?: string | null;
  vehicle_type?: {
    id: number;
    name: string;
    patente?: string | null;
    revisione?: string | null;
    assicurazione?: string | null;
    tipo_abilitazione?: string | null;
  } | null;
  revisions: Array<{
    id: number;
    data_revisione: string;
    esito: string;
    km_rilevati?: number | null;
    note?: string | null;
  }>;
  assignments: Array<{
    id: number;
    km_iniziali: number;
    km_finali?: number | null;
    assegnato_il?: string | null;
    riconsegnato_il?: string | null;
    documento_assegnazione_numero?: string | null;
    documento_assegnazione_data?: string | null;
    documento_restituzione_numero?: string | null;
    documento_restituzione_data?: string | null;
    stato: string;
    note?: string | null;
    employee_display_name?: string | null;
    user_display_name?: string | null;
  }>;
  documents: Array<{
    id: number;
    tipo_documento: string;
    titolo?: string | null;
    numero_documento?: string | null;
    data_rilascio?: string | null;
    data_scadenza?: string | null;
    stato: string;
    note?: string | null;
  }>;
  incidents: Array<{
    id: number;
    data_evento: string;
    data_chiusura?: string | null;
    stato: string;
    tipo?: string | null;
    luogo?: string | null;
    descrizione?: string | null;
    numero_sinistro?: string | null;
    importo_danno?: string | number | null;
    note?: string | null;
  }>;
  team_links: Array<{
    id: number;
    team_id: number;
    effective_from?: string | null;
    effective_to?: string | null;
  }>;
};

type FleetTab = 'anagrafica' | 'revisioni' | 'assegnazioni' | 'documenti' | 'sinistri';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('it-IT');
}

export default function FleetDetailClientPage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('id');

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FleetTab>('anagrafica');

  useEffect(() => {
    if (!vehicleId) return;
    api.get<VehicleDetail>(`/fleet/vehicles/${vehicleId}`)
      .then((payload) => {
        setVehicle(payload);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Impossibile caricare il mezzo.'));
  }, [vehicleId]);

  const tabs = useMemo(() => ([
    { id: 'anagrafica', label: 'Anagrafica' },
    { id: 'revisioni', label: 'Coperture e revisioni' },
    { id: 'assegnazioni', label: 'Assegnazioni' },
    { id: 'documenti', label: 'Documenti' },
    { id: 'sinistri', label: 'Sinistri' },
  ]), []);

  if (!vehicleId) {
    return <NoticeBanner title="Mezzo non selezionato" message="Apri il dettaglio partendo dall'anagrafica mezzi." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLead
          description="Scheda completa del mezzo con storico tecnico e operativo."
          detail={vehicle ? `${vehicle.targa} - ${vehicle.marca} ${vehicle.modello}` : 'Caricamento in corso...'}
        />
        <Link href="/fleet/anagrafica" className="text-sm font-medium" style={{ color: 'var(--cv-primary)' }}>
          Torna all&apos;anagrafica
        </Link>
      </div>

      {error && <NoticeBanner title="Errore caricamento" message={error} />}

      {vehicle && (
        <>
          <Card padding="md">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Mezzo
                </p>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  {vehicle.marca} {vehicle.modello}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  {vehicle.targa} · {vehicle.vehicle_type?.name || vehicle.tipo}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Stato
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>
                  {vehicle.stato || 'Non definito'}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Km attuali
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                  {vehicle.km_attuali.toLocaleString('it-IT')}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Localizzazione
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                  {vehicle.localizzazione_corrente || 'Non registrata'}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
                  Tracker
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
                  {vehicle.tracker_enabled ? 'Attivo' : 'Non attivo'}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-[var(--cv-radius-md)] border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: tab === item.id ? 'var(--cv-primary)' : 'var(--cv-border-subtle)',
                  background: tab === item.id ? 'var(--cv-primary-lighter)' : 'white',
                  color: tab === item.id ? 'var(--cv-primary-dark)' : 'var(--cv-neutral-700)',
                }}
                onClick={() => setTab(item.id as FleetTab)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'anagrafica' && (
            <Card padding="md">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Info label="Immatricolazione" value={formatDate(vehicle.immatricolazione_date)} />
                <Info label="Telaio" value={vehicle.numero_telaio || '—'} />
                <Info label="Alimentazione" value={vehicle.alimentazione || '—'} />
                <Info label="Classe euro" value={vehicle.euro_classe || '—'} />
                <Info label="Colore" value={vehicle.colore || '—'} />
                <Info label="Proprieta" value={vehicle.proprieta_tipo || '—'} />
                <Info label="Patente richiesta" value={vehicle.vehicle_type?.patente || '—'} />
                <Info label="Abilitazione" value={vehicle.vehicle_type?.tipo_abilitazione || '—'} />
                <Info label="Note" value={vehicle.note || '—'} />
              </div>
            </Card>
          )}

          {tab === 'revisioni' && (
            <Card padding="md">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Info label="Compagnia assicurativa" value={vehicle.assicurazione_compagnia || '—'} />
                <Info label="Polizza" value={vehicle.assicurazione_polizza || '—'} />
                <Info label="Scadenza assicurazione" value={formatDate(vehicle.scadenza_assicurazione)} />
                <Info label="Scadenza revisione" value={formatDate(vehicle.scadenza_revisione)} />
              </div>

              <div className="mt-6 space-y-3">
                {vehicle.revisions.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna revisione registrata.</p>
                )}
                {vehicle.revisions.map((revision) => (
                  <div key={revision.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                        Revisione del {formatDate(revision.data_revisione)}
                      </p>
                      <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>
                        {revision.esito}
                      </span>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                      Km rilevati: {revision.km_rilevati?.toLocaleString('it-IT') || '—'}
                    </p>
                    {revision.note && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{revision.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'assegnazioni' && (
            <Card padding="md">
              <div className="space-y-3">
                {vehicle.assignments.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>Nessuna assegnazione registrata.</p>
                )}
                {vehicle.assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                        {assignment.employee_display_name || assignment.user_display_name || 'Utilizzatore non definito'}
                      </p>
                      <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>
                        {assignment.stato}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <Info label="Assegnato il" value={formatDate(assignment.assegnato_il)} />
                      <Info label="Riconsegnato il" value={formatDate(assignment.riconsegnato_il)} />
                      <Info label="Documento assegnazione" value={assignment.documento_assegnazione_numero || '—'} />
                      <Info label="Documento restituzione" value={assignment.documento_restituzione_numero || '—'} />
                      <Info label="Km iniziali" value={assignment.km_iniziali.toLocaleString('it-IT')} />
                      <Info label="Km finali" value={assignment.km_finali?.toLocaleString('it-IT') || '—'} />
                    </div>
                    {assignment.note && (
                      <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{assignment.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'documenti' && (
            <Card padding="md">
              <div className="space-y-3">
                {vehicle.documents.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    Nessun documento mezzo registrato. Qui dovranno confluire libretto, polizza, certificazioni, verbali e altri allegati.
                  </p>
                )}
                {vehicle.documents.map((document) => (
                  <div key={document.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                        {document.titolo || document.tipo_documento}
                      </p>
                      <span className="text-xs font-semibold" style={{ color: 'var(--cv-primary-dark)' }}>
                        {document.stato}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <Info label="Tipo documento" value={document.tipo_documento} />
                      <Info label="Numero documento" value={document.numero_documento || '—'} />
                      <Info label="Data rilascio" value={formatDate(document.data_rilascio)} />
                      <Info label="Scadenza" value={formatDate(document.data_scadenza)} />
                    </div>
                    {document.note && (
                      <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{document.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'sinistri' && (
            <Card padding="md">
              <div className="space-y-3">
                {vehicle.incidents.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                    Nessun sinistro registrato per questo mezzo.
                  </p>
                )}
                {vehicle.incidents.map((incident) => (
                  <div key={incident.id} className="rounded-[var(--cv-radius-md)] border p-4" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                        {incident.tipo || 'Sinistro'}
                      </p>
                      <span className="text-xs font-semibold" style={{ color: incident.data_chiusura ? 'var(--cv-primary-dark)' : 'var(--cv-danger)' }}>
                        {incident.stato}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <Info label="Data evento" value={formatDate(incident.data_evento)} />
                      <Info label="Data chiusura" value={formatDate(incident.data_chiusura)} />
                      <Info label="Luogo" value={incident.luogo || '—'} />
                      <Info label="Numero sinistro" value={incident.numero_sinistro || '—'} />
                    </div>
                    {incident.descrizione && (
                      <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>{incident.descrizione}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-neutral-500)' }}>
        {label}
      </p>
      <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-700)' }}>
        {value}
      </p>
    </div>
  );
}
