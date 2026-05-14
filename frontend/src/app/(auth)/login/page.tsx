'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { NoticeBanner } from '@/components/common/NoticeBanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { withAppBasePath } from '@/lib/app-path';
import { api, ApiError } from '@/lib/api';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/test';
const logoSrc = `${basePath}/assets/logo-calabriaverde.png`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem('access_token');

    if (!token) {
      setCheckingSession(false);
      return () => {
        alive = false;
      };
    }

    api.get('/auth/me', { skipAuthRedirect: true })
      .then(() => {
        if (alive) {
          router.replace(withAppBasePath('/dashboard'));
        }
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth-state-changed'));
      })
      .finally(() => {
        if (alive) {
          setCheckingSession(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cv-neutral-100)' }}>
        <div className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Verifica sessione in corso...
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{ access_token: string; refresh_token: string }>('/auth/login', { email, password });
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      window.dispatchEvent(new Event('auth-state-changed'));
      router.push(withAppBasePath('/dashboard'));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Errore di connessione. Riprovare.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cv-neutral-100)' }}>
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #174431 0%, #1d5a40 58%, #2b7f56 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md">
            <img src={logoSrc} alt="Logo Calabria Verde" width={40} height={40} style={{ objectFit: 'contain', width: 'auto', height: 'auto' }} />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-white">Calabria Verde</p>
            <p className="text-xs text-white/60">Gestionale Aziendale</p>
          </div>
        </div>

        <div className="space-y-5 text-white">
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl" style={{ color: 'white' }}>
            Gestisci il patrimonio
            <br />
            <span style={{ color: 'var(--cv-accent)' }}>boschivo della Calabria</span>
          </h1>
          <p className="max-w-md text-lg text-white/72">
            Piattaforma integrata per la gestione operativa di Calabria Verde. Un ambiente unico per persone,
            mezzi, sale operative, magazzino e antincendio.
          </p>

          <div className="space-y-3 pt-3">
            {[
              'Accesso guidato per il personale sul campo',
              'Monitoraggio delle squadre AIB e dei mezzi',
              'Gestione amministrativa coerente con le linee AGID',
              'Interfaccia pensata per uso continuo e operativo',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/84">
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--cv-accent)', color: 'var(--cv-primary-darker)' }}>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/38">© 2026 Calabria Verde - Regione Calabria</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md rounded-[var(--cv-radius-lg)] border bg-[var(--cv-surface-2)] p-7 shadow-[var(--cv-shadow-md)] lg:p-8" style={{ borderColor: 'var(--cv-border-subtle)' }}>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-[var(--cv-border-subtle)] bg-white shadow-sm">
              <img src={logoSrc} alt="Calabria Verde" width={40} height={40} style={{ objectFit: 'contain', width: 'auto', height: 'auto' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--cv-neutral-900)' }}>Calabria Verde</p>
              <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>Gestionale Aziendale</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-primary)' }}>
              Accesso
            </p>
            <h2 className="mt-1 text-3xl font-bold">Accedi</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Inserisci le credenziali istituzionali per accedere al gestionale.
            </p>
          </div>

          {error ? (
            <div className="mt-6">
              <NoticeBanner title="Accesso non riuscito" message={error} tone="error" />
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-6 space-y-5" noValidate>
            <Input
              id="login-email"
              label="Email istituzionale"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome.cognome@calabriaverde.eu"
              required
              autoComplete="email"
            />

            <div className="space-y-1">
              <Input
                id="login-password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Link href={withAppBasePath('/reset-password')} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--cv-primary)' }}>
                  Password dimenticata?
                </Link>
              </div>
            </div>

            <Button id="login-submit" type="submit" loading={loading} size="lg" className="w-full">
              {loading ? 'Accesso in corso...' : 'Accedi al gestionale'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Non hai ancora un account?{' '}
              <Link href={withAppBasePath('/register')} className="font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--cv-primary)' }}>
                Richiedi accesso
              </Link>
            </p>
          </div>

          <div className="mt-6 rounded-[var(--cv-radius-md)] border p-4" style={{ background: 'var(--cv-primary-lighter)', borderColor: 'var(--cv-primary-light)' }}>
            <p className="text-xs" style={{ color: 'var(--cv-primary-darker)' }}>
              <strong>Accesso riservato</strong> al personale autorizzato di Calabria Verde. Per assistenza contattare il supporto tecnico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
