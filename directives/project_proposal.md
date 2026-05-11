# Progetto per la Direzione Generale

## Titolo provvisorio

Sviluppo di un gestionale integrato per il supporto alle attività operative, amministrative e di coordinamento.

---

## Premessa

Il presente documento raccoglie progressivamente finalità, obiettivi, requisiti, moduli, benefici e stato di avanzamento del gestionale in fase di progettazione e sviluppo.

Il documento deve essere aggiornato dopo ogni azione significativa svolta sul progetto, in modo da poter essere utilizzato come base per una relazione da presentare alla Direzione Generale.

---

## Esigenza organizzativa

Da compilare e aggiornare in base alle attività progettuali registrate.

---

## Obiettivi generali

Da compilare e aggiornare.

---

## Obiettivi specifici

Da compilare e aggiornare.

---

## Destinatari e utilizzatori

Da compilare e aggiornare.

---

## Benefici attesi

Da compilare e aggiornare.

---

## Moduli previsti

Da compilare e aggiornare.

---

## Funzionalità principali

Da compilare e aggiornare.

---

## Ruoli e livelli di accesso

Da compilare e aggiornare.

---

## Sicurezza, tracciabilità e continuità operativa

Da compilare e aggiornare.

---

## Gestione dati e archiviazione

Da compilare e aggiornare.

---

## Reportistica e strumenti di controllo

Da compilare e aggiornare.

---

## Integrazioni future

Da compilare e aggiornare.

---

## Fasi di sviluppo

Da compilare e aggiornare.

---

## Stato di avanzamento

La Fase 0 tecnica è in corso. Sono state predisposte le fondamenta del gestionale con frontend Next.js, backend FastAPI, autenticazione JWT, schema dati SQLAlchemy/Alembic e prime interfacce operative.

Il modulo Risorse Umane dispone ora di lista dipendenti e fascicolo personale collegati alle API backend reali, con paginazione, filtri, KPI, dettaglio anagrafico, contrattuale e operativo.

È stata pubblicata una prima versione statica consultabile in ambiente Test su `smart-cv.it/test`, utile per verifiche visuali e condivisione interna preliminare. È stata inoltre predisposta una cartella separata per l'ambiente Produzione su `smart-cv.it/produzione`, da aggiornare solo dopo esito positivo delle verifiche in collaudo e test. Il backend applicativo resta da esporre tramite VPS dopo validazione locale.

---

## Criticità note

- La verifica completa richiede un database MySQL locale inizializzato con Alembic.
- La build frontend scarica font istituzionali tramite Google Fonts, quindi necessita di rete durante la compilazione.
- Lo script di creazione superadmin richiede password fornita tramite variabile d'ambiente, per evitare credenziali hardcoded.
- Il backend non deve essere esposto pubblicamente prima di completare controlli autorizzativi, CORS, segreti e test end-to-end.
- La promozione in Produzione deve restare bloccata finché non sono chiusi RBAC HR, pending utenti reale, route mancanti e collegamento API pubblico.

---

## Decisioni già assunte

Da compilare e aggiornare.

---

## Prossimi passi

- Inizializzare il database MySQL locale con la migration aggiornata.
- Creare il superadmin e testare il flusso login.
- Collegare gestione pending utenti e approvazione ruoli alle API reali.
- Proseguire con test end-to-end del modulo Risorse Umane.
- Predisporre deploy FastAPI su VPS con reverse proxy HTTPS e variabili ambiente protette.
- Mantenere aggiornati i rami/repository `collaudo` e `produzione` a ogni modifica approvata.

---

## Allegati tecnici eventuali

Da compilare e aggiornare.
