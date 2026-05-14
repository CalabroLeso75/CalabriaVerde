# Progetto per la Direzione Generale

## Titolo provvisorio

Sviluppo di un gestionale integrato per il supporto alle attività operative, amministrative e di coordinamento di Calabria Verde.

---

## Premessa

Il presente documento raccoglie finalità, obiettivi, moduli, benefici e stato di avanzamento del gestionale in corso di realizzazione, con aggiornamento continuo in base alle attività tecniche realmente verificate.

---

## Esigenza organizzativa

Calabria Verde necessita di una piattaforma unica per gestire in modo ordinato personale interno, personale esterno, strumenti territoriali, contratti e funzioni operative, superando frammentazione, lentezza e difficoltà di controllo del precedente gestionale.

---

## Obiettivi generali

- creare un gestionale modulare, veloce e manutenibile;
- separare sviluppo, collaudo pubblico e produzione;
- rendere verificabili dati, ruoli, fascicoli e flussi operativi;
- costruire una base estendibile per attività HR, territoriali, AIB e amministrative.

---

## Obiettivi specifici

- gestire anagrafica interna ed esterna in viste separate ma coerenti;
- mantenere un fascicolo personale evoluto con qualifiche, documenti, patenti e abilitazioni;
- governare i contratti interni e le collaborazioni esterne con modelli distinti;
- fornire strumenti riusabili per geografia e codice fiscale;
- mantenere ambienti Collaudo, Test e Produzione con promozione controllata.

---

## Destinatari e utilizzatori

- Direzione Generale;
- uffici Risorse Umane;
- strutture amministrative;
- responsabili di area e distretto;
- personale operativo e collaboratori esterni, secondo i ruoli assegnati.

---

## Benefici attesi

- maggiore ordine e tracciabilità dei dati;
- riduzione di errori e duplicazioni;
- migliore governo del personale interno ed esterno;
- strumenti più rapidi per consultazione anagrafica e territoriale;
- base tecnica più semplice da mantenere ed evolvere.

---

## Moduli previsti

- Risorse Umane;
- Amministrazione;
- Strumenti;
- moduli operativi AIB, magazzino, parco macchine e sale operative in progressiva stabilizzazione.

---

## Funzionalità principali

- login e gestione sessione;
- fascicolo dipendente con sezioni anagrafiche, operative e documentali;
- anagrafica esterna con tipo di collaborazione dedicato;
- strumenti geografici e fiscali di supporto;
- gestione configurabile dei tipi di contratto.

---

## Ruoli e livelli di accesso

La piattaforma adotta un modello a ruoli con approvazione e assegnazione controllata. Le attività più sensibili vengono validate in Collaudo e Test prima della promozione stabile.

---

## Sicurezza, tracciabilità e continuità operativa

Sono stati separati gli ambienti Collaudo, Test e Produzione. Il backend di Test è pubblico ma dedicato; il runtime locale è stato reso deterministico per ridurre interferenze tecniche e migliorare la verificabilità del collaudo.

---

## Gestione dati e archiviazione

L'anagrafica interna è stata importata e verificata su base reale; il personale esterno è stato importato da sorgente legacy dedicata con regole idempotenti e scarti controllati per record privi di codice fiscale.

---

## Reportistica e strumenti di controllo

I registri tecnici del progetto (`project_state`, `objectives`, `activity_log`, `decisions`, `error_memory`) mantengono uno stato continuo e sintetico dell'avanzamento, utile sia per il controllo operativo sia per la rendicontazione direzionale.

---

## Integrazioni future

- upload allegati e gestione documentale completa;
- affinamento dei ruoli e delle autorizzazioni;
- estensione dei moduli operativi verticali;
- preparazione del passaggio all'ambiente Produzione.

---

## Fasi di sviluppo

1. fondazione tecnica frontend/backend e schema dati;
2. attivazione Collaudo locale;
3. pubblicazione controllata in Test;
4. consolidamento dei moduli HR e Strumenti;
5. pulizia finale e promozione progressiva verso Produzione.

---

## Stato di avanzamento

La piattaforma ha superato la sola fase prototipale. Sono oggi funzionanti il backend FastAPI, il frontend Next.js statico per Test, il runtime locale di Collaudo/Test, il modulo Risorse Umane con distinzione interna/esterna e il modulo Strumenti con geografia e codice fiscale. L'ambiente Test è stato riallineato con l'ultimo consolidamento tecnico e dati dinamici coerenti con il Collaudo.

---

## Criticità note

- il modulo documentale è ancora centrato su metadati e scadenze, senza upload file completo;
- alcune autorizzazioni di dettaglio e il flusso pending utenti devono essere rifiniti;
- il passaggio in Produzione resta subordinato al completamento delle verifiche funzionali e organizzative.

---

## Decisioni già assunte

- adozione di stack Next.js + FastAPI + MySQL;
- separazione in Collaudo, Test e Produzione;
- uso di registri locali e script deterministici;
- separazione tra dipendenti interni e collaboratori esterni nel fascicolo personale;
- centralizzazione delle procedure riusabili in cartelle comuni.

---

## Prossimi passi

- mantenere allineati Collaudo e Test con promozioni pulite e verificabili;
- completare upload documentale e autorizzazioni fini;
- mantenere Collaudo ordinato e completo per sviluppo e debug;
- preparare il passaggio sicuro verso Produzione.

---

## Allegati tecnici eventuali

Da aggiornare in base alle prossime promozioni ambiente e ai moduli completati.
