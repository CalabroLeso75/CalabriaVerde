# Progetto per la Direzione Generale

## Titolo provvisorio

Sviluppo di un gestionale integrato per il supporto alle attivita operative, amministrative e di coordinamento di Calabria Verde.

---

## Premessa

Il presente documento raccoglie finalita, obiettivi, moduli, benefici e stato di avanzamento del gestionale in corso di realizzazione, con aggiornamento continuo in base alle attivita tecniche realmente verificate.

---

## Esigenza organizzativa

Calabria Verde necessita di una piattaforma unica per gestire in modo ordinato personale interno, personale esterno, parco mezzi, strumenti territoriali, contratti e funzioni operative, superando frammentazione, lentezza e difficolta di controllo del precedente gestionale.

---

## Obiettivi generali

- creare un gestionale modulare, veloce e manutenibile;
- separare sviluppo, collaudo pubblico e produzione;
- rendere verificabili dati, ruoli, fascicoli e flussi operativi;
- costruire una base estendibile per attivita HR, territoriali, AIB, flotta e amministrative.

---

## Obiettivi specifici

- gestire anagrafica interna ed esterna in viste separate ma coerenti;
- mantenere un fascicolo personale evoluto con qualifiche, documenti, patenti e abilitazioni;
- governare i contratti interni e le collaborazioni esterne con modelli distinti;
- fornire strumenti riusabili per geografia e codice fiscale;
- attivare un modulo Parco Macchine con dati tecnici, coperture, revisioni, assegnazioni, sinistri e futura localizzazione live;
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

- maggiore ordine e tracciabilita dei dati;
- riduzione di errori e duplicazioni;
- migliore governo del personale interno ed esterno;
- migliore controllo del parco mezzi e del relativo storico;
- strumenti piu rapidi per consultazione anagrafica e territoriale;
- base tecnica piu semplice da mantenere ed evolvere.

---

## Moduli previsti

- Risorse Umane;
- Amministrazione;
- Strumenti;
- Parco Macchine;
- moduli operativi AIB, magazzino e sale operative in progressiva stabilizzazione.

---

## Funzionalita principali

- login e gestione sessione;
- fascicolo dipendente con sezioni anagrafiche, operative e documentali;
- anagrafica esterna con tipo di collaborazione dedicato;
- strumenti geografici e fiscali di supporto;
- gestione configurabile dei tipi di contratto;
- fascicolo mezzo con dati tecnici, coperture, revisioni, assegnazioni, sinistri e futura localizzazione live.

---

## Ruoli e livelli di accesso

La piattaforma adotta un modello a ruoli con approvazione e assegnazione controllata. Le attivita piu sensibili vengono validate in Collaudo e Test prima della promozione stabile.

---

## Sicurezza, tracciabilita e continuita operativa

Sono stati separati gli ambienti Collaudo, Test e Produzione. Il backend di Test e pubblico ma dedicato; il runtime locale e stato reso deterministico per ridurre interferenze tecniche e migliorare la verificabilita del collaudo.

---

## Gestione dati e archiviazione

L'anagrafica interna e stata importata e verificata su base reale; il personale esterno e stato importato da sorgente legacy dedicata con regole idempotenti e scarti controllati per record privi di codice fiscale; il primo nucleo del Parco Macchine e stato importato dal gestionale legacy mantenendo continuita con il patrimonio storico dei mezzi.

---

## Reportistica e strumenti di controllo

I registri tecnici del progetto (`project_state`, `objectives`, `activity_log`, `decisions`, `error_memory`) mantengono uno stato continuo e sintetico dell'avanzamento, utile sia per il controllo operativo sia per la rendicontazione direzionale.

---

## Integrazioni future

- upload allegati e gestione documentale completa;
- affinamento dei ruoli e delle autorizzazioni;
- localizzazione live dei mezzi;
- estensione dei moduli operativi verticali;
- preparazione del passaggio all'ambiente Produzione.

---

## Fasi di sviluppo

1. fondazione tecnica frontend/backend e schema dati;
2. attivazione Collaudo locale;
3. pubblicazione controllata in Test;
4. consolidamento dei moduli HR e Strumenti;
5. attivazione del primo nucleo Parco Macchine in Collaudo;
6. pulizia finale e promozione progressiva verso Produzione.

---

## Stato di avanzamento

La piattaforma ha superato la sola fase prototipale. Sono oggi funzionanti il backend FastAPI, il frontend Next.js statico per Test, il runtime locale di Collaudo/Test, il modulo Risorse Umane con distinzione interna/esterna, il modulo Strumenti con geografia e codice fiscale e il primo nucleo operativo del Parco Macchine con dati legacy reali importati in Collaudo. L'ambiente Test e stato riallineato con l'ultimo consolidamento tecnico e dati dinamici coerenti con il Collaudo.

---

## Criticita note

- il modulo documentale e ancora centrato su metadati e scadenze, senza upload file completo;
- il modulo Parco Macchine e attivo in Collaudo ma non ancora promosso in Test;
- alcune autorizzazioni di dettaglio e il flusso pending utenti devono essere rifiniti;
- il passaggio in Produzione resta subordinato al completamento delle verifiche funzionali e organizzative.

---

## Decisioni gia assunte

- adozione di stack Next.js + FastAPI + MySQL;
- separazione in Collaudo, Test e Produzione;
- uso di registri locali e script deterministici;
- separazione tra dipendenti interni e collaboratori esterni nel fascicolo personale;
- compatibilita evolutiva con il patrimonio dati legacy del parco mezzi;
- centralizzazione delle procedure riusabili in cartelle comuni.

---

## Prossimi passi

- mantenere allineati Collaudo e Test con promozioni pulite e verificabili;
- completare e promuovere il modulo Parco Macchine;
- completare upload documentale e autorizzazioni fini;
- mantenere Collaudo ordinato e completo per sviluppo e debug;
- preparare il passaggio sicuro verso Produzione.

---

## Allegati tecnici eventuali

Da aggiornare in base alle prossime promozioni ambiente e ai moduli completati.
