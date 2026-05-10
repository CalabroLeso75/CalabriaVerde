# Registro delle attività

Questo file registra le azioni significative svolte dagli agenti.

Non inserire password, token, chiavi API, credenziali o dati sensibili.

---

## Template nuova attività

```markdown
## [DATA_ORA] - Azione eseguita

**Agente:** nome o ruolo dell'agente  
**Obiettivo collegato:** riferimento all'obiettivo attivo  
**Azione svolta:** descrizione sintetica dell'attività  
**File coinvolti:** elenco dei file letti, creati o modificati  
**Esito:** completato / parziale / errore  
**Verifiche eseguite:** test, lint, controllo sintattico, simulazione o verifica manuale  
**Note utili:** eventuali vincoli, decisioni o informazioni da ricordare  
```

---

## Attività registrate

## 2026-05-10 11:15 - Raccolta requisiti iniziali

**Agente:** orchestrazione principale  
**Obiettivo collegato:** OBJ-001 - Impostazione architettura multi-agente  
**Azione svolta:** raccolta informazioni sull'organizzazione e sul perimetro del gestionale.  
**Informazioni raccolte:**  
- Calabria Verde è l'Ente strutturale della Regione Calabria per la gestione del patrimonio boschivo regionale.  
- Opera su tutto il territorio regionale: boschi demaniali, bacini idrici, fiumi, sorveglianza idraulica.  
- Il gestionale deve coprire a 360° tutte le attività aziendali.  
- Moduli previsti (iniziali): Risorse Umane, Amministrazione, Magazzino, Parco Macchine, Antincendio Boschivo, Sale Operative, altri da definire.  
- Ogni settore avrà utenti collegati all'anagrafica dipendenti con accesso limitato al proprio settore.  
- Sistema di privilegi per ruolo: Responsabile, Operatore, Delegato, ecc.  
- Il primo modulo da sviluppare è Risorse Umane.  
**Esito:** completato  
**Verifiche eseguite:** nessuna (fase di raccolta requisiti)  
**Note utili:** proseguire con domande dettagliate una per volta.

## 2026-05-10 11:35 - Raccolta requisiti dettagliati (domande 2-6)

**Agente:** orchestrazione principale  
**Obiettivo collegato:** OBJ-001  
**Azione svolta:** raccolta requisiti su dimensione ente, infrastruttura, database, autenticazione e modulo HR.  
**Informazioni raccolte:**  
- Dipendenti: tra 4.000 e 7.000.  
- Collaudo: questo PC. Produzione temporanea: VPS su smart-cv.it (con IA locali Mistral e Qwen). Produzione finale: server fisico dedicato in acquisto.  
- Dominio: gestionale.calabriaverde.eu (sottodominio di calabriaverde.eu).  
- DB esistente: MySQL, proveniente da precedente gestionale sperimentale in Laravel (PHP). Dati reali da migrare.  
- Principio: ridurre al minimo le dipendenze da terze parti.  
- Autenticazione: registrazione aperta → tabella pending → approvazione da responsabile/admin → assegnazione profilo. Chiave unica: codice fiscale.  
- Modulo HR — fascicolo personale: dati anagrafici, contatti, dati contrattuali, sede operativa, qualifiche operative, patenti/abilitazioni, formazione/corsi, documenti allegati, storico presenze/assenze, note disciplinari, storico attività operative (missioni AIB, cantieri, progetti con date).  
**Esito:** completato  
**Verifiche eseguite:** nessuna (fase raccolta requisiti)  
**Note utili:** proseguire con domande su struttura organizzativa e altri dettagli.

## 2026-05-10 13:52 - Analisi vecchio gestionale Laravel

**Agente:** orchestrazione principale  
**Obiettivo collegato:** OBJ-001  
**Azione svolta:** analisi della struttura del vecchio gestionale in C:\xampp\htdocs\GestionaleCV.  
**Risultati chiave:**  
- 170 migration Laravel — progetto molto più avanzato del previsto.  
- 100 modelli Eloquent — copertura ampia di domini.  
- Moduli già sviluppati: Users, InternalEmployee, ExternalEmployee, Organization, Vehicle/VehicleType/VehicleLog, AibStation/AibTeam/AibTeamMember, HelicopterBase/Helicopter/HelicopterMission/HelicopterPilot, EmergencyReport/EmergencyTeam, PcEmergencyEvent/PcEmergencyDeployment, WarehouseLocation/WarehouseProduct/WarehouseStock/WarehouseMovement, CompanyPhone/MobileDevice, FuelStation/FuelPriceObservation, RadioStation, DosPhoto, Webmail, NewsRss, SoupAircraft/SoupBase, CorporateMailbox, OperationalRole, AI Chat, DashboardSection, e molti altri.  
- Chiave SSH VPS trovata e copiata in storage/vps_keys/.  
- Email istituzionale: Aruba SMTP (smtps.aruba.it:465).  
- Integrazione PC2 già presente (credenziali in .env).  
- NASA FIRMS per hotspot incendi già integrato.  
- Wall monitor già previsto (WALL_REFRESH_SECONDS=210).  
**Esito:** completato  
**Verifiche eseguite:** analisi strutturale, non esecuzione codice  
**Note utili:** il nuovo gestionale deve ereditare e migliorare tutto questo lavoro. Necessaria analisi dettagliata delle migration per progettare lo schema del nuovo DB.
  
## 2026-05-10 14:00–15:30 - Scaffolding Fase 0: Frontend + Backend

**Agente:** orchestrazione principale  
**Obiettivo collegato:** Fase 0 — Fondamenta  
**Azione svolta:** installazione ambiente e scaffolding completo del progetto.  
**File coinvolti:**  
- `backend/`: struttura FastAPI (main.py, core/, app/api/, models/, schemas/)  
- `backend/requirements.txt`: dipendenze Python (FastAPI, SQLAlchemy, Alembic, JWT, pymysql)  
- `backend/app/core/config.py`: Pydantic Settings con .env  
- `backend/app/core/database.py`: SQLAlchemy engine, pool, get_db()  
- `backend/app/core/security.py`: bcrypt, JWT access/refresh, get_current_user  
- `backend/app/models/user.py`: User, Role, UserRole  
- `backend/app/models/organization.py`: Organization (gerarchia 4 livelli)  
- `backend/app/models/employee.py`: Employee, EmployeeQualification, EmployeeDocument  
- `backend/app/api/auth/router.py`: register, login, refresh, /me  
- `backend/app/api/users/router.py`: pending, approve, reject, list  
- `backend/app/api/hr/router.py`: CRUD dipendenti + qualifiche  
- `backend/app/schemas/auth.py`, `backend/app/schemas/employee.py`: Pydantic v2  
- `backend/alembic.ini` + `backend/migrations/env.py`: Alembic config  
- `frontend/`: Next.js 16.2.6, TypeScript, Tailwind v4, App Router, src/  
- `frontend/src/app/globals.css`: design system AGID (palette verde, variabili CSS, animazioni)  
- `frontend/src/app/layout.tsx`: root layout con next/font (Titillium Web, Lora, Roboto Mono), PWA  
- `frontend/src/components/layout/Sidebar.tsx`: sidebar collassabile, 7 moduli  
- `frontend/src/components/layout/Header.tsx`: header dinamico usePathname  
- `frontend/src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`: componenti AGID  
- `frontend/src/app/(dashboard)/dashboard/page.tsx`: dashboard con KPI, attività, accesso rapido  
- `frontend/src/app/(auth)/login/page.tsx`: login split branding + form JWT  
- `frontend/src/app/(dashboard)/hr/page.tsx`: tabella dipendenti, KPI, ricerca, filtri  
- `frontend/public/manifest.json`: PWA manifest  
- `frontend/public/sw.js`: service worker (Cache/Network First, Push, BG Sync)  
- `brand-guidelines.md`: design system AGID-compliant  
**Esito:** completato  
**Verifiche eseguite:** server Next.js avviato su localhost:3000, tutte le pagine HTTP 200, screenshot verificati  
**Note utili:** il server Next.js è attivo. Prossimi step: pagina registrazione, gestione pending Admin, Alembic init migration.

## 2026-05-10 15:37–16:00 - Modulo Registrazione e Gestione Pending

**Agente:** orchestrazione principale  
**Obiettivo collegato:** Fase 0 — Completamento flusso autenticazione (DEC-005)  
**Azione svolta:** implementazione completa del flusso registrazione utente e gestione richieste pending.  
**File coinvolti:**  
- `frontend/src/app/(auth)/register/page.tsx`: form 4-step (account→anagrafica→professionale→conferma), validazione per step, riepilogo finale, schermata successo, campi specifici Calabria Verde (settori AIB/cantieri/magazzino, tipi contratto stagionale/volontario)  
- `frontend/src/app/(dashboard)/admin/page.tsx`: pagina Admin con 6 sezioni (Pending, Utenti, Ruoli, Organizzazioni, Log, Configurazione)  
- `frontend/src/app/(dashboard)/admin/pending/page.tsx`: lista pending con KPI approvati/rifiutati oggi, ricerca, Modal Approva (ruolo + org obbligatori), Modal Rifiuta (motivazione obbligatoria), Modal Dettaglio  
- `frontend/src/components/ui/Select.tsx`: componente Select AGID con chevron SVG  
- `frontend/src/components/ui/Badge.tsx`: 6 varianti cromatiche, dot opzionale  
- `frontend/src/components/ui/Modal.tsx`: accessibile (role dialog, Escape, backdrop), bordo verde superiore  
- `frontend/src/components/layout/Header.tsx`: esteso routeTitles con tutte le route admin, register, login  
- `directives/decisions.md`: aggiunte DEC-005 (flusso auth 3 stadi) e DEC-006 (AGID compliance)  
**Esito:** completato  
**Verifiche eseguite:** screenshot verificati per tutte le pagine, server HTTP 200 su tutte le route  
**Note utili:** le pagine usano dati demo hardcoded — il collegamento alle API backend reali è il prossimo step prioritario. Ruoli previsti documentati in DEC-005.

