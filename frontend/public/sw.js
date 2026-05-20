/**
 * Service worker di dismissione.
 *
 * Le prime versioni del gestionale usavano una cache-first aggressiva che
 * poteva mostrare pagine e chunk obsoleti dopo il deploy. Questo file resta
 * pubblicato solo per disregistrare il vecchio service worker e svuotare le
 * cache del browser.
 */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('fetch', () => {
  // Nessuna intercettazione: ogni richiesta deve andare alla rete.
});
