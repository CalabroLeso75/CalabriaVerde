'use client';

import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { withAppBasePath } from '@/lib/app-path';

const documents = [
  {
    title: 'API key e provider targhe',
    slug: 'api-key-provider-targhe',
    summary: 'Procedura corretta per Openapi Automotive, Targa.co.it/RegCheck, token, cache e verifica crediti.',
    items: [
      'Openapi Automotive non usa direttamente la API key account come Bearer: la API key serve con email in Basic Auth per generare un token OAuth.',
      'Token produzione: POST https://oauth.openapi.it/token con scope Automotive; token sandbox: POST https://test.oauth.openapi.it/token.',
      'Endpoint veicolo Italia: GET https://automotive.openapi.com/IT-car/{targa}; sandbox: GET https://test.automotive.openapi.com/IT-car/{targa}.',
      'Endpoint assicurazione Italia: GET https://automotive.openapi.com/IT-insurance/{targa}; sandbox: GET https://test.automotive.openapi.com/IT-insurance/{targa}.',
      'Nel gestionale il token OAuth va salvato in Amministrazione > Configurazione > API key opzionale scegliendo Openapi Automotive.',
      'Ogni lookup riuscito viene salvato in vehicle_external_lookups e deve essere riusato prima di chiamare il provider.',
    ],
  },
  {
    title: 'Parco Macchine',
    slug: 'parco-macchine',
    summary: 'Flusso mezzi, riconoscimento targa, assicurazioni, revisioni, assegnazioni e storico.',
    items: [
      'La pagina /fleet/ mostra la lista unica ordinata per completezza dati: completi, parziali, scaduti, solo targa.',
      'La pagina /fleet/anagrafica/ contiene le tessere operative e il pulsante Riconosci mezzo.',
      'Il dettaglio mezzo /fleet/dettaglio/?id=... contiene assicurazioni, revisioni, assegnazioni, alert, sinistri e storico operazioni.',
      'Il riconoscimento deve prima consultare la cache locale, poi eventualmente chiamare il provider configurato.',
      'Il salvataggio dell’aggiornamento non deve chiamare provider esterni: applica dati gia registrati o selezionati.',
    ],
  },
  {
    title: 'Ambienti e percorsi',
    slug: 'ambienti-percorsi',
    summary: 'Regole per Collaudo locale, Test online e futura Produzione.',
    items: [
      'Collaudo e Test usano basePath: i link gestiti da Next devono usare withAppBasePath.',
      'Le navigazioni manuali con window.location devono usare withBrowserBasePath per non uscire da /test.',
      'Test online frontend: https://smart-cv.it/test/. API Test: https://82-165-198-214.sslip.io/api.',
      'Prima di dichiarare pronta una correzione va verificato l’URL preciso indicato nella richiesta.',
    ],
  },
  {
    title: 'Registro errori e cache',
    slug: 'registro-errori-cache',
    summary: 'Come evitare ripetizione errori, consumo crediti e perdita dati API.',
    items: [
      'Ogni errore ricorrente va registrato in directives/error_memory.md con causa, correzione e prevenzione.',
      'Ogni integrazione API deve salvare log persistenti prima di mostrare i dati in modale.',
      'Un flush SQLAlchemy non basta: se il dato deve valere come cache, serve commit prima della risposta.',
      'Gli errori provider 500, timeout, 402 e 401 non devono diventare “dato non aggiornabile” senza log tecnico.',
    ],
  },
  {
    title: 'Risorse Umane',
    slug: 'risorse-umane',
    summary: 'Anagrafica interna, esterna, fascicolo personale, documenti, qualifiche e abilitazioni.',
    items: [
      'Risorse Umane distingue anagrafica interna e anagrafica esterna.',
      'L’anagrafica esterna non usa sezioni contrattuali interne: usa collaborazione, allegati e riferimenti.',
      'Il fascicolo personale deve mantenere documenti, qualifiche, patenti e abilitazioni come dati riusabili.',
      'Le pagine non devono avere doppia intestazione uguale al titolo del layout.',
    ],
  },
  {
    title: 'Strumenti',
    slug: 'strumenti',
    summary: 'Geografia, codici fiscali e moduli riusabili trasversali.',
    items: [
      'Geografia gestisce stati, regioni, province, comuni, confini e toponimi.',
      'Codice fiscale gestisce generazione e lettura inversa quando i dati disponibili lo consentono.',
      'I moduli comuni devono essere estratti in componenti o servizi condivisi prima di duplicare logica.',
    ],
  },
];

export default function AdminDocumentationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--cv-neutral-900)]">Documentazione</h2>
        <p className="mt-1 text-sm text-[var(--cv-neutral-600)]">
          Prontuario operativo del gestionale: integrazioni, moduli, ambienti e procedure da non ripetere a memoria.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {documents.map((doc) => (
          <Card key={doc.slug} padding="md">
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--cv-neutral-900)]">{doc.title}</h3>
                <p className="mt-1 text-sm text-[var(--cv-neutral-600)]">{doc.summary}</p>
              </div>
              <ul className="space-y-2 text-sm text-[var(--cv-neutral-700)]">
                {doc.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--cv-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-[var(--cv-neutral-900)]">File sorgente del prontuario</h3>
        <p className="mt-1 text-sm text-[var(--cv-neutral-600)]">
          La copia estesa dei documenti vive anche nella cartella di progetto <code>directives/documentation</code>, cosi resta tracciata da Git.
        </p>
        <Link href={withAppBasePath('/admin/settings')} className="mt-4 inline-flex text-sm font-semibold text-[var(--cv-primary)]">
          Vai alla configurazione API
        </Link>
      </Card>
    </div>
  );
}
