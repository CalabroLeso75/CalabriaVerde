'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cv-neutral-100)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Area principale */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 260px)' }}
      >
        {/* Header dinamico */}
        <Header />

        {/* Contenuto */}
        <main
          id="main-content"
          role="main"
          className="pt-16 min-h-screen"
        >
          <div className="p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
