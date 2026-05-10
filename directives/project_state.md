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

## Funzionalità in corso

- Da definire in base al progetto specifico.

## Problemi noti

- Nessun problema noto al momento.

## Prossimi passi

- Personalizzare il progetto reale.
- Aggiungere direttive specifiche.
- Aggiungere script deterministici in `execution/`.

## File critici

- `MASTER_PROMPT.md`
- `directives/project_state.md`
- `directives/objectives.md`
- `directives/decisions.md`
- `directives/error_memory.md`
- `directives/activity_log.md`

## Agenti specializzati

- `Project Documentation Agent` — agente redazionale da configurare con il modello leggero `Gemini 3 Flash`. Si occupa esclusivamente della stesura e dell'aggiornamento continuo del progetto da presentare alla Direzione Generale, usando `directives/project_proposal.md` e `directives/project_proposal_history.md`.

