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


## 2026-05-10 21:28:33 - Aggiornamento decision

**DEC-007 - Sequenza deploy provvisorio** **Data:** 2026-05-10. **Decisione:** validare prima backend e MySQL locale end-to-end, poi deploy FastAPI su VPS; evitare esposizione pubblica del backend finche' non sono chiusi auth, CORS, segreti e admin bootstrap. **Motivo:** il frontend statico e' gia' online, ma il backend deve essere verificato con dati reali e controlli autorizzativi prima della pubblicazione. **Impatto:** prossimo lavoro su login locale, superadmin, pending utenti, HR API e runbook VPS. **File coinvolti:** backend/, frontend/, directives/. **Stato:** attiva.


## 2026-05-11 08:48:51 - Aggiornamento decision

**DEC-008 - Tre ambienti operativi** **Data:** 2026-05-11. **Decisione:** adottare tre ambienti: Collaudo locale, Test su hosting in /Gestionale/public/test, Produzione su hosting in /Gestionale/public/produzione. **Motivo:** separare sviluppo, verifica pubblica e rilascio finale. **Impatto:** ogni modifica nasce in collaudo, passa a test dopo verifica locale e arriva in produzione solo dopo approvazione; i file temporanei ambiente restano in .tmp/project_completion/. **File coinvolti:** directives/deployment_environments.md, directives/project_state.md, frontend configurazione basePath. **Stato:** attiva.


## 2026-05-11 08:58:01 - Aggiornamento decision

**DEC-009 - Rami repository per ambienti** **Data:** 2026-05-11. **Decisione:** usare i rami Git locali collaudo e produzione come repository logici iniziali degli ambienti; il ramo main resta lo stato corrente storico finche' non sara' definito un remoto separato. **Motivo:** tracciare separatamente lavoro locale e rilasci approvati senza promuovere modifiche non verificate. **Impatto:** ogni modifica nasce in collaudo, viene pubblicata in test dopo build/verifica e confluisce in produzione solo dopo approvazione. **Stato:** attiva.


## 2026-05-11 15:26:49 - Aggiornamento decision

Per supportare i contratti del personale senza rompere l'import anagrafico, il gestionale estende per ora la tabella employees con campi contrattuali flat (CCNL, profilo, area/categoria, orario, scatti, integrativo, provenienza) invece di introdurre nuove tabelle dedicate. La migration 002 e' stata poi applicata nel database locale di collaudo dopo autorizzazione esplicita, mantenendo l'approccio di modifica controllata del DB.


## 2026-05-11 16:13:49 - Aggiornamento decision

La gestione dei contratti di sistema viene introdotta come modulo amministrativo separato (contract_type_definitions + contract_type_attachments) e non come semplice enum nel dipendente, cosi' si possono governare metadati, note e allegati ufficiali CCNL/integrativi senza irrigidire il fascicolo personale. Le migration 002 e 003 sono state applicate nel collaudo locale dopo autorizzazione esplicita, insieme al seed iniziale di Funzioni Locali e Idraulico-Forestale.
