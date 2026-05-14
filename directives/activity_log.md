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



## 2026-05-10 18:09:39 - Aggiornamento activity

**Agente:** Codex orchestrazione tecnica. **Obiettivo collegato:** OBJ-001 / Fase 0 gestionale. **Azione svolta:** ripresa lavoro bloccato, allineamento backend HR/auth/migration/frontend al modello dati corrente, correzione import SQLAlchemy, normalizzazione DEBUG=release, verifica build frontend e Alembic offline. **File coinvolti:** backend/app/core/config.py, backend/app/models/user.py, backend/app/models/organization.py, backend/app/models/employee.py, backend/app/schemas/employee.py, backend/main.py, backend/migrations/env.py, backend/migrations/versions/001_initial_schema.py, backend/create_admin.py, frontend/src/app/(dashboard)/hr/page.tsx, frontend/src/app/(dashboard)/hr/[id]/page.tsx, frontend/src/app/(dashboard)/admin/page.tsx, frontend/src/app/(dashboard)/admin/pending/page.tsx, frontend/src/components/ui/Modal.tsx. **Esito:** completato. **Verifiche eseguite:** py_compile backend, import FastAPI + configure_mappers, validazione Pydantic EmployeeResponse, alembic upgrade head --sql, npm run lint, npm run build. **Note utili:** next build richiede rete per font Google; create_admin richiede CV_ADMIN_PASSWORD e non contiene password hardcoded.


## 2026-05-10 19:06:18 - Aggiornamento activity

**Agente:** Codex orchestrazione tecnica. **Obiettivo collegato:** OBJ-002 - Completamento Fase 0 gestionale. **Azione svolta:** preparata build statica del frontend con basePath /Prod, pubblicata via SFTP su hosting smart-cv in /Gestionale/Prod e aperta la URL pubblica nel browser locale. **File coinvolti:** frontend/next.config.ts, frontend/src/app/layout.tsx, frontend/src/components/hr/EmployeeDetailClientPage.tsx, frontend/out, .tmp/psftp-check-prod.txt. **Esito:** completato con limite. **Verifiche eseguite:** next build statico completato; upload SFTP completato; apertura browser avviata. **Note utili:** backend FastAPI non e' deployato su hosting statico; le chiamate API dalla pagina pubblica restano da collegare a backend raggiungibile.


## 2026-05-10 19:22:58 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-002 - Completamento Fase 0 gestionale. **Azione svolta:** pubblicazione frontend statico su hosting smart-cv e correzione percorso dopo 404, caricando la build anche nella document root effettiva /Gestionale/public/Prod. **File/percorsi coinvolti:** frontend/out, frontend/next.config.ts, frontend/src/app/layout.tsx, /Gestionale/Prod, /Gestionale/public/Prod. **Esito:** completato. **Verifiche eseguite:** build statica Next completata; verifica SFTP della struttura hosting; upload completato; apertura URL pubblica avviata. **Note utili:** non registrare credenziali; hosting statico non esegue backend FastAPI; API pubbliche restano da configurare su VPS o processo backend raggiungibile.


## 2026-05-10 21:28:33 - Aggiornamento activity

**Agente:** Codex orchestrazione multi-agente. **Obiettivo collegato:** OBJ-002 / OBJ-003. **Azione svolta:** usati agenti specializzati per analisi stato progetto, frontend static export, backend deploy readiness, sicurezza credenziali e architettura prossimo step; integrate patch minime su frontend produzione, backend autorizzazioni admin, configurazione env e template .env.example. **File coinvolti:** .env.example, backend/app/api/users/router.py, backend/app/core/config.py, frontend/next.config.ts, frontend/src/app/layout.tsx, frontend/src/app/(auth)/login/page.tsx, frontend/src/lib/api.ts, frontend/public/sw.js, frontend/public/manifest.json. **Esito:** completato. **Verifiche eseguite:** npm run lint, npm run build, py_compile backend, import main + configure_mappers, test require_admin_user, alembic current, conteggi DB locale, upload build in /Gestionale/public/Prod. **Note utili:** DB locale gestionale_cv e azienda_local presenti; gestionale_cv e' a head Alembic e contiene dati reali; backend pubblico da rimandare finche' non si completa validazione locale e configurazione VPS.


## 2026-05-11 08:33:58 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-001 / OBJ-003. **Azione svolta:** creata cartella dedicata per file temporanei di conclusione progetto in .tmp/project_completion e aggiornata la direttiva file_management.md. **File coinvolti:** directives/file_management.md, .tmp/project_completion/README.md. **Esito:** completato. **Verifiche eseguite:** creazione cartella e controllo direttiva. **Note utili:** non inserire credenziali o dati sensibili; la cartella e' temporanea e ignorata da Git tramite .tmp/.


## 2026-05-11 08:36:07 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-001 / OBJ-003. **Azione svolta:** spostati nella cartella dedicata .tmp/project_completion i file temporanei gia' creati per deploy/verifiche/conclusione progetto. **File coinvolti:** log backend/frontend dev, batch SFTP temporanei, public_backup. **Esito:** completato. **Verifiche eseguite:** lista .tmp residua e contenuto .tmp/project_completion. **Note utili:** .tmp ora contiene solo project_completion; i contenuti restano temporanei e non versionati.


## 2026-05-11 08:58:01 - Aggiornamento activity

**Agente:** Codex orchestrazione principale + agente Einstein per analisi collaudo. **Obiettivo collegato:** OBJ-002 / OBJ-003. **Azione svolta:** formalizzati tre ambienti Collaudo/Test/Produzione, rinominata la cartella hosting da Prod a test, predisposta produzione, creati rami Git locali collaudo e produzione, corretta route frontend HR dettaglio statica e pubblicata build aggiornata in Test. **File coinvolti:** directives/deployment_environments.md, directives/project_state.md, directives/objectives.md, directives/project_proposal.md, directives/project_proposal_history.md, .env.example, frontend/src/app/(dashboard)/hr/page.tsx, frontend/src/app/(dashboard)/hr/dettaglio/page.tsx, frontend/src/components/hr/EmployeeDetailClientPage.tsx. **Esito:** completato con Produzione non aggiornata per prudenza. **Verifiche eseguite:** npm run lint, npm run build, upload Test via PSCP, HTTP 200 su https://smart-cv.it/test/. **Note utili:** Produzione resta da aggiornare solo dopo checklist collaudo/test; backend pubblico non ancora collegato.


## 2026-05-11 14:02:04 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-002 / OBJ-004. **Azione svolta:** predisposta procedura deterministica per import anagrafica da azienda_local a gestionale_cv, eseguito dry-run con 4465 record sorgente e 4465 destinazione senza differenze, allineato schema locale di collaudo per consentire auth/API con i modelli correnti, verificato backend HR con token locale e avviati server di collaudo. **File coinvolti:** directives/import_anagrafica.md, backend/execution/import_anagrafica_azienda_local.py, backend/execution/align_collaudo_schema.py, frontend/next.config.ts, .tmp/project_completion/collaudo/import_anagrafica, .tmp/project_completion/collaudo/schema_alignment. **Esito:** completato. **Verifiche eseguite:** dry-run import 4465 invariati/0 errori, API /api/health 200, /api/hr/employees/stats 200 con token, /api/hr/employees 200 con token, /api/hr/employees/1 200 con token, frontend locale login/dashboard/hr 200, npm run lint, npm run build, py_compile script. **Note utili:** per login browser serve conoscere o reimpostare password admin con CV_ADMIN_PASSWORD; Produzione non aggiornata.


## 2026-05-11 14:32:32 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-005 - Collaudo anagrafica importata. **Azione svolta:** reimpostata password dell'utente admin locale di collaudo e verificato login API. **File/DB coinvolti:** database locale gestionale_cv, tabella users. **Esito:** completato. **Verifiche eseguite:** POST /api/auth/login restituisce 200, utente admin@calabriaverde.eu attivo e superadmin, access_token generato. **Note utili:** warning passlib/bcrypt non bloccante durante hashing/verifica; non registrare password nei log futuri.


## 2026-05-11 14:40:57 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-005 - Collaudo anagrafica importata. **Azione svolta:** risolto blocco login browser in collaudo: frontend locale puntava all'API online, CORS backend non accettava 127.0.0.1 e il backend locale ereditava password DB remota dal .env. **File coinvolti:** frontend/.env.local, backend/app/core/config.py, .env.example, frontend/src/app/layout.tsx. **Esito:** completato. **Verifiche eseguite:** CORS preflight 200 da http://127.0.0.1:3000, POST /api/auth/login 200 con origin browser simulata, pagina /test/login 200, npm run lint, py_compile config. **Note utili:** in sviluppo locale la service worker e' disabilitata; se il browser conserva vecchi asset, fare hard refresh o cancellare dati sito per 127.0.0.1.


## 2026-05-11 15:02:42 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-005 - Collaudo anagrafica importata. **Azione svolta:** impostati tutti i 4465 dipendenti del collaudo a tempo indeterminato, aggiornata la regola di import per mantenere il contratto indeterminato nella fase corrente e preparata la modifica del fascicolo personale dal frontend. **File/DB coinvolti:** database locale gestionale_cv.employees, backend/execution/set_contracts_indeterminato.py, backend/execution/import_anagrafica_azienda_local.py, directives/import_anagrafica.md, frontend/src/components/hr/EmployeeDetailClientPage.tsx. **Esito:** completato. **Verifiche eseguite:** dry-run contratti records_to_change=0 dopo apply, import anagrafica dry-run 4465 invariati/0 errori, PUT /api/hr/employees/1 200, npm run lint, npm run build, py_compile script. **Note utili:** modifica fascicolo copre dati personali, contatti, contratto/posizione, stato, flag operativi e note; produzione non aggiornata.


## 2026-05-11 15:26:49 - Aggiornamento activity

Scroll della modale fascicolo corretto nel componente base Modal e preparata estensione del profilo contrattuale dipendente per CCNL idraulico-forestale/idraulico-agraria e funzioni locali: aggiunti campi backend e migration non applicata, aggiornati schemi API e form frontend con sezione contrattuale dinamica (CCNL, area/categoria, profilo, orario, scatti, integrativo regionale, provenienza assorbimento). Verifiche: py_compile, npm run lint, npm run build. Fonti analizzate: CCNL forestali 2021-2024 e CCNL Funzioni Locali 2019-2021, oltre a documentazione istituzionale Calabria Verde/Consiglio regionale su ex Comunità montane ed ex LSU/LPU.


## 2026-05-11 16:13:49 - Aggiornamento activity

Aggiunta nuova voce amministrativa Tipi di Contratto con CRUD dedicato e gestione allegati normativi. Implementati backend model/router/schema per anagrafica contratti e allegati CCNL/integrativo, storage file locale backend/storage/contract_types, migration 003 non applicata, e nuova pagina frontend /admin/contracts collegata alla dashboard amministrativa. Verifiche: py_compile backend, npm run lint, npm run build.


## 2026-05-11 18:01:15 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-002 / modulo amministrativo contratti. Azione svolta: applicate al database locale di collaudo le migration 002_employee_contract_profiles e 003_admin_contract_types, creato script deterministico backend/execution/seed_contract_types_local.py ed eseguito seed idempotente dei due contratti base (CCNL Funzioni Locali e CCNL idraulico-forestale e idraulico-agraria), quindi riavviato il backend locale. File coinvolti: backend/migrations/versions/002_employee_contract_profiles.py, backend/migrations/versions/003_admin_contract_types.py, backend/execution/seed_contract_types_local.py, .tmp/project_completion/collaudo/contracts_setup. Esito: completato. Verifiche eseguite: alembic current=003_admin_contract_types (head), seed creati=2, POST /api/auth/login 200, GET /api/admin/contracts/types 200 con Access-Control-Allow-Origin=http://127.0.0.1:3000 e payload di 2 contratti. Note utili: il falso errore CORS era conseguenza della 500 causata dalla tabella mancante, non un problema di configurazione CORS.


## 2026-05-11 18:59:43 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-003 / ambiente Test. Azione svolta: aggiornato il ramo Git locale collaudo con commit 3c6d173 Stabilizza modulo contratti e pagine placeholder, generata build frontend statica per l'ambiente Test con NEXT_PUBLIC_BASE_PATH=/test e NEXT_PUBLIC_API_URL=https://smart-cv.it/api, quindi pubblicato l'output su /Gestionale/public/test/. File coinvolti: backend/, frontend/, directives/, execution/, frontend/out, hosting smart-cv.it test. Esito: completato. Verifiche eseguite: npm run build, controllo output senza riferimenti a 127.0.0.1, HTTP 200 su https://smart-cv.it/test/, https://smart-cv.it/test/admin/contracts/ e https://smart-cv.it/test/assets/logo-calabriaverde.png. Note utili: il repository locale non ha remoto configurato; l'aggiornamento Git e' quindi registrato sul ramo collaudo locale.


## 2026-05-12 20:56:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-003 / ambiente Test e autenticazione. Azione svolta: implementato logout frontend con menu profilo e guardia client della dashboard, creati gli script backend/execution/export_test_bundle.py e import_test_bundle.py per trasferire i dati di collaudo, pubblicato un backend FastAPI dedicato su VPS in /opt/calabriaverde-test con database separato gestionale_cv_test, creato proxy pubblico /api su smart-cv.it verso il backend VPS e ripubblicata la build Test del frontend. File coinvolti: frontend/src/components/layout/Header.tsx, frontend/src/app/(dashboard)/layout.tsx, frontend/src/app/(auth)/login/page.tsx, backend/execution/export_test_bundle.py, backend/execution/import_test_bundle.py, .tmp/project_completion/test/, hosting smart-cv.it /api e /test, VPS 82.165.198.214. Esito: completato. Verifiche eseguite: npm run lint, npm run build, py_compile script Python, https://smart-cv.it/api/health 200, POST https://smart-cv.it/api/auth/login 200, GET https://smart-cv.it/api/auth/me 200, GET https://smart-cv.it/api/admin/contracts/types 200 con 2 contratti, GET https://smart-cv.it/api/hr/employees/stats 200 con 4465 dipendenti, GET https://smart-cv.it/test/login/ 200. Note utili: il backend Test usa MariaDB su porta 8443 del VPS e non tocca il database legacy gestionale_cv presente sul server.


## 2026-05-12 23:45:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-005 / anagrafica personale esterno. Azione svolta: verificato che il database sorgente locale azienda_local non contiene personale esterno, individuata come sorgente utile la base legacy gestionale_cv sul VPS, creati gli script backend/execution/export_personale_esterno_legacy.py e backend/execution/import_personale_esterno_bundle.py, generato bundle JSON deterministico, eseguiti dry-run e apply sul collaudo locale e poi promossa la nuova anagrafica anche sull'ambiente Test tramite export/import del bundle complessivo. File coinvolti: backend/execution/export_personale_esterno_legacy.py, backend/execution/import_personale_esterno_bundle.py, directives/import_personale_esterno.md, .tmp/project_completion/collaudo/import_personale_esterno/, .tmp/project_completion/test/db_bundle/, VPS /opt/calabriaverde-test/legacy_external_bundle e /opt/calabriaverde-test/bundle. Esito: completato. Verifiche eseguite: py_compile dei nuovi script, dry-run locale con 168 sorgenti / 120 inserimenti previsti / 48 skip per codice fiscale mancante / 0 errori, apply locale con 120 esterni effettivamente inseriti e 3 organizzazioni esterne create, import VPS riuscito, GET https://smart-cv.it/api/hr/employees/stats 200 con totale 4585, interni 4465, esterni 120, GET https://smart-cv.it/api/hr/employees?tipo=esterno 200 con records esterni reali. Note utili: le 48 anagrafiche scartate sono tutte prive di codice fiscale nella sorgente legacy; le organizzazioni esterne sono state mappate in modo deterministico con codici EXT005, EXT008 e EXT014.


## 2026-05-13 00:05:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-002 / modulo Risorse Umane. Azione svolta: separata la navigazione HR in due sotto-menu dedicati, Anagrafica interna e Anagrafica esterna, mantenendo una pagina hub su /hr e introducendo una componente condivisa per la consultazione filtrata dei due perimetri. File coinvolti: frontend/src/components/hr/HrRegistryPage.tsx, frontend/src/app/(dashboard)/hr/page.tsx, frontend/src/app/(dashboard)/hr/interna/page.tsx, frontend/src/app/(dashboard)/hr/esterna/page.tsx, frontend/src/components/layout/Sidebar.tsx, frontend/src/components/layout/Header.tsx. Esito: completato. Verifiche eseguite: npm run lint con soli warning preesistenti sui tag img, npm run build con generazione corretta delle route /hr, /hr/interna e /hr/esterna. Note utili: la distinzione interna/esterna ora non dipende piu' da un filtro manuale ma da viste dedicate collegate direttamente dal menu Risorse Umane.


## 2026-05-13 00:55:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-002 / modulo amministrativo multiuso. Azione svolta: creato il nuovo modulo Geografia per la gestione di stati, regioni, province, comuni, confini amministrativi e toponimi Calabria, con modelli dedicati, migration 004_geography_module, router backend /api/admin/geography, script di import da database legacy e nuova pagina frontend /admin/geography collegata all'area Amministrazione. File coinvolti: backend/app/models/geography.py, backend/app/schemas/geography.py, backend/app/api/admin_geography/router.py, backend/migrations/versions/004_geography_module.py, backend/execution/import_geography_module.py, backend/main.py, frontend/src/app/(dashboard)/admin/geography/page.tsx, frontend/src/app/(dashboard)/admin/page.tsx, frontend/src/components/layout/Header.tsx, directives/geography_module.md. Esito: completato a livello codice. Verifiche eseguite: py_compile backend, npm run lint con soli warning preesistenti su img, npm run build con route /admin/geography generata correttamente. Note utili: nel database locale sono stati rilevati con certezza foreign_states, it_regions, it_provinces e it_municipalities; i layer opzionali per confini province/comuni e toponimi Calabria sono supportati dallo script tramite env dedicate, ma i nomi reali delle relative tabelle sorgente non sono emersi automaticamente nel database locale ispezionato.


## 2026-05-13 01:20:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-002 / area Strumenti e modulo geografico. Azione svolta: creata nuova area indipendente Strumenti nel menu principale con pagine /tools, /tools/geography e /tools/codice-fiscale; aggiunto tool multiuso per codice fiscale con ricerca anagrafica interna/esterna, analisi del codice e generazione inversa; mantenuta compatibilita sul percorso legacy /admin/geography; applicata in collaudo la migration 004_geography_module e importata la base territoriale da azienda_local nel nuovo modulo geografico. File coinvolti: frontend/src/components/layout/Sidebar.tsx, frontend/src/components/layout/Header.tsx, frontend/src/app/(dashboard)/tools/, frontend/src/components/tools/GeographyWorkbench.tsx, frontend/src/components/tools/FiscalCodeWorkbench.tsx, frontend/src/lib/fiscalCode.ts, backend/migrations/versions/004_geography_module.py, backend/execution/import_geography_module.py, .tmp/project_completion/collaudo/geography_import/summary.json. Esito: completato in collaudo. Verifiche eseguite: npm run lint con soli warning img gia' noti, npm run build con route /tools, /tools/geography e /tools/codice-fiscale generate correttamente, Alembic locale aggiornato a 004_geography_module, import base riuscito con 217 stati, 20 regioni, 107 province e 7896 comuni. Note utili: i layer opzionali confini province, confini comuni e toponimi Calabria restano vuoti finche' non vengono indicati i nomi reali delle tabelle sorgente da collegare allo script.


## 2026-05-13 01:58:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-002 / area Strumenti su ambiente Test. Azione svolta: esteso il tool Codice Fiscale con lookup dei codici luogo per comuni e stati esteri, aggiornati gli script di promozione Test per includere le tabelle geo_* nel bundle dati, pubblicati frontend e backend su Test, eseguita la migration 004 sul VPS, importato il bundle aggiornato nel database gestionale_cv_test e riavviato il servizio calabriaverde-test. File coinvolti: frontend/src/components/tools/FiscalCodeWorkbench.tsx, frontend/src/app/(dashboard)/tools/page.tsx, frontend/src/app/(dashboard)/hr/page.tsx, backend/execution/export_test_bundle.py, backend/execution/import_test_bundle.py, backend/app/api/admin_geography/router.py, backend/app/models/geography.py, backend/app/schemas/geography.py, backend/migrations/versions/004_geography_module.py, .tmp/project_completion/test/db_bundle, hosting smart-cv.it /test, VPS /opt/calabriaverde-test. Esito: completato. Verifiche eseguite: py_compile script Python, npm run lint con soli warning img gia' noti, npm run build, HTTP 200 su https://smart-cv.it/test/tools/ e sulle due route /tools/geography e /tools/codice-fiscale, HTTP 403 non autenticato su https://smart-cv.it/api/admin/geography/summary, verifica autenticata API con riepilogo 217 stati / 20 regioni / 107 province / 7896 comuni. Note utili: i layer confini e toponimi restano a zero su Test finche' non vengono forniti i nomi reali delle tabelle sorgente da importare.


## 2026-05-13 02:20:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-002 / stabilizzazione moduli Strumenti. Azione svolta: corretto il backend Geografia su MariaDB eliminando l'ordinamento `NULLS LAST` non compatibile per la lista regioni, semplificato il modulo Codice Fiscale lasciando soltanto generatore e lettura inversa, quindi ripubblicati frontend e backend su Test e verificata la risposta autenticata delle route geografiche. File coinvolti: backend/app/api/admin_geography/router.py, frontend/src/components/tools/FiscalCodeWorkbench.tsx, hosting smart-cv.it /test, VPS /opt/calabriaverde-test/backend/app/api/admin_geography/router.py. Esito: completato. Verifiche eseguite: py_compile router geografia, npm run lint con soli warning img gia' noti, npm run build, HTTP 200 su /test/tools/geography e /test/tools/codice-fiscale, login admin Test riuscito, GET autenticato /api/admin/geography/summary con 217 stati / 20 regioni / 107 province / 7896 comuni, GET autenticato /api/admin/geography/regions con 20 record. Note utili: il problema visibile in pagina Geografia derivava dal backend regioni e non da un errore del menu o della route frontend.


## 2026-05-14 16:36:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: consolidamento generale piattaforma. Azione svolta: estratti componenti frontend riusabili in `frontend/src/components/common/` e hook comune in `frontend/src/hooks/`, consolidati gli helper degli script dati in `backend/execution/common/`, aggiornati i moduli HR e Geografia per usare i nuovi mattoni condivisi e documentata la regola di riuso in `directives/common_modules.md`. File coinvolti: frontend/src/components/common/, frontend/src/hooks/useDebouncedValue.ts, frontend/src/components/hr/HrRegistryPage.tsx, frontend/src/components/tools/GeographyWorkbench.tsx, backend/execution/common/, backend/execution/export_test_bundle.py, backend/execution/import_test_bundle.py, backend/execution/export_personale_esterno_legacy.py, backend/execution/export_geography_bundle.py, directives/common_modules.md. Esito: completato. Verifiche eseguite: py_compile degli script consolidati, npm run lint senza errori e con 4 warning residui su tag img gia' noti, npm run build con route statiche generate correttamente, HTTP 200 su https://smart-cv.it/api/health, https://smart-cv.it/test/login/, https://smart-cv.it/test/tools/, https://smart-cv.it/test/tools/geography/ e https://smart-cv.it/test/tools/codice-fiscale/, POST autenticato su https://smart-cv.it/api/auth/login con esito positivo e GET autenticato su /api/auth/me con utente admin attivo. Note utili: il logout resta client-side e rimuove `access_token` e `refresh_token` dal browser; non e' presente un endpoint server dedicato.


## 2026-05-14 17:15:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: avvio locale ambienti Collaudo/Test. Azione svolta: creato un sistema locale dedicato in `scripts/local/` per avviare backend, collaudo e test su porte separate e con basePath locali coerenti (`/gestionale/collaudo` e `/gestionale/test`), aggiungendo anche wrapper `.cmd` per l'uso diretto su Windows senza blocchi di execution policy. File coinvolti: scripts/local/Common.ps1, scripts/local/Start-Collaudo.ps1, scripts/local/Start-Test.ps1, scripts/local/Start-All.ps1, scripts/local/Stop-All.ps1, scripts/local/Status.ps1, scripts/local/*.cmd, directives/local_runtime.md. Esito: completato a livello di tooling locale. Verifiche eseguite: parsing e lancio controllato degli script PowerShell in bypass, generazione dei log runtime in `.tmp/project_completion/local_runtime/`, controllo dell'output dei processi backend/frontend in fase di bootstrap. Note utili: nel sandbox di lavoro i processi locali a lunga durata non restano affidabili come su esecuzione manuale da desktop, quindi il collaudo finale di persistenza va eseguito direttamente sul PC tramite i launcher `.cmd`.

## 2026-05-14 18:05:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: fascicolo personale esterno. Azione svolta: separata la scheda anagrafica esterna da quella del personale interno eliminando in vista e modifica le sezioni di profilo contrattuale da dipendente, aggiungendo il nuovo campo persistente `tipo_collaborazione`, una tassonomia iniziale delle collaborazioni esterne e una sezione allegati focalizzata sulla documentazione di collaborazione. File coinvolti: backend/app/models/employee.py, backend/app/schemas/employee.py, backend/migrations/versions/005_external_collaboration_profiles.py, backend/migrations/versions/006_backfill_external_collaboration_type.py, frontend/src/components/hr/EmployeeDetailClientPage.tsx. Esito: completato in locale. Verifiche eseguite: `npm run build` OK, `py_compile` dei file backend/migration OK, migration locale `005` e `006` applicate con successo, backend locale `http://127.0.0.1:8010/api/health` 200, frontend locale Collaudo e Test raggiungibili 200, verifica autenticata su un record esterno con `tipo_collaborazione = collaborazione_generica`. Note utili: gli esterni già importati vengono inizialmente marcati come `collaborazione_generica`, così possono essere riclassificati gradualmente senza lasciare il campo vuoto.

## 2026-05-14 18:40:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: consolidamento piattaforma e fascicolo HR. Azione svolta: completata la modale di modifica del fascicolo personale per interni ed esterni aggiungendo gestione di patenti di guida, abilitazioni, documenti/scadenze e nuove qualifiche; consolidato il runtime locale con export statico servito localmente; riallineati `project_state`, `objectives`, `decisions`, `error_memory` e documentazione direzionale. File coinvolti: frontend/src/components/hr/EmployeeDetailClientPage.tsx, frontend/src/app/layout.tsx, scripts/local/, directives/project_state.md, directives/project_proposal.md, directives/project_proposal_history.md, directives/objectives.md, directives/decisions.md, directives/error_memory.md. Esito: completato in collaudo locale. Verifiche eseguite: `npm run build` OK, `npm run lint` con soli 4 warning img gia' noti, backend locale 200 su `/api/health`, frontend locale 200 su percorsi Collaudo/Test e dettaglio HR. Note utili: la sezione documenti oggi gestisce censimento e scadenze, ma l'upload fisico file e' ancora un passo successivo.


## 2026-05-14 19:30:00 - Aggiornamento activity

Agente: Codex orchestrazione principale. Obiettivo collegato: OBJ-006 - Consolidamento piattaforma e promozione controllata. Azione svolta: completato il riallineamento finale tra Collaudo e Test, ripulendo la cartella pubblica `test/` su hosting, ricostruendo la build frontend con `NEXT_PUBLIC_BASE_PATH=/test`, esportando un nuovo bundle dati da Collaudo, aggiornando sul VPS gli script di import condivisi, sanando lo stato Alembic del database Test fino a `006_backfill_external_collaboration_type`, reimportando il bundle e riavviando il servizio `calabriaverde-test`. In parallelo sono stati rimossi da Collaudo gli artefatti locali non piu' utili (`.pytest_cache`, `frontend/out`, `__pycache__` degli script) e ripulito il runtime locale dagli errori rumorosi in stop. File coinvolti: `backend/app/models/employee.py`, `backend/app/schemas/employee.py`, `backend/migrations/versions/005_external_collaboration_profiles.py`, `backend/migrations/versions/006_backfill_external_collaboration_type.py`, `backend/execution/import_test_bundle.py`, `backend/execution/common/`, `scripts/local/Common.ps1`, `frontend/out`, `.tmp/project_completion/test/db_bundle/`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/`. Esito: completato. Verifiche eseguite: `npm run lint`, `npm run build`, export bundle locale, `https://smart-cv.it/api/health` 200, `https://smart-cv.it/test/login/` 200, `https://smart-cv.it/test/hr/esterna/` 200, `https://smart-cv.it/test/tools/geography/` 200, login admin Test riuscito, API HR esterni con record `4466` e `tipo_collaborazione=collaborazione_generica`, servizio VPS attivo dopo restart. Note utili: la promozione Test va eseguita sempre con pulizia preventiva della cartella pubblica e verifica dello stato Alembic remoto prima di importare i dati.
## 2026-05-14 21:58:00 - Attivazione modulo Parco Macchine in Collaudo

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** analizzato il patrimonio dati del vecchio gestionale per il parco mezzi, creato il nuovo modulo `fleet` lato backend e frontend, applicata la migration `007_fleet_module` al database locale di Collaudo, importati i dati legacy reali del parco macchine e collegate le nuove route nel menu di navigazione.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/schemas/fleet.py`, `backend/app/api/fleet/router.py`, `backend/main.py`, `backend/migrations/versions/007_fleet_module.py`, `backend/execution/export_fleet_legacy.py`, `backend/execution/import_fleet_bundle.py`, `backend/execution/export_test_bundle.py`, `frontend/src/components/fleet/FleetDashboardClientPage.tsx`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/components/fleet/FleetMapClientPage.tsx`, `frontend/src/app/(dashboard)/fleet/`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/components/layout/Header.tsx`, `.tmp/project_completion/collaudo/fleet_import/`  
**Esito:** completato in Collaudo  
**Verifiche eseguite:** `py_compile` backend/migration/script fleet, `npm run lint`, `npm run build`, applicazione `alembic upgrade head` fino a `007_fleet_module`, verifica conteggi DB locale (`vehicle_types=5`, `vehicles=20`, `vehicle_revisions=7`, `vehicle_logs=0`, `aib_team_vehicles=2`), verifica API backend via `FastAPI TestClient` con login admin `200`, `GET /api/fleet/summary 200`, `GET /api/fleet/vehicles 200`, `GET /api/fleet/vehicles/1 200`, verifica pagine statiche locali `/gestionale/collaudo/fleet/`, `/fleet/anagrafica/`, `/fleet/dettaglio/?id=1` tutte `200`.  
**Note utili:** il DB legacy dei mezzi e' stato importato mantenendo compatibilita' nominale delle tabelle storiche; la promozione su Test non e' ancora stata eseguita in questo turno.  

## 2026-05-14 22:50:00 - Stabilizzazione fleet tra Collaudo e Test

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** completata la promozione del modulo `fleet` su Test caricando sul VPS backend, migration `007_fleet_module` e bundle dati aggiornato con tabelle mezzi; corretto `backend/execution/import_test_bundle.py` per includere le tabelle fleet nella promozione; stabilizzato il runtime locale modificando `scripts/local/Common.ps1` e `scripts/local/Status.ps1` in modo che Collaudo/Test locali usino l'API pubblica `https://smart-cv.it/api` senza dipendere da un backend locale fragile. Ripubblicata anche la build frontend di Test con le route fleet aggiornate.  
**File coinvolti:** `backend/execution/import_test_bundle.py`, `scripts/local/Common.ps1`, `scripts/local/Status.ps1`, `.tmp/project_completion/test/db_bundle/`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`, `/opt/calabriaverde-test/bundle`.  
**Esito:** completato su Collaudo locale e Test pubblico.  
**Verifiche eseguite:** upload bundle VPS riuscito, `alembic upgrade head` remoto fino a `007_fleet_module`, import remoto riuscito, `systemctl` servizio `calabriaverde-test` attivo, conteggi DB Test verificati (`vehicles=20`, `vehicle_revisions=7`, `aib_team_vehicles=2`), `GET https://smart-cv.it/api/fleet/summary` autenticato `200`, `GET https://smart-cv.it/api/fleet/vehicles?page=1&page_size=3` autenticato `200`, `GET https://smart-cv.it/api/fleet/vehicles/1` autenticato `200`, pagine locali `http://127.0.0.1:3000/gestionale/collaudo/fleet/`, `/fleet/anagrafica/`, `/fleet/dettaglio/?id=1` tutte `200`, pagine pubbliche `https://smart-cv.it/test/login/` e `https://smart-cv.it/test/fleet/` `200`.  
**Note utili:** il `Failed to fetch` del modulo mezzi derivava dal backend Test non ancora riallineato e, in locale, dalla dipendenza da un backend 8010 instabile; la soluzione stabile e' usare l'API pubblica Test anche nel runtime statico locale.  

## 2026-05-14 23:05:00 - Stabilizzazione sessione con token scaduto

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-006 - Consolidamento piattaforma e promozione controllata  
**Azione svolta:** corretto il comportamento del frontend quando in localStorage resta un `access_token` non valido o scaduto. Il client API ora intercetta in modo centralizzato le risposte `401/403` riconducibili ad autenticazione scaduta, pulisce `access_token` e `refresh_token`, emette l'evento `auth-state-changed` e forza il ritorno alla pagina di login coerente con il `basePath` attivo. In parallelo la pagina di login non reindirizza piu' in automatico solo per la presenza del token, ma valida la sessione con `GET /auth/me` usando `skipAuthRedirect`, evitando loop e banner "Token non valido o scaduto" appena si apre una pagina protetta.  
**File coinvolti:** `frontend/src/lib/api.ts`, `frontend/src/app/(auth)/login/page.tsx`, `frontend/out`, hosting `smart-cv.it/test`.  
**Esito:** completato su Collaudo locale e Test pubblico.  
**Verifiche eseguite:** rebuild locale e pubblico completato con `NEXT_PUBLIC_BASE_PATH=/test`, verifica HTML `https://smart-cv.it/test/login/` e `https://smart-cv.it/test/fleet/` con asset `/test/...` corretti, controllo del bundle esportato con presenza di `clearAuthState`, `redirectToLogin`, `skipAuthRedirect` e redirect a `/test/login/`, verifica runtime locale su `/gestionale/collaudo/login/` e pagine fleet `200`.  
**Note utili:** ogni pagina protetta che usa il client API condiviso eredita ora il fallback centralizzato sul login; in caso di token vecchio il comportamento atteso e' uscita silenziosa dalla sessione e ritorno alla login senza lasciare la vista in errore.  

## 2026-05-14 23:58:00 - Estensione operativa Parco Macchine con gruppi e comunicazioni

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** esteso il modulo `fleet` per supportare gruppi di mezzi, rinnovi massivi di assicurazione e revisione, assegnazioni multiple, registri di utilizzo con km e note operative, alert SOS e sinistri, oltre a un registro ufficiale delle comunicazioni riusabile anche in altri moduli. La promozione e' stata completata anche su Test pubblico con migration `008_fleet_ops_comms`, backend VPS aggiornato e frontend ripubblicato.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/models/communications.py`, `backend/app/services/communication_log.py`, `backend/app/schemas/fleet.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/008_fleet_ops_comms.py`, `backend/main.py`, `backend/execution/export_test_bundle.py`, `backend/execution/import_test_bundle.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/lib/api.ts`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`.  
**Esito:** completato su Collaudo e Test.  
**Verifiche eseguite:** `py_compile` dei nuovi modelli, schemi, router e migration; `npm run build`; smoke test end-to-end via `FastAPI TestClient` con creazione gruppo, bulk insurance, revisione, assegnazione, usage log, alert `sinistro` e verifica comunicazioni; promozione su VPS con `alembic upgrade head` fino a `008_fleet_ops_comms`; controllo servizio `calabriaverde-test` attivo; `GET https://smart-cv.it/api/fleet/groups` non autenticato `403` a conferma delle route pubblicate; `GET https://smart-cv.it/test/fleet/anagrafica/` `200`.  
**Note utili:** i canali SMS, WhatsApp e push non sono ancora integrati con gateway esterni; il sistema pero' e' gia' predisposto con destinatari, registro ufficiale delle comunicazioni e strutture dati per agganciare i canali successivi senza rifare il modulo.  
