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
