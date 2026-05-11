'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':        { title: 'Dashboard', subtitle: 'Panoramica operativa' },
  '/hr':               { title: 'Risorse Umane', subtitle: 'Anagrafica evoluta dei dipendenti' },
  '/hr/new':           { title: 'Nuovo Dipendente', subtitle: 'Inserimento anagrafica' },
  '/fleet':            { title: 'Parco Macchine', subtitle: 'Veicoli e attrezzature' },
  '/warehouse':        { title: 'Magazzino', subtitle: 'Giacenze e movimentazioni' },
  '/aib':              { title: 'Antincendio — AIB', subtitle: 'Gestione eventi e squadre' },
  '/aib/map':          { title: 'Mappa Squadre AIB', subtitle: 'Posizioni in tempo reale' },
  '/operations':       { title: 'Sale Operative', subtitle: 'Monitoraggio operativo' },
  '/admin':            { title: 'Amministrazione', subtitle: 'Gestione sistema e utenti' },
  '/admin/contracts':  { title: 'Tipi di Contratto', subtitle: 'CCNL, integrativi e regole base di sistema' },
  '/admin/pending':    { title: 'Registrazioni Pending', subtitle: 'Richieste di accesso in attesa' },
  '/admin/users':      { title: 'Gestione Utenti', subtitle: 'Ruoli, stati e permessi' },
  '/admin/roles':      { title: 'Ruoli e Permessi', subtitle: 'Configurazione accessi' },
  '/admin/organizations': { title: 'Organizzazioni', subtitle: 'Distretti e strutture' },
  '/admin/logs':       { title: 'Log di Sistema', subtitle: 'Audit trail operazioni' },
  '/admin/settings':   { title: 'Configurazione', subtitle: 'Impostazioni e integrazioni' },
  '/login':            { title: 'Accesso', subtitle: 'Calabria Verde Gestionale' },
  '/register':         { title: 'Richiesta di Accesso', subtitle: 'Nuovo account gestionale' },
};

function getPageMeta(pathname: string) {
  // Match esatto
  if (routeTitles[pathname]) return routeTitles[pathname];

  // Fascicolo dipendente: /hr/[id numerico]
  if (/^\/hr\/\d+$/.test(pathname)) {
    return { title: 'Fascicolo Dipendente', subtitle: 'Dati anagrafici, contrattuali e operativi' };
  }

  // Match parziale per route dinamiche (es. /hr/123 → /hr)
  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const partial = '/' + segments.slice(0, i).join('/');
    if (routeTitles[partial]) return routeTitles[partial];
  }

  return { title: 'Gestionale', subtitle: 'Calabria Verde' };
}

export function Header() {
  const pathname = usePathname();
  const { title, subtitle } = getPageMeta(pathname || '/dashboard');

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white border-b z-30 flex items-center justify-between px-6"
      style={{
        left: 'var(--sidebar-width, 260px)',
        borderColor: 'var(--cv-neutral-300)',
      }}
    >
      {/* Skiplinks accessibilità AGID */}
      <div className="skiplinks" role="navigation" aria-label="Scorciatoie">
        <a href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* Titolo pagina dinamico */}
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
          {title}
        </h1>
        <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
          {subtitle}
        </p>
      </div>

      {/* Azioni header */}
      <div className="flex items-center gap-2">
        {/* Notifiche */}
        <button
          id="header-notifications"
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--cv-neutral-600)' }}
          aria-label="Notifiche"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ background: 'var(--cv-danger)' }}
          >
            3
          </span>
        </button>

        {/* Profilo */}
        <button
          id="header-profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
          aria-label="Profilo utente"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'var(--cv-primary)' }}
          >
            RC
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
              R. Cusano
            </p>
            <p className="text-[10px]" style={{ color: 'var(--cv-neutral-600)' }}>
              Amministratore
            </p>
          </div>
          <svg
            className="w-4 h-4 hidden sm:block"
            style={{ color: 'var(--cv-neutral-500)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
