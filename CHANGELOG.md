# CHANGELOG — Gestionale Calabria Verde

Tutte le modifiche significative sono documentate in questo file.
Formato: [Semantic Versioning](https://semver.org/lang/it/) — `MAJOR.MINOR.PATCH`

- **MAJOR**: cambiamenti incompatibili con versioni precedenti (es. migrazione DB strutturale)
- **MINOR**: nuove funzionalità retrocompatibili (es. nuovo modulo)
- **PATCH**: bugfix e miglioramenti minori retrocompatibili

---

## [Unreleased]

### In sviluppo
- Esecuzione migration Alembic su DB locale (`alembic upgrade head`)
- Esecuzione script importazione anagrafica (`import_employees.py`)
- Pagina HR evoluta con tutti i campi del nuovo schema employee
- Fascicolo dipendente (pagina dettaglio)

---

## [0.4.0] — 2026-05-10

### Aggiunto
- **Repository Git**: inizializzato con `.gitignore`, `.gitattributes`, `.env.example`
- **Commit Agent** (`commit_agent.ps1`): versioning semantico automatico (feat→MINOR, fix→PATCH, BREAKING→MAJOR), aggiornamento CHANGELOG automatico, creazione tag Git
- **CHANGELOG.md**: storico versioni dalla v0.1.0, formato Keep a Changelog + Semver
- **Schema Employee unificato**: modello SQLAlchemy aggiornato con schema completo
  - Interno + Esterno in un'unica tabella (discriminator `tipo`)
  - Flag operativi AIB completi: `is_dos`, `is_aib_qualificato`, `is_emergency_coordinator`, `is_operations_room_manager/operator`, `is_mechanical_operator`, `is_aib_pc_operator`, `is_pc_operator`, `is_driver`
  - JSON per `patenti`, `abilitazioni`, `documenti_scadenza`
  - `stato_quiescenza` per gestione pensionamento (da legacy Laravel)
  - Relazioni: Organization, User, EmployeeQualification, EmployeeDocument, EmployeeOperationalRole
- **Migration Alembic 001**: crea tutte le tabelle core + seed 12 ruoli di sistema
- **Script import_employees.py**: importazione anagrafica dal DB legacy
  - Supporta DB produzione e locale
  - Mapping completo status/genere/quiescenza/tipo contratto
  - Normalizzazione CF e telefoni
  - Modalità dry-run per test senza scrittura
  - Report finale dettagliato con statistiche


## [0.3.0] — 2026-05-10

### Aggiunto
- **Modulo Registrazione**: form wizard 4 step (account, anagrafica, professionale, conferma)
  - Validazione codice fiscale, campi specifici Calabria Verde
  - Settori: AIB, cantieri, magazzino, HR, flotta, sale operative
  - Tipi contratto: indeterminato, determinato, stagionale, volontario
  - Schermata successo con spiegazione flusso pending
- **Modulo Admin — Gestione Pending**: 
  - Lista utenti in attesa con badge, avatar, info rapide
  - Modal Approva: assegnazione ruolo (11 ruoli) + organizzazione
  - Modal Rifiuta: motivazione obbligatoria, notifica email
  - Modal Dettaglio: scheda completa richiesta
  - KPI: in attesa / approvati / rifiutati oggi
- **Componenti UI**: `Select`, `Badge` (6 varianti), `Modal` (accessibile AGID)
- **Pagina Admin index**: 6 sezioni con card e badge contatori

### Modificato
- `Header`: esteso routeTitles con tutte le route (admin/*, login, register)
- `decisions.md`: DEC-005 (flusso auth 3 stadi), DEC-006 (AGID compliance)
- `activity_log.md`: 2 nuove voci sessione

---

## [0.2.0] — 2026-05-10

### Aggiunto
- **Frontend Next.js 16.2.6**: TypeScript, Tailwind v4, App Router, `src/` directory
- **Design System AGID**: palette Verde Calabria, variabili CSS custom (`--cv-*`), font via `next/font`
- **Layout Dashboard**: sidebar collassabile (7 moduli), header dinamico (`usePathname`)
- **Dashboard**: KPI cards (dipendenti, mezzi, AIB, eventi), attività recenti, accesso rapido
- **Pagina Login**: split layout branding verde + form JWT, responsive mobile
- **Modulo HR**: tabella dipendenti con KPI, ricerca, filtri stato, badge colorati, avatar iniziali
- **PWA**: `manifest.json` + service worker `sw.js` (Cache First, Network First, Push, BG Sync)
- **Componenti UI**: `Button`, `Input`, `Card`

### Backend FastAPI
- Struttura modulare: `core/`, `api/`, `models/`, `schemas/`
- Autenticazione JWT: register, login, refresh token, `/me`
- Modelli DB: `User`, `Role`, `UserRole`, `Organization`, `Employee`, `EmployeeQualification`
- API HR: CRUD dipendenti + qualifiche con paginazione server-side
- API Users: approvazione/rifiuto utenti pending
- Alembic: configurato (`alembic.ini` + `migrations/env.py`)
- `brand-guidelines.md`: documento design system AGID

---

## [0.1.0] — 2026-05-10

### Aggiunto
- Setup iniziale progetto Calabria Verde Gestionale (ex novo)
- Struttura directory: `frontend/`, `backend/`, `directives/`, `execution/`, `storage/`
- Analisi vecchio gestionale Laravel (170 migration, 100 modelli Eloquent)
- `brand-guidelines.md`: palette, tipografia, componenti AGID
- Documenti direttive: `activity_log.md`, `decisions.md`, `task.md`
- Configurazione base Python venv + requirements.txt

### Decisioni architetturali
- DEC-001: Architettura a 3 livelli (direttive, orchestrazione, script)
- DEC-002: Stack Next.js + FastAPI + MySQL
- DEC-003: PWA offline-first
- DEC-004: Riscrittura ex novo (non estensione Laravel)
