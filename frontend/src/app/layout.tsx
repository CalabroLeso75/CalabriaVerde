import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/test";

export const metadata: Metadata = {
  title: "Gestionale Calabria Verde",
  description:
    "Sistema gestionale aziendale per Calabria Verde - Ente per la gestione del patrimonio boschivo della Regione Calabria",
  keywords: "Calabria Verde, gestionale, patrimonio boschivo, antincendio, risorse umane",
  authors: [{ name: "Calabria Verde" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={`${basePath}/assets/logo-calabriaverde.png`} />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <meta name="theme-color" content="#1A5C3A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CV Gestionale" />
      </head>
      <body className="antialiased font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations()
                    .then(function(registrations) {
                      registrations.forEach(function(registration) {
                        registration.unregister();
                      });
                      return caches.keys();
                    })
                    .then(function(keys) {
                      return Promise.all(keys.map(function(key) {
                        return caches.delete(key);
                      }));
                    })
                    .catch(function(err) {
                      console.warn('[SW] Cleanup fallito:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
