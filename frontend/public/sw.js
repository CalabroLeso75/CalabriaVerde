/**
 * Service Worker — Calabria Verde Gestionale
 * Strategia: Cache First per asset statici, Network First per API
 */

const CACHE_NAME = 'cv-gestionale-v1';
const API_BASE = '/api';

// Asset da pre-cachare (App Shell)
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/assets/logo-calabriaverde.png',
];

// ============================================
// INSTALL — Pre-cache App Shell
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ============================================
// ACTIVATE — Pulizia vecchie cache
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ============================================
// FETCH — Strategia ibrida
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non HTTP
  if (!url.protocol.startsWith('http')) return;

  // API calls — Network First con fallback offline
  if (url.pathname.startsWith(API_BASE)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Asset statici — Cache First
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

/**
 * Network First: prova la rete, fallback alla cache.
 * Per le API: risposta offline generica se non disponibile.
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    // Salva in cache le risposte GET riuscite
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Offline: prova dalla cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Risposta di errore offline per le API
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Connessione non disponibile. Dati in cache potrebbero non essere aggiornati.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache First: prova la cache, fallback alla rete.
 * Per asset statici e pagine.
 */
async function cacheFirstWithNetworkFallback(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);

    // Aggiorna cache per richieste GET riuscite
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Fallback alla pagina offline se esiste in cache
    const offlinePage = await caches.match('/offline');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// ============================================
// BACKGROUND SYNC — per operazioni offline
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-operations') {
    console.log('[SW] Background sync: pending operations');
    event.waitUntil(syncPendingOperations());
  }
});

async function syncPendingOperations() {
  // TODO Fase 3: sincronizzare le operazioni offline salvate in IndexedDB
  console.log('[SW] Sync pending operations - placeholder');
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: '/assets/logo-calabriaverde.png',
    badge: '/assets/logo-calabriaverde.png',
    tag: data.tag || 'cv-notification',
    data: data.url || '/dashboard',
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Calabria Verde', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
