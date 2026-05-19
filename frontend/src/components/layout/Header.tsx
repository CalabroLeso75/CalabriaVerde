'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { withAppBasePath } from '@/lib/app-path';

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Panoramica operativa' },
  '/hr': { title: 'Risorse Umane', subtitle: 'Accesso alle anagrafiche del personale' },
  '/hr/interna': { title: 'Anagrafica interna', subtitle: 'Personale dipendente di Calabria Verde' },
  '/hr/esterna': { title: 'Anagrafica esterna', subtitle: 'Personale esterno e organizzazioni collegate' },
  '/hr/new': { title: 'Nuovo Dipendente', subtitle: 'Inserimento anagrafica' },
  '/fleet': { title: 'Parco Macchine', subtitle: 'Veicoli e attrezzature' },
  '/fleet/anagrafica': { title: 'Anagrafica mezzi', subtitle: 'Archivio completo del parco macchine e storico operativo' },
  '/fleet/mappa': { title: 'Mappa mezzi', subtitle: 'Localizzazione mezzi e predisposizione al tracking futuro' },
  '/fleet/dettaglio': { title: 'Fascicolo mezzo', subtitle: 'Dati tecnici, coperture, assegnazioni, documenti e sinistri' },
  '/warehouse': { title: 'Magazzino', subtitle: 'Giacenze e movimentazioni' },
  '/aib': { title: 'Antincendio - AIB', subtitle: 'Gestione eventi e squadre' },
  '/aib/map': { title: 'Mappa Squadre AIB', subtitle: 'Posizioni in tempo reale' },
  '/operations': { title: 'Sale Operative', subtitle: 'Monitoraggio operativo' },
  '/tools': { title: 'Strumenti', subtitle: 'Utilita trasversali e moduli di supporto' },
  '/tools/geography': { title: 'Geografia', subtitle: 'Stati, regioni, province, comuni e layer territoriali' },
  '/tools/codice-fiscale': { title: 'Codice Fiscale', subtitle: 'Ricerca, analisi e generazione inversa' },
  '/admin': { title: 'Amministrazione', subtitle: 'Gestione sistema e utenti' },
  '/admin/contracts': { title: 'Tipi di Contratto', subtitle: 'CCNL, integrativi e regole base di sistema' },
  '/admin/geography': { title: 'Geografia', subtitle: 'Stati, regioni, province, comuni e layer territoriali' },
  '/admin/pending': { title: 'Registrazioni Pending', subtitle: 'Richieste di accesso in attesa' },
  '/admin/users': { title: 'Gestione Utenti', subtitle: 'Ruoli, stati e permessi' },
  '/admin/roles': { title: 'Ruoli e Permessi', subtitle: 'Configurazione accessi' },
  '/admin/organizations': { title: 'Organizzazioni', subtitle: 'Distretti e strutture' },
  '/admin/logs': { title: 'Log di Sistema', subtitle: 'Audit trail operazioni' },
  '/admin/settings': { title: 'Configurazione', subtitle: 'Impostazioni e integrazioni' },
  '/admin/documentation': { title: 'Documentazione', subtitle: 'Prontuario operativo e procedure consolidate' },
  '/login': { title: 'Accesso', subtitle: 'Calabria Verde Gestionale' },
  '/register': { title: 'Richiesta di Accesso', subtitle: 'Nuovo account gestionale' },
};

function getPageMeta(pathname: string) {
  if (routeTitles[pathname]) return routeTitles[pathname];

  if (/^\/hr\/\d+$/.test(pathname)) {
    return { title: 'Fascicolo Dipendente', subtitle: 'Dati anagrafici, contrattuali e operativi' };
  }

  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i -= 1) {
    const partial = `/${segments.slice(0, i).join('/')}`;
    if (routeTitles[partial]) return routeTitles[partial];
  }

  return { title: 'Gestionale', subtitle: 'Calabria Verde' };
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { title, subtitle } = getPageMeta(pathname || '/dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth-state-changed'));
    setMenuOpen(false);
    router.replace(withAppBasePath('/login'));
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-md"
      style={{
        left: 'var(--sidebar-width, 260px)',
        borderColor: 'var(--cv-border-subtle)',
        background: 'rgba(255,255,255,0.88)',
      }}
    >
      <div className="skiplinks" role="navigation" aria-label="Scorciatoie">
        <a href="#main-content">Vai al contenuto principale</a>
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold" style={{ color: 'var(--cv-neutral-900)' }}>
          {title}
        </h1>
        <p className="truncate text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="header-notifications"
          className="relative rounded-[var(--cv-radius-md)] border p-2 transition-colors hover:bg-[var(--cv-neutral-100)]"
          style={{ color: 'var(--cv-neutral-600)', borderColor: 'var(--cv-border-subtle)' }}
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

        <div className="relative" ref={menuRef}>
          <button
            id="header-profile"
            className="flex items-center gap-2 rounded-[var(--cv-radius-md)] border px-3 py-1.5 transition-colors hover:bg-[var(--cv-neutral-100)]"
            style={{ borderColor: 'var(--cv-border-subtle)' }}
            aria-label="Profilo utente"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
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
              className={`w-4 h-4 hidden sm:block transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--cv-neutral-500)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[var(--cv-radius-md)] border bg-white shadow-[var(--cv-shadow-md)]"
              style={{ borderColor: 'var(--cv-border-subtle)' }}
            >
              <div className="border-b px-4 py-3" style={{ borderColor: 'var(--cv-border-subtle)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  R. Cusano
                </p>
                <p className="text-xs" style={{ color: 'var(--cv-neutral-600)' }}>
                  amministratore@calabriaverde.eu
                </p>
              </div>

              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--cv-neutral-100)]"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                </svg>
                Disconnetti
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
