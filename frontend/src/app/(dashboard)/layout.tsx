'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { withAppBasePath } from '@/lib/app-path';

function subscribeAuth(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener('storage', handler);
  window.addEventListener('auth-state-changed', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('auth-state-changed', handler);
  };
}

function getAuthSnapshot() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(localStorage.getItem('access_token'));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    setAuthResolved(true);
  }, []);

  useEffect(() => {
    if (authResolved && !isAuthenticated) {
      router.replace(withAppBasePath('/login'));
    }
  }, [authResolved, isAuthenticated, pathname, router]);

  if (!authResolved || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cv-neutral-100)' }}>
        <div className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Verifica sessione in corso...
        </div>
      </div>
    );
  }

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
