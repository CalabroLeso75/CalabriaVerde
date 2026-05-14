'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { withAppBasePath } from '@/lib/app-path';
import { api, ApiError } from '@/lib/api';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/test';
const logoSrc = `${basePath}/assets/logo-calabriaverde.png`;

// Step del form multi-pagina
type Step = 'account' | 'anagrafica' | 'contratto' | 'conferma';

interface FormData {
  // Step 1 - Account
  email: string;
  password: string;
  conferma_password: string;
  codice_fiscale: string;

  // Step 2 - Anagrafica
  nome: string;
  cognome: string;
  data_nascita: string;
  luogo_nascita: string;
  provincia_nascita: string;
  sesso: string;
  telefono_personale: string;

  // Step 3 - Dati professionali
  tipo_contratto: string;
  settore_interesse: string;
  mansione_interesse: string;
  note_aggiuntive: string;
}

const INITIAL_DATA: FormData = {
  email: '', password: '', conferma_password: '', codice_fiscale: '',
  nome: '', cognome: '', data_nascita: '', luogo_nascita: '',
  provincia_nascita: '', sesso: '', telefono_personale: '',
  tipo_contratto: '', settore_interesse: '', mansione_interesse: '',
  note_aggiuntive: '',
};

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'account', label: 'Account', num: 1 },
  { key: 'anagrafica', label: 'Anagrafica', num: 2 },
  { key: 'contratto', label: 'Professionale', num: 3 },
  { key: 'conferma', label: 'Conferma', num: 4 },
];

const SETTORI = [
  { value: 'hr', label: 'Risorse Umane' },
  { value: 'aib', label: 'Antincendio Boschivo (AIB)' },
  { value: 'flotta', label: 'Parco Macchine' },
  { value: 'magazzino', label: 'Magazzino' },
  { value: 'cantieri', label: 'Cantieri Forestali' },
  { value: 'amministrazione', label: 'Amministrazione' },
  { value: 'sale_operative', label: 'Sale Operative' },
  { value: 'altro', label: 'Altro / Da definire' },
];

const CONTRATTI = [
  { value: 'indeterminato', label: 'Tempo indeterminato' },
  { value: 'determinato', label: 'Tempo determinato' },
  { value: 'stagionale', label: 'Stagionale' },
  { value: 'somministrazione', label: 'Somministrazione' },
  { value: 'collaborazione', label: 'Collaborazione' },
  { value: 'volontario', label: 'Volontario' },
];

function validateCF(cf: string): boolean {
  return /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf.toUpperCase());
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('account');
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  const currentStepNum = STEPS.find((s) => s.key === step)?.num ?? 1;

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Validazione per step
  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 'account') {
      if (!data.email) newErrors.email = 'Email obbligatoria';
      else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Email non valida';
      if (!data.codice_fiscale) newErrors.codice_fiscale = 'Codice fiscale obbligatorio';
      else if (!validateCF(data.codice_fiscale)) newErrors.codice_fiscale = 'Formato codice fiscale non valido';
      if (!data.password) newErrors.password = 'Password obbligatoria';
      else if (data.password.length < 8) newErrors.password = 'Minimo 8 caratteri';
      if (!data.conferma_password) newErrors.conferma_password = 'Conferma la password';
      else if (data.password !== data.conferma_password) newErrors.conferma_password = 'Le password non corrispondono';
    }

    if (step === 'anagrafica') {
      if (!data.nome) newErrors.nome = 'Nome obbligatorio';
      if (!data.cognome) newErrors.cognome = 'Cognome obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };

  const prevStep = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/register', {
        email: data.email.toLowerCase(),
        password: data.password,
        codice_fiscale: data.codice_fiscale.toUpperCase(),
        nome: data.nome.trim(),
        cognome: data.cognome.trim(),
        telefono: data.telefono_personale || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Errore di connessione. Riprovare.');
    } finally {
      setLoading(false);
    }
  };

  // Schermata di successo
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--cv-neutral-100)' }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary)' }}
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
              Richiesta inviata!
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              La tua richiesta di accesso è stata ricevuta ed è in attesa di approvazione da parte di un responsabile.
              Riceverai una notifica all&apos;indirizzo <strong>{data.email}</strong> quando il tuo account sarà attivato.
            </p>
          </div>
          <div
            className="p-4 rounded-lg text-sm text-left"
            style={{ background: 'var(--cv-primary-lighter)', color: 'var(--cv-primary-darker)' }}
          >
            <p className="font-semibold mb-1">Cosa succede ora?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Il tuo responsabile riceverà una notifica della richiesta</li>
              <li>Verrà verificata la tua identità tramite codice fiscale</li>
              <li>Ti verrà assegnato il profilo e i relativi permessi</li>
              <li>Riceverai una email con la conferma di attivazione</li>
            </ol>
          </div>
          <Link href={withAppBasePath('/login')}>
            <Button variant="outline" className="w-full">
              Torna al Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cv-neutral-100)' }}>
      {/* Pannello sinistro branding */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(160deg, var(--cv-primary-darker) 0%, var(--cv-primary-dark) 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
            <img
              src={logoSrc}
              alt="Calabria Verde"
              width={40}
              height={40}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
            />
          </div>
          <div>
            <p className="font-bold text-white text-lg">Calabria Verde</p>
            <p className="text-white/60 text-xs">Gestionale Aziendale</p>
          </div>
        </div>

        <div className="text-white">
          <h1 className="text-3xl font-bold leading-tight" style={{ color: 'white' }}>
            Richiedi accesso
            <br />
            <span style={{ color: 'var(--cv-accent)' }}>al gestionale</span>
          </h1>
          <p className="text-white/70 mt-4 text-sm">
            Compila il modulo con i tuoi dati. Il tuo responsabile riceverà
            la richiesta e ti attribuirà il profilo corretto.
          </p>

          {/* Istruzioni step */}
          <div className="mt-8 space-y-3">
            {STEPS.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: s.num <= currentStepNum ? 'var(--cv-accent)' : 'rgba(255,255,255,0.15)',
                    color: s.num <= currentStepNum ? 'var(--cv-primary-darker)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {s.num < currentStepNum ? '✓' : s.num}
                </div>
                <span
                  className="text-sm"
                  style={{
                    color: s.num === currentStepNum
                      ? 'white'
                      : s.num < currentStepNum
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(255,255,255,0.4)',
                    fontWeight: s.num === currentStepNum ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">© 2026 Calabria Verde — Regione Calabria</p>
      </div>

      {/* Pannello destro — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Progress mobile */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: s.num <= currentStepNum ? 'var(--cv-primary)' : 'var(--cv-neutral-300)',
                  }}
                />
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: s.num < currentStepNum ? 'var(--cv-primary)' : 'var(--cv-neutral-300)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Intestazione step */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--cv-primary)' }}>
              Passo {currentStepNum} di {STEPS.length}
            </p>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
              {step === 'account' && 'Crea il tuo account'}
              {step === 'anagrafica' && 'Dati anagrafici'}
              {step === 'contratto' && 'Dati professionali'}
              {step === 'conferma' && 'Conferma e invia'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--cv-neutral-600)' }}>
              {step === 'account' && 'Inserisci le credenziali di accesso e il tuo codice fiscale'}
              {step === 'anagrafica' && 'Informazioni personali per identificarti'}
              {step === 'contratto' && 'Indica il tuo settore e tipo di rapporto lavorativo'}
              {step === 'conferma' && 'Verifica i dati e invia la richiesta di accesso'}
            </p>
          </div>

          {/* Errore API */}
          {apiError && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg border mb-6"
              style={{ background: '#CC334418', borderColor: '#CC334440', color: 'var(--cv-danger)' }}
              role="alert"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          {/* ========== STEP 1: ACCOUNT ========== */}
          {step === 'account' && (
            <div className="space-y-5 animate-fade-in">
              <Input
                id="reg-email"
                label="Email istituzionale"
                type="email"
                value={data.email}
                onChange={update('email')}
                placeholder="nome.cognome@calabriaverde.eu"
                error={errors.email}
                required
                autoComplete="email"
                helpText="Utilizza la tua email aziendale di Calabria Verde"
              />
              <Input
                id="reg-cf"
                label="Codice Fiscale"
                value={data.codice_fiscale}
                onChange={update('codice_fiscale')}
                placeholder="RSSMRA80A01F537K"
                error={errors.codice_fiscale}
                required
                className="uppercase"
                maxLength={16}
                helpText="16 caratteri — verrà usato come identificativo univoco"
              />
              <Input
                id="reg-password"
                label="Password"
                type="password"
                value={data.password}
                onChange={update('password')}
                placeholder="••••••••"
                error={errors.password}
                required
                autoComplete="new-password"
                helpText="Minimo 8 caratteri. Usa lettere, numeri e simboli"
              />
              <Input
                id="reg-conferma-password"
                label="Conferma Password"
                type="password"
                value={data.conferma_password}
                onChange={update('conferma_password')}
                placeholder="••••••••"
                error={errors.conferma_password}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {/* ========== STEP 2: ANAGRAFICA ========== */}
          {step === 'anagrafica' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="reg-nome"
                  label="Nome"
                  value={data.nome}
                  onChange={update('nome')}
                  placeholder="Mario"
                  error={errors.nome}
                  required
                />
                <Input
                  id="reg-cognome"
                  label="Cognome"
                  value={data.cognome}
                  onChange={update('cognome')}
                  placeholder="Rossi"
                  error={errors.cognome}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="reg-data-nascita"
                  label="Data di nascita"
                  type="date"
                  value={data.data_nascita}
                  onChange={update('data_nascita')}
                />
                <Select
                  id="reg-sesso"
                  label="Sesso"
                  value={data.sesso}
                  onChange={update('sesso')}
                  placeholder="Seleziona"
                  options={[
                    { value: 'M', label: 'Maschile' },
                    { value: 'F', label: 'Femminile' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input
                    id="reg-luogo-nascita"
                    label="Luogo di nascita"
                    value={data.luogo_nascita}
                    onChange={update('luogo_nascita')}
                    placeholder="Cosenza"
                  />
                </div>
                <Input
                  id="reg-provincia-nascita"
                  label="Provincia"
                  value={data.provincia_nascita}
                  onChange={update('provincia_nascita')}
                  placeholder="CS"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
              <Input
                id="reg-telefono"
                label="Telefono personale"
                type="tel"
                value={data.telefono_personale}
                onChange={update('telefono_personale')}
                placeholder="+39 333 1234567"
                helpText="Opzionale — utile per comunicazioni urgenti"
              />
            </div>
          )}

          {/* ========== STEP 3: PROFESSIONALE ========== */}
          {step === 'contratto' && (
            <div className="space-y-5 animate-fade-in">
              <Select
                id="reg-tipo-contratto"
                label="Tipo di rapporto lavorativo"
                value={data.tipo_contratto}
                onChange={update('tipo_contratto')}
                placeholder="Seleziona tipo contratto"
                options={CONTRATTI}
                helpText="Indica il tipo di contratto che hai o che prevedi di avere"
              />
              <Select
                id="reg-settore"
                label="Settore di appartenenza"
                value={data.settore_interesse}
                onChange={update('settore_interesse')}
                placeholder="Seleziona settore"
                options={SETTORI}
                helpText="Il responsabile del settore riceverà la tua richiesta"
              />
              <Input
                id="reg-mansione"
                label="Mansione / Ruolo previsto"
                value={data.mansione_interesse}
                onChange={update('mansione_interesse')}
                placeholder="es. Operatore AIB, DOS, Autista, ecc."
                helpText="Opzionale — aiuta il responsabile ad assegnare il profilo corretto"
              />
              <div>
                <label
                  htmlFor="reg-note"
                  className="text-sm font-semibold block mb-1"
                  style={{ color: 'var(--cv-neutral-800)' }}
                >
                  Note aggiuntive
                </label>
                <textarea
                  id="reg-note"
                  value={data.note_aggiuntive}
                  onChange={update('note_aggiuntive')}
                  rows={3}
                  placeholder="Eventuali informazioni utili per il responsabile..."
                  className="w-full px-3 py-2 rounded-md border text-sm resize-none"
                  style={{
                    borderColor: 'var(--cv-neutral-300)',
                    color: 'var(--cv-neutral-900)',
                  }}
                />
              </div>
            </div>
          )}

          {/* ========== STEP 4: CONFERMA ========== */}
          {step === 'conferma' && (
            <div className="space-y-4 animate-fade-in">
              {/* Riepilogo dati */}
              {[
                {
                  titolo: 'Account',
                  campi: [
                    { label: 'Email', valore: data.email },
                    { label: 'Codice Fiscale', valore: data.codice_fiscale.toUpperCase() },
                  ],
                },
                {
                  titolo: 'Anagrafica',
                  campi: [
                    { label: 'Nome', valore: `${data.nome} ${data.cognome}` },
                    { label: 'Data nascita', valore: data.data_nascita || '—' },
                    { label: 'Luogo nascita', valore: data.luogo_nascita ? `${data.luogo_nascita} (${data.provincia_nascita})` : '—' },
                    { label: 'Telefono', valore: data.telefono_personale || '—' },
                  ],
                },
                {
                  titolo: 'Dati professionali',
                  campi: [
                    { label: 'Contratto', valore: CONTRATTI.find(c => c.value === data.tipo_contratto)?.label || '—' },
                    { label: 'Settore', valore: SETTORI.find(s => s.value === data.settore_interesse)?.label || '—' },
                    { label: 'Mansione', valore: data.mansione_interesse || '—' },
                  ],
                },
              ].map((sezione) => (
                <div
                  key={sezione.titolo}
                  className="rounded-lg border p-4"
                  style={{ borderColor: 'var(--cv-neutral-300)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--cv-primary)' }}>
                    {sezione.titolo}
                  </p>
                  <div className="space-y-2">
                    {sezione.campi.map((campo) => (
                      <div key={campo.label} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--cv-neutral-600)' }}>{campo.label}</span>
                        <span className="font-medium" style={{ color: 'var(--cv-neutral-900)' }}>
                          {campo.valore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Privacy */}
              <div
                className="p-4 rounded-lg border text-xs"
                style={{ background: 'var(--cv-primary-lighter)', borderColor: 'var(--cv-primary-light)', color: 'var(--cv-primary-darker)' }}
              >
                <strong>Informativa privacy (D.Lgs 196/2003 e GDPR 2016/679):</strong> i dati forniti saranno trattati
                esclusivamente per la gestione del rapporto lavorativo con Calabria Verde e non comunicati a terzi.
              </div>
            </div>
          )}

          {/* Navigazione step */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--cv-neutral-200)' }}>
            <div>
              {step !== 'account' && (
                <Button variant="ghost" onClick={prevStep} disabled={loading}>
                  ← Indietro
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: 'var(--cv-neutral-500)' }}>
                {currentStepNum}/{STEPS.length}
              </span>
              {step !== 'conferma' ? (
                <Button onClick={nextStep}>
                  Continua →
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={loading}>
                  {loading ? 'Invio in corso...' : 'Invia richiesta di accesso'}
                </Button>
              )}
            </div>
          </div>

          {/* Link login */}
          <p className="text-center text-sm mt-4" style={{ color: 'var(--cv-neutral-600)' }}>
            Hai già un account?{' '}
            <Link href={withAppBasePath('/login')} className="font-semibold" style={{ color: 'var(--cv-primary)' }}>
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
