# Template progetto per IDE IA multi-agente

Questo pacchetto contiene una struttura iniziale per lavorare con un IDE IA multi-agente in modo più ordinato, meno dispendioso e più affidabile.

## File principale

Il prompt da usare come prompt madre è:

`MASTER_PROMPT.md`

## Cartelle principali

```text
directives/   SOP, registri, memoria errori e decisioni
execution/    script Python deterministici
.tmp/         file temporanei rigenerabili
```

## Registri inclusi

- `directives/project_state.md`
- `directives/objectives.md`
- `directives/activity_log.md`
- `directives/error_memory.md`
- `directives/decisions.md`

## Direttive incluse

- `directives/code_quality.md`
- `directives/web_app_development.md`
- `directives/file_management.md`

## Script incluso

- `execution/update_registers.py`

Permette di aggiungere rapidamente note ai registri locali.

Esempi:

```bash
python execution/update_registers.py activity "Creata struttura iniziale del progetto."
python execution/update_registers.py error "Errore di import risolto aggiornando il path relativo."
python execution/update_registers.py decision "Scelto FastAPI per il backend per gestione API strutturate."
```

## Uso consigliato

1. Apri `MASTER_PROMPT.md`.
2. Copia il contenuto come prompt principale nel tuo IDE IA multi-agente.
3. Mantieni aggiornata la cartella `directives/`.
4. Inserisci gli script deterministici in `execution/`.
5. Usa `.tmp/` solo per file temporanei.

## Agente per progetto direzionale

È stata aggiunta la cartella `agents/` con le istruzioni per il `Project Documentation Agent`.

Questo agente deve essere assegnato al modello leggero `Gemini 3 Flash` e deve occuparsi solo della documentazione da presentare alla Direzione Generale.

File principali:

- `agents/project_documentation_agent.md`
- `directives/project_proposal.md`
- `directives/project_proposal_history.md`

