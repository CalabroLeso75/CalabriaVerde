# Registro delle decisioni tecniche

Questo file conserva le decisioni progettuali rilevanti.

Prima di proporre cambi architetturali, consultare questo registro.

---

## Template nuova decisione

```markdown
## DEC-001 - Titolo decisione

**Data:** data e ora  
**Decisione:** scelta effettuata  
**Motivo:** perché è stata presa  
**Impatto:** cosa cambia nel progetto  
**File coinvolti:** eventuali file interessati  
**Stato:** attiva / superata / da verificare  
```

---

## Decisioni registrate

### DEC-001 - Architettura a 3 livelli

**Data:** iniziale  
**Decisione:** usare una struttura basata su direttive, orchestrazione e script deterministici.  
**Motivo:** ridurre errori, consumo di token e incoerenze tra agenti.  
**Impatto:** ogni agente deve consultare direttive e registri prima di agire.  
**File coinvolti:** `MASTER_PROMPT.md`, `directives/`, `execution/`  
**Stato:** attiva

---

### DEC-002 - Stack tecnologico del gestionale

**Data:** 2026-05-10 12:05  
**Decisione:** utilizzare Next.js + React + Tailwind CSS (frontend), FastAPI Python (backend), MySQL (database).  
**Motivo:** stack moderno, reattivo, adatto a integrazioni IA locale, coerente con le direttive di progetto. MySQL per compatibilità con i dati esistenti dal precedente gestionale Laravel.  
**Impatto:** tutto il codice applicativo seguirà questa architettura. Il vecchio gestionale Laravel non sarà esteso ma i dati MySQL saranno migrati.  
**File coinvolti:** `directives/web_app_development.md`, `directives/project_state.md`  
**Stato:** attiva

---

### DEC-003 - Supporto offline e architettura PWA

**Data:** 2026-05-10 12:43  
**Decisione:** il gestionale deve supportare modalità offline con sincronizzazione automatica al ritorno della connettività. Approccio PWA (Progressive Web App).  
**Motivo:** i dipendenti operano in boschi e zone montane con copertura internet instabile o assente. Devono poter compilare report, scattare foto georeferenziate, scannerizzare articoli e lavorare offline.  
**Impatto:** necessità di service worker, storage locale (IndexedDB), logica di sync, gestione conflitti. L'app nativa futura potrà beneficiare della stessa architettura.  
**File coinvolti:** `directives/web_app_development.md`  
**Stato:** attiva

---

### DEC-004 - Riscrittura ex novo del gestionale

**Data:** 2026-05-10 13:56  
**Decisione:** riscrittura completa del gestionale da zero. Non si estende il vecchio progetto Laravel.  
**Motivo:** il vecchio gestionale è caotico, disordinato, con gestione utenze mal fatta, relazioni dati non strutturate, lento nelle prestazioni, codice difficile da mantenere.  
**Impatto:** si riprogetta tutto da zero con architettura pulita e modulare. I dati esistenti verranno migrati dopo analisi. Le funzionalità del vecchio gestionale fanno da riferimento funzionale ma non architetturale.  
**Requisiti chiave:** ordine, modularità, velocità istantanea, gestibilità da chiunque, relazioni dati ben strutturate.  
**File coinvolti:** tutto il progetto  
**Stato:** attiva

---

### DEC-005 - Flusso autenticazione a 3 stadi

**Data:** 2026-05-10 14:30  
**Decisione:** flusso registrazione → pending → approvazione con assegnazione ruolo esplicita.  
**Motivo:** sistema multi-ente con 4.000-7.000 dipendenti richiede controllo accessi rigoroso. Il codice fiscale è chiave unica universale che collega User ↔ Employee.  
**Dettaglio flusso:**  
1. Il dipendente si registra con email istituzionale + CF + dati base → stato `pending`  
2. Il responsabile/admin vede lista pending e approva assegnando ruolo + organizzazione  
3. L'utente riceve email di conferma e può accedere  
4. Il rifiuto blocca l'account con motivazione visibile  
**Ruoli previsti:** superadmin, admin, responsabile_distretto, dos, capo_squadra, operatore_aib, operatore_magazzino, direttore_lavori, operatore_cantiere, addetto_hr, addetto_flotta  
**Impatto:** tutti i moduli devono rispettare lo scope ruolo/organizzazione. Alcune viste filtrate per organizzazione di appartenenza.  
**File coinvolti:** `backend/app/models/user.py`, `backend/app/api/auth/`, `backend/app/api/users/`  
**Stato:** attiva

---

### DEC-006 - AGID Compliance e Design System Verde

**Data:** 2026-05-10 14:45  
**Decisione:** adottare le linee guida AGID (.italia design system) con personalizzazione cromatica verde Calabria.  
**Motivo:** ente pubblico regionale, obblighi di accessibilità PA (WCAG 2.1 AA), coerenza istituzionale.  
**Dettaglio:**  
- Font: Titillium Web (UI), Lora (testi), Roboto Mono (codici/dati tecnici)  
- Colore primario: `#339966` (Verde Calabria) con varianti chiaro/scuro, contrasto ≥ 4.5:1  
- Colore accent: `#F2C12E` (oro) per badge e highlight  
- Accessibilità: skiplinks, focus visibile, ARIA labels, tabindex corretto  
- Non usare Tailwind classi hardcoded: preferire variabili CSS custom (`--cv-*`)  
**File coinvolti:** `brand-guidelines.md`, `frontend/src/app/globals.css`, tutti i componenti UI  
**Stato:** attiva
