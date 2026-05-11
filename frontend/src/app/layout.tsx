import type { Metadata } from "next";
import { Titillium_Web, Lora, Roboto_Mono } from "next/font/google";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/test";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gestionale Calabria Verde",
  description:
    "Sistema gestionale aziendale per Calabria Verde — Ente per la gestione del patrimonio boschivo della Regione Calabria",
  keywords: "Calabria Verde, gestionale, patrimonio boschivo, antincendio, risorse umane",
  authors: [{ name: "Calabria Verde" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${titillium.variable} ${lora.variable} ${robotoMono.variable}`}>
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
                  if ('${process.env.NODE_ENV}' === 'production') {
                    navigator.serviceWorker.register('${basePath}/sw.js')
                      .then(reg => console.log('[SW] Registrato:', reg.scope))
                      .catch(err => console.warn('[SW] Errore:', err));
                    return;
                  }

                  navigator.serviceWorker.getRegistrations()
                    .then(function(registrations) {
                      registrations.forEach(function(registration) {
                        registration.unregister();
                      });
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
