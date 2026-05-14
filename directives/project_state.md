# Stato sintetico del progetto

## Obiettivo generale

Consolidare il gestionale Calabria Verde come piattaforma modulare, veloce e verificabile, mantenendo separati Collaudo locale, Test pubblico e Produzione.

## Stack tecnico previsto

- Frontend: Next.js, React, Tailwind CSS
- Backend: FastAPI
- Automazioni e tool: Python in `backend/execution/`
- Direttive operative: Markdown in `directives/`

## Struttura principale

```text
project-root/
|-- backend/
|-- frontend/
|-- directives/
|-- scripts/
|-- .tmp/
|-- MASTER_PROMPT.md
`-- .gitignore
```

## Moduli presenti

- Risorse Umane: anagrafica interna, anagrafica esterna, fascicolo personale
- Parco Macchine: dashboard modulo, anagrafica mezzi, dettaglio mezzo, mappa predisposta al tracking
- Amministrazione: contratti, pending, utenti, geografia
- Strumenti: geografia, codice fiscale
- Registro comunicazioni ufficiali riusabile per moduli operativi
- Runtime locale guidato per Collaudo/Test
- Registri di progetto e script deterministici di import/export/promozione

## Funzionalita completate

- Frontend e backend di base avviati e collegati
- Backend pubblico di Test attivo su `https://smart-cv.it/api`
- Ambiente Test pubblico attivo su `https://smart-cv.it/test/`
- Import anagrafica interna completato con 4465 dipendenti
- Import anagrafica esterna completato con 120 record validi
- Fascicolo personale con modifica anagrafica, collaborazione esterni, patenti, abilitazioni, documenti/scadenze e nuove qualifiche
- Separazione HR tra anagrafica interna ed esterna
- Modulo Strumenti attivo con Geografia e Codice Fiscale
- Modulo Parco Macchine attivo con 20 mezzi legacy, 7 revisioni storiche e 2 collegamenti AIB
- Parco Macchine esteso con gruppi mezzi, rinnovi massivi assicurazione e revisione, assegnazioni multiple, usage log operatore e alert o sinistri con tracciamento comunicazioni
- Runtime locale consolidato su `http://127.0.0.1:3000/gestionale/collaudo/` e `/gestionale/test/`
- Estrazione di componenti e helper riusabili in cartelle comuni
- Promozione completa su Test del fascicolo HR aggiornato, della collaborazione esterni e del modulo fleet operativo
- Bundle dati di Test riallineato da Collaudo con backend VPS e migration portate a `008_fleet_ops_comms`
- Pulizia dell'ambiente Test hosting con ripubblicazione completa della build statica
- Pulizia locale di cache e artefatti non utili al collaudo (`.pytest_cache`, `frontend/out`, `__pycache__` script)

## Funzionalita in corso

- Upload reale degli allegati nel fascicolo personale
- Upload reale dei documenti di assegnazione, restituzione e sinistro nel fascicolo mezzo
- Rifinitura dei controlli autorizzativi e del flusso pending utenti
- Integrazione canali SMS, WhatsApp, push e tracking live sul modulo Parco Macchine
- Preparazione del passaggio verso Produzione
- Rifinitura finale UI/UX sui moduli ancora piu deboli prima della promozione stabile

## Problemi noti

- Il logout resta client-side; non esiste ancora un endpoint server dedicato
- La sezione documenti del fascicolo gestisce metadati e scadenze, ma non ancora upload fisico file
- I canali SMS, WhatsApp e push delle comunicazioni ufficiali sono modellati ma non ancora integrati a gateway esterni
- Il runtime backend locale via script `Start-All.ps1` resta meno stabile sotto orchestrazione automatica rispetto alle verifiche via `TestClient`
- Restano da completare RBAC fine, pending utenti completo e verifica produzione
- I layer geografici opzionali (confini/toponimi) restano vuoti finche non vengono mappate le tabelle sorgente reali
- In questa sessione il DB locale referenziato dal `.env` non era raggiungibile dal sandbox per un riallineamento Alembic diretto; la copertura funzionale e la promozione sono state verificate con `TestClient` e con deploy VPS fino a `008_fleet_ops_comms`

## Prossimi passi

- Portare l'upload file reale nella sezione documenti del fascicolo
- Completare i documenti di assegnazione, restituzione e sinistro nel fascicolo mezzo
- Integrare tracking live e canali SMS, WhatsApp e push nel registro comunicazioni
- Completare RBAC fine e pending utenti reale
- Tenere Collaudo essenziale ma completo per sviluppo, debug e verifiche dati
- Aggiornare la documentazione direzionale e i registri a ogni promozione
- Preparare la checklist di passaggio verso Produzione

## File critici

- `MASTER_PROMPT.md`
- `frontend/src/components/hr/EmployeeDetailClientPage.tsx`
- `frontend/src/components/hr/HrRegistryPage.tsx`
- `frontend/src/components/fleet/FleetDashboardClientPage.tsx`
- `frontend/src/components/fleet/FleetRegistryClientPage.tsx`
- `frontend/src/components/fleet/FleetDetailClientPage.tsx`
- `frontend/src/components/tools/GeographyWorkbench.tsx`
- `backend/app/models/communications.py`
- `backend/app/services/communication_log.py`
- `backend/migrations/versions/005_external_collaboration_profiles.py`
- `backend/migrations/versions/006_backfill_external_collaboration_type.py`
- `backend/migrations/versions/007_fleet_module.py`
- `backend/migrations/versions/008_fleet_ops_comms.py`
- `scripts/local/Common.ps1`
- `directives/project_state.md`
- `directives/objectives.md`
- `directives/decisions.md`
- `directives/error_memory.md`
- `directives/activity_log.md`

## Agenti specializzati

- `Project Documentation Agent` - agente redazionale dedicato all'aggiornamento continuo del progetto direzionale.
