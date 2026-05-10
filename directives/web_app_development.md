# Direttiva: sviluppo applicazioni web

## Stack predefinito

Frontend:

- Next.js
- React
- Tailwind CSS

Backend:

- FastAPI, quando servono API strutturate, automazioni Python, elaborazioni dati o logica complessa.
- Next.js API routes, quando il backend è leggero e collegato direttamente al frontend.

## Prima di iniziare

L'agente deve controllare:

1. `MASTER_PROMPT.md`;
2. `directives/project_state.md`;
3. `directives/objectives.md`;
4. `directives/decisions.md`;
5. eventuale `brand-guidelines.md` nella root;
6. struttura file esistente;
7. dipendenze già installate.

## Regole di sviluppo

- Mobile-first.
- Componenti modulari.
- Nessuna logica critica solo nel frontend.
- API chiare e validate.
- Gestione degli errori lato frontend e backend.
- Nessuna credenziale nel codice.
- Nessuna nuova dipendenza se non giustificata.
- Patch minime su codice esistente.

## Output atteso

Ogni intervento deve indicare:

- file creati o modificati;
- funzionalità aggiunta o corretta;
- verifica eseguita;
- eventuali limiti;
- prossimo passo utile.
