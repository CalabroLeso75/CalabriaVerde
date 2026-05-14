'use client';

import React from 'react';
import Link from 'next/link';

import { Card, CardHeader } from '@/components/ui/Card';

const stats = [
  {
    label: 'Dipendenti attivi',
    value: '4.218',
    change: '+12',
    changeLabel: 'questo mese',
    color: 'var(--cv-primary)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Mezzi operativi',
    value: '342',
    change: '98%',
    changeLabel: 'disponibili',
    color: 'var(--cv-info)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: 'Squadre AIB attive',
    value: '47',
    change: '12',
    changeLabel: 'in missione',
    color: 'var(--cv-warning)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    label: 'Eventi in corso',
    value: '3',
    change: '2',
    changeLabel: 'critici',
    color: 'var(--cv-danger)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
];

const recentActivities = [
  { time: '14:32', user: 'M. Ferraro', action: 'Approvata registrazione', target: 'G. Malara', tone: 'success' },
  { time: '14:15', user: 'Sistema', action: 'Evento incendio segnalato', target: 'Distretto Cosenza', tone: 'danger' },
  { time: '13:58', user: 'L. Cataldo', action: 'Aggiornata scheda veicolo', target: 'AB 123 CV', tone: 'info' },
  { time: '13:40', user: 'R. Cusano', action: 'Inserito nuovo dipendente', target: 'P. Greco', tone: 'success' },
  { time: '13:22', user: 'Sistema', action: 'Scorte sotto soglia minima', target: 'Magazzino Reggio Calabria', tone: 'warning' },
] as const;

const toneMap = {
  success: { bg: '#e7f5ee', fg: 'var(--cv-success)', label: 'OK' },
  danger: { bg: '#fcebec', fg: 'var(--cv-danger)', label: 'AL' },
  warning: { bg: '#fff4df', fg: 'var(--cv-warning)', label: 'AT' },
  info: { bg: '#eaf3fb', fg: 'var(--cv-info)', label: 'IN' },
} as const;

const quickLinks = [
  { label: 'Nuovo Dipendente', href: '/hr/new', color: 'var(--cv-primary)' },
  { label: 'Registrazioni Pending', href: '/admin/pending', color: 'var(--cv-warning)', badge: 7 },
  { label: 'Mappa Squadre AIB', href: '/aib/map', color: 'var(--cv-danger)' },
  { label: 'Report Magazzino', href: '/warehouse/report', color: 'var(--cv-info)' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[var(--cv-radius-lg)] border bg-[var(--cv-surface-2)] px-6 py-5 shadow-[var(--cv-shadow-sm)]" style={{ borderColor: 'var(--cv-border-subtle)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--cv-primary)' }}>
              Quadro generale
            </p>
            <h2 className="mt-1 text-2xl font-bold">Benvenuto</h2>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
              Vista sintetica delle attivita piu rilevanti del gestionale, con attenzione a personale,
              mezzi, antincendio e punti operativi che richiedono un intervento rapido.
            </p>
          </div>
          <div className="grid min-w-[240px] grid-cols-2 gap-3 lg:max-w-sm">
            <div className="rounded-[var(--cv-radius-md)] border px-4 py-3" style={{ borderColor: 'var(--cv-border-subtle)', background: 'var(--cv-primary-lighter)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-600)' }}>
                Stato piattaforma
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--cv-primary-darker)' }}>
                Operativa
              </p>
            </div>
            <div className="rounded-[var(--cv-radius-md)] border px-4 py-3" style={{ borderColor: 'var(--cv-border-subtle)', background: 'white' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-600)' }}>
                Ambiente
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                Collaudo / Test
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} hover>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-600)' }}>
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--cv-neutral-500)' }}>
                  <span className="font-semibold" style={{ color: stat.color }}>{stat.change}</span> {stat.changeLabel}
                </p>
              </div>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--cv-radius-md)]"
                style={{ background: `${stat.color}14`, color: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader title="Attivita Recenti" subtitle="Ultime operazioni rilevate nel gestionale" />
          <div className="space-y-2">
            {recentActivities.map((activity) => {
              const tone = toneMap[activity.tone];
              return (
                <div
                  key={`${activity.time}-${activity.user}-${activity.target}`}
                  className="flex items-start gap-3 rounded-[var(--cv-radius-md)] border px-3 py-3 transition-colors hover:bg-[var(--cv-neutral-50)]"
                  style={{ borderColor: 'var(--cv-border-subtle)' }}
                >
                  <div className="w-12 shrink-0 pt-0.5 text-xs font-mono" style={{ color: 'var(--cv-neutral-500)' }}>
                    {activity.time}
                  </div>
                  <span
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {tone.label}
                  </span>
                  <p className="min-w-0 text-sm leading-6">
                    <span className="font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>{activity.user}</span>{' '}
                    <span style={{ color: 'var(--cv-neutral-600)' }}>{activity.action}</span>{' '}
                    <span className="font-semibold" style={{ color: 'var(--cv-primary-darker)' }}>{activity.target}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Accesso Rapido" subtitle="Collegamenti alle azioni piu frequenti" />
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-[var(--cv-radius-md)] border px-4 py-3 transition-all hover:bg-[var(--cv-neutral-50)]"
                  style={{ borderColor: 'var(--cv-border-subtle)' }}
                >
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: link.color }} />
                  <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                    {link.label}
                  </span>
                  {link.badge ? (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${link.color}18`, color: link.color }}>
                      {link.badge}
                    </span>
                  ) : null}
                  <svg className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--cv-neutral-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--cv-success)] animate-pulse" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-neutral-500)' }}>
                  Sistema
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
                  Servizi attivi - versione 1.0.0
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
