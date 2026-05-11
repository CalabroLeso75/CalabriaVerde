'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{
        access_token: string;
        refresh_token: string;
      }>('/auth/login', { email, password });

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      router.push('/dashboard');
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
      {/* Pannello sinistro — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, var(--cv-primary-darker) 0%, var(--cv-primary-dark) 60%, var(--cv-primary) 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
            <Image
              src="/assets/logo-calabriaverde.png"
              alt="Logo Calabria Verde"
              width={40}
              height={40}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
            />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">Calabria Verde</p>
            <p className="text-white/60 text-xs">Gestionale Aziendale</p>
          </div>
        </div>

        {/* Tagline centrale */}
        <div className="text-white space-y-4">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight" style={{ color: 'white' }}>
            Gestisci il patrimonio
            <br />
            <span style={{ color: 'var(--cv-accent)' }}>boschivo della Calabria</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Piattaforma integrata per la gestione operativa di Calabria Verde.
            HR, Parco Macchine, Antincendio, Magazzino e Sale Operative in un&apos;unica interfaccia.
          </p>

          {/* Feature list */}
          <div className="space-y-3 pt-4">
            {[
              'Accesso offline per il personale sul campo',
              'Gestione in tempo reale delle squadre AIB',
              'Integrazione GPS e meteo operativa',
              'AGID compliant e accessibile',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/80">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--cv-accent)', color: 'var(--cv-primary-darker)' }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/40 text-xs">
          © 2026 Calabria Verde — Regione Calabria
        </p>
      </div>

      {/* Pannello destro — form login */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-[var(--cv-neutral-300)]">
              <Image
                src="/assets/logo-calabriaverde.png"
                alt="Calabria Verde"
                width={40}
                height={40}
                style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
              />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--cv-neutral-900)' }}>Calabria Verde</p>
              <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>Gestionale Aziendale</p>
            </div>
          </div>

          {/* Intestazione form */}
          <div>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
              Accedi
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Inserisci le credenziali istituzionali per accedere al gestionale.
            </p>
          </div>

          {/* Alert errore */}
          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg border"
              style={{
                background: 'var(--cv-danger)18',
                borderColor: 'var(--cv-danger)44',
                color: 'var(--cv-danger)',
              }}
              role="alert"
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/reset-password"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--cv-primary)' }}
                >
                  Password dimenticata?
                </Link>
              </div>
            </div>

            <Button
              id="login-submit"
              type="submit"
              loading={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Accesso in corso...' : 'Accedi al gestionale'}
            </Button>
          </form>

          {/* Link registrazione */}
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Non hai ancora un account?{' '}
              <Link
                href="/register"
                className="font-semibold transition-colors"
                style={{ color: 'var(--cv-primary)' }}
              >
                Richiedi accesso
              </Link>
            </p>
          </div>

          {/* Info accesso */}
          <div
            className="p-4 rounded-lg border"
            style={{
              background: 'var(--cv-primary-lighter)',
              borderColor: 'var(--cv-primary-light)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--cv-primary-darker)' }}>
              <strong>Accesso riservato</strong> al personale autorizzato di Calabria Verde.
              Per assistenza contattare il supporto tecnico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
