'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { withAppBasePath } from '@/lib/app-path';

/* Statistiche placeholder per la dashboard */
const stats = [
  {
    label: 'Dipendenti attivi',
    value: '4.218',
    change: '+12',
    changeLabel: 'questo mese',
    color: 'var(--cv-primary)',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
];

const recentActivities = [
  { time: '14:32', user: 'M. Ferraro', action: 'Approvata registrazione', target: 'G. Malara', type: 'success' },
  { time: '14:15', user: 'Sistema', action: 'Evento incendio segnalato', target: 'Distretto Cosenza', type: 'danger' },
  { time: '13:58', user: 'L. Cataldo', action: 'Aggiornata scheda veicolo', target: 'AB 123 CV', type: 'info' },
  { time: '13:40', user: 'R. Cusano', action: 'Inserito nuovo dipendente', target: 'P. Greco', type: 'success' },
  { time: '13:22', user: 'Sistema', action: 'Scorte sotto soglia', target: 'Magazzino Reggio Cal.', type: 'warning' },
];

const typeColors: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--cv-neutral-900)]">
          Buon pomeriggio 👋
        </h2>
        <p className="text-[var(--cv-neutral-600)] mt-1">
          Ecco la panoramica operativa di Calabria Verde
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--cv-neutral-600)] font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--cv-neutral-500)] mt-1">
                  <span className="font-semibold" style={{ color: stat.color }}>{stat.change}</span> {stat.changeLabel}
                </p>
              </div>
              <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: stat.color + '15', color: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Contenuto principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attività recenti */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Attività Recenti"
              subtitle="Ultime operazioni sul gestionale"
            />
            <div className="space-y-3">
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--cv-neutral-100)] transition-colors"
                >
                  <span className="text-xs text-[var(--cv-neutral-500)] font-mono w-10 flex-shrink-0">
                    {activity.time}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[activity.type]}`}>
                    {activity.type === 'success' ? '✓' : activity.type === 'danger' ? '!' : activity.type === 'warning' ? '⚠' : 'i'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-[var(--cv-neutral-800)]">{activity.user}</span>
                      {' '}
                      <span className="text-[var(--cv-neutral-600)]">{activity.action}</span>
                      {' '}
                      <span className="font-medium text-[var(--cv-primary-dark)]">{activity.target}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Moduli rapidi */}
        <div>
          <Card>
            <CardHeader title="Accesso Rapido" />
            <div className="space-y-2">
              {[
                { label: 'Nuovo Dipendente', href: '/hr/new', color: 'var(--cv-primary)' },
                { label: 'Registrazioni Pending', href: '/admin/pending', color: 'var(--cv-warning)' },
                { label: 'Mappa Squadre', href: '/aib/map', color: 'var(--cv-danger)' },
                { label: 'Report Magazzino', href: '/warehouse/report', color: 'var(--cv-info)' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={withAppBasePath(link.href)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--cv-neutral-300)] hover:border-[var(--cv-primary-light)] hover:bg-[var(--cv-primary-lighter)] transition-all group"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: link.color }}
                  />
                  <span className="text-sm font-medium text-[var(--cv-neutral-700)] group-hover:text-[var(--cv-primary-dark)]">
                    {link.label}
                  </span>
                  <svg className="w-4 h-4 ml-auto text-[var(--cv-neutral-400)] group-hover:text-[var(--cv-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
