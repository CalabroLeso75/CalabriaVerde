'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withAppBasePath } from '@/lib/app-path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/test';
const logoSrc = `${basePath}/assets/logo-calabriaverde.png`;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const dotIcon = <span className="inline-block h-2 w-2 rounded-full bg-current" />;

const navigationSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operatività',
    items: [
      {
        label: 'Cruscotto',
        href: '/dashboard',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm10 8h8v-8h-8v8zM3 21h8v-6H3v6zm10-10h8V3h-8v8z" />
          </svg>
        ),
      },
      {
        label: 'Persone',
        href: '/hr',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5 1.343 3.5 3 3.5zM8 11c1.657 0 3-1.567 3-3.5S9.657 4 8 4 5 5.567 5 7.5 6.343 11 8 11zm0 2c-2.761 0-5 1.79-5 4v1h10v-1c0-2.21-2.239-4-5-4zm8 0c-.693 0-1.354.112-1.953.315A4.602 4.602 0 0116 17v1h5v-1c0-2.21-2.239-4-5-4z" />
          </svg>
        ),
        children: [
          { label: 'Personale interno', href: '/hr/interna', icon: dotIcon },
          { label: 'Personale esterno', href: '/hr/esterna', icon: dotIcon },
        ],
      },
      {
        label: 'Mezzi',
        href: '/fleet',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l1.5-5.25A3 3 0 018.38 8.5h7.24a3 3 0 012.88 2.25L20 16M5 16h14M7 16v2m10-2v2M8 18h.01M16 18h.01" />
          </svg>
        ),
        children: [
          { label: 'Tutti i mezzi', href: '/fleet/anagrafica', icon: dotIcon },
          { label: 'Catalogo tecnico', href: '/fleet/catalogo', icon: dotIcon },
          { label: 'Mappa mezzi', href: '/fleet/mappa', icon: dotIcon },
        ],
      },
      {
        label: 'Magazzino',
        href: '/warehouse',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        label: 'AIB',
        href: '/aib',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        ),
      },
      {
        label: 'Sale operative',
        href: '/operations',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m5 10V5m5 14v-7m5 7V8" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Supporto',
    items: [
      {
        label: 'Strumenti',
        href: '/tools',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 010 1.4l-1.6 1.6a2 2 0 102.8 2.8l1.6-1.6a1 1 0 011.4 1.4l-1.6 1.6a4 4 0 11-5.6-5.6l1.6-1.6a1 1 0 011.4 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.3 17.7a1 1 0 010-1.4l1.6-1.6a2 2 0 10-2.8-2.8l-1.6 1.6a1 1 0 01-1.4-1.4l1.6-1.6a4 4 0 115.6 5.6l-1.6 1.6a1 1 0 01-1.4 0z" />
          </svg>
        ),
        children: [
          { label: 'Geografia', href: '/tools/geography', icon: dotIcon },
          { label: 'Codice fiscale', href: '/tools/codice-fiscale', icon: dotIcon },
        ],
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Amministrazione',
        href: '/admin',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        ),
        children: [
          { label: 'Utenti', href: '/admin/users', icon: dotIcon },
          { label: 'Ruoli e permessi', href: '/admin/roles', icon: dotIcon },
          { label: 'Contratti', href: '/admin/contracts', icon: dotIcon },
          { label: 'Sedi e strutture', href: '/admin/organizations', icon: dotIcon },
          { label: 'Impostazioni', href: '/admin/settings', icon: dotIcon },
          { label: 'Documentazione', href: '/admin/documentation', icon: dotIcon },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Overlay mobile */}
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden hidden" />

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen z-50
          text-white
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          shadow-[0_18px_48px_rgba(14,37,27,0.24)]
        `}
        style={{
          background: 'linear-gradient(180deg, #174431 0%, #1d5a40 52%, #1b563c 100%)',
        }}
      >
        {/* Header con logo */}
        <div className={`flex h-16 items-center gap-3 border-b px-4 ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-[var(--cv-radius-md)] bg-white shadow-sm">
            <img
              src={logoSrc}
              alt="Calabria Verde"
              width={28}
              height={28}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
            />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <p className="text-sm font-bold leading-tight text-white">Calabria Verde</p>
              <p className="text-[10px] leading-tight text-white/58">Gestionale Aziendale</p>
            </div>
          )}
        </div>

        {/* Navigazione */}
        <nav className="flex-1 overflow-y-auto px-2 py-4" role="navigation" aria-label="Navigazione principale">
          <div className="space-y-5">
            {navigationSections.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={withAppBasePath(item.href)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-[var(--cv-radius-md)]
                      transition-all duration-200 group
                      ${isActive
                        ? 'text-white font-semibold shadow-sm'
                        : 'text-white/72 hover:text-white'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-[var(--cv-accent)]' : 'text-white/72 group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate text-sm animate-fade-in">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto bg-[var(--cv-accent)] text-[var(--cv-neutral-900)] text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {!collapsed && item.children && isActive && (
                    <ul className="mt-1 ml-6 space-y-1 border-l pl-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || pathname?.startsWith(child.href + '/');
                        return (
                          <li key={child.href}>
                            <Link
                              href={withAppBasePath(child.href)}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-[var(--cv-radius-sm)] text-sm transition-all duration-200
                                ${childActive
                                  ? 'text-white font-semibold'
                                  : 'text-white/66 hover:text-white'}
                              `}
                              style={{
                                background: childActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                              }}
                            >
                              <span className="flex-shrink-0">{child.icon}</span>
                              <span className="truncate">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-12 items-center justify-center border-t text-white/52 transition-colors hover:bg-white/5 hover:text-white"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}
