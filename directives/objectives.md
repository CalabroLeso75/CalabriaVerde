# Registro dinamico degli obiettivi

## Obiettivi attivi

### OBJ-001 - Impostazione architettura multi-agente

**Stato:** attivo  
**Priorità:** alta  
**Descrizione:** mantenere una struttura ordinata basata su direttive, orchestrazione e script deterministici.  
**File coinvolti:** `MASTER_PROMPT.md`, `directives/`, `execution/`  
**Dipendenze:** nessuna  
**Ultimo aggiornamento:** da aggiornare al primo utilizzo operativo  
**Note operative:** ogni agente deve consultare questo registro prima di iniziare attività complesse.

---

## Obiettivi completati

Nessun obiettivo completato registrato.

---

## Obiettivi sospesi o bloccati

Nessun obiettivo sospeso o bloccato registrato.


## 2026-05-10 18:09:39 - Aggiornamento objective

**OBJ-002 - Completamento Fase 0 gestionale** **Stato:** attivo. **Priorita:** alta. **Descrizione:** completare collegamento frontend/backend reale per autenticazione, HR, pending utenti e schema iniziale coerente. **Avanzamento:** lista HR e fascicolo dipendente collegati alle API; schema Pydantic/migration allineati; restano test su database MySQL reale, esecuzione Alembic online e flussi login/pending end-to-end.


## 2026-05-10 19:22:58 - Aggiornamento objective

**OBJ-003 - Deploy e integrazione ambienti Test/Produzione** **Stato:** attivo. **Priorita:** alta. **Descrizione:** mantenere tre ambienti separati: Collaudo locale, Test su smart-cv.it/test e Produzione su smart-cv.it/produzione, collegandoli progressivamente a un backend FastAPI raggiungibile. **Avanzamento:** cartella hosting /Gestionale/public/Prod rinominata in /Gestionale/public/test, build statica aggiornata e cartella /Gestionale/public/produzione predisposta. **Prossimi passi:** predisporre backend su VPS o endpoint pubblico, configurare NEXT_PUBLIC_API_URL per ambiente, verificare login/API/HR end-to-end e promuovere in Produzione solo dopo esito positivo in Test.


## 2026-05-11 08:58:01 - Aggiornamento objective

**OBJ-004 - Stabilizzazione collaudo prima della produzione** **Stato:** attivo. **Priorita:** alta. **Descrizione:** chiudere i blocchi individuati dall'analisi backend/frontend del collaudo prima di promuovere in Produzione. **Avanzamento:** corretta la navigazione al dettaglio HR con route statica /hr/dettaglio?id=... e pubblicata in Test. **Prossimi passi:** RBAC HR, pending utenti reale, route mancanti, allineamento campi registrazione/backend, backend pubblico e test end-to-end.


## 2026-05-11 14:02:04 - Aggiornamento objective

**OBJ-005 - Collaudo anagrafica importata** **Stato:** attivo. **Priorita:** alta. **Descrizione:** usare i 4465 record anagrafici importati per testare HR, ricerca, dettaglio fascicolo, login e autorizzazioni. **Avanzamento:** import ripetibile e verificato; API HR rispondono su statistiche, lista e dettaglio con token locale; frontend collaudo avviato. **Prossimi passi:** reimpostare o confermare password admin, fare test browser login->HR, collegare pending utenti reale e introdurre RBAC HR.


## 2026-05-11 15:02:42 - Aggiornamento objective

**OBJ-005 - Collaudo anagrafica importata** **Stato:** attivo. **Priorita:** alta. **Avanzamento:** tutti i 4465 dipendenti sono ora a tempo indeterminato in collaudo; il fascicolo personale ha una prima funzione di modifica collegata all'API PUT. **Prossimi passi:** test browser end-to-end su login, apertura dipendente, modifica campi, salvataggio e ricaricamento; poi estendere documenti, qualifiche e RBAC HR.


## 2026-05-14 18:20:00 - Aggiornamento objective

**OBJ-006 - Consolidamento piattaforma e promozione controllata** **Stato:** attivo. **Priorita:** alta. **Descrizione:** consolidare codice, moduli comuni, design system, runtime locale e registri di progetto; poi promuovere in Test una build pulita e mantenere Collaudo essenziale ma completo. **Avanzamento:** runtime locale stabilizzato, moduli comuni estratti, fascicolo HR evoluto per interni ed esterni, documento direzionale riallineato. **Prossimi passi:** build pulita per Test, pulizia remota degli elementi inutili, aggiornamento GitHub e prosecuzione verso upload documentale/RBAC.


## 2026-05-14 19:30:00 - Aggiornamento objective

**OBJ-006 - Consolidamento piattaforma e promozione controllata** **Stato:** attivo. **Priorita:** alta. **Avanzamento:** Test è stato riallineato con build frontend pulita, bundle dati aggiornato da Collaudo, backend VPS riportato a migration `006_backfill_external_collaboration_type`, anagrafica esterna verificata con `tipo_collaborazione`, e Collaudo è stato ripulito dagli artefatti locali non più utili. **Prossimi passi:** chiudere upload documentale reale, completare RBAC/pending utenti e preparare checklist di promozione Produzione.
