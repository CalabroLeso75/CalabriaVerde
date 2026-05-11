# Stato sintetico del progetto

## Obiettivo generale

Definire e mantenere un sistema di lavoro per IDE IA multi-agente basato su direttive, orchestrazione e script deterministici.

## Stack tecnico previsto

- Frontend: Next.js, React, Tailwind CSS
- Backend: FastAPI oppure Next.js API routes
- Automazioni e tool: Python in `execution/`
- Direttive operative: Markdown in `directives/`

## Struttura principale

```text
project-root/
├── directives/
├── execution/
├── .tmp/
├── MASTER_PROMPT.md
├── README.md
└── .gitignore
```

## Moduli presenti

- Direttive operative
- Registro attività
- Registro obiettivi
- Memoria errori
- Registro decisioni
- Script utility iniziale

## Funzionalità completate

- Struttura base del progetto
- Prompt principale
- File di registro iniziali
- Convenzioni operative
- Fase 0 frontend/backend avviata con Next.js, FastAPI, SQLAlchemy e Alembic
- Lista HR e fascicolo dipendente collegati alle API backend reali
- Schema iniziale Alembic riallineato ai modelli runtime
- Frontend statico pubblicato in ambiente Test su `https://smart-cv.it/test/`
- Cartella Produzione predisposta su hosting in `/Gestionale/public/produzione/`
- Controllo autorizzativo minimo aggiunto alle route utenti/pending

## Funzionalità in corso

- Completamento Fase 0 del gestionale Calabria Verde.
- Verifica end-to-end su database MySQL reale per autenticazione, pending utenti e modulo HR.
- Preparazione backend FastAPI per deploy provvisorio su VPS dopo validazione locale.
- Adozione dei tre ambienti: Collaudo locale, Test su hosting, Produzione separata.

## Problemi noti

- `next build` richiede accesso rete per scaricare i font Google usati da `next/font`.
- `create_admin.py` richiede la variabile `CV_ADMIN_PASSWORD`.
- Il frontend online è statico: le funzioni API richiedono backend pubblico o reverse proxy.
- Presenza locale di file sensibili/artefatti ignorati da Git: non vanno committati o caricati in bundle.
- Il collaudo non è ancora promuovibile a Produzione: restano RBAC HR, route mancanti, pending utenti reale, API pubbliche e test end-to-end.

## Prossimi passi

- Creare superadmin con `CV_ADMIN_PASSWORD`.
- Testare login, approvazione pending e navigazione HR con dati reali.
- Collegare anche le pagine admin/pending alle API reali.
- Implementare autorizzazioni HR e route frontend mancanti prima di promozioni stabili.
- Preparare runbook VPS con systemd, Nginx, CORS e variabili ambiente reali.

## File critici

- `MASTER_PROMPT.md`
- `directives/project_state.md`
- `directives/objectives.md`
- `directives/decisions.md`
- `directives/error_memory.md`
- `directives/activity_log.md`

## Agenti specializzati

- `Project Documentation Agent` — agente redazionale da configurare con il modello leggero `Gemini 3 Flash`. Si occupa esclusivamente della stesura e dell'aggiornamento continuo del progetto da presentare alla Direzione Generale, usando `directives/project_proposal.md` e `directives/project_proposal_history.md`.
