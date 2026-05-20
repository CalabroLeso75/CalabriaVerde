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

## 2026-05-15 10:45:00 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-003 / stabilizzazione Collaudo e Test. **Azione svolta:** corretta la navigazione basePath-aware del frontend statico per gli ambienti `/test`, `/gestionale/test` e `/gestionale/collaudo`, eliminando i path assoluti grezzi che causavano `404 File not found` in locale; rafforzata inoltre la guardia del layout dashboard con verifica reale della sessione via `/auth/me` per ridurre il rimbalzo login/dashboard con token stale. **File coinvolti:** `frontend/src/lib/app-path.ts`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/app/(dashboard)/page.tsx`, `frontend/src/app/(dashboard)/dashboard/page.tsx`, `frontend/src/app/(dashboard)/admin/page.tsx`, `frontend/src/app/(dashboard)/hr/page.tsx`, `frontend/src/app/(dashboard)/tools/page.tsx`, `frontend/src/components/hr/HrRegistryPage.tsx`, `frontend/src/components/fleet/FleetDashboardClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/app/(dashboard)/layout.tsx`, `frontend/.env.local`, `directives/error_memory.md`. **Esito:** completato. **Verifiche eseguite:** `npm run build`, `curl -I http://127.0.0.1:3000/gestionale/collaudo/login/` = `200`, `curl -I http://127.0.0.1:3000/gestionale/collaudo/dashboard/` = `200`, `curl -I http://127.0.0.1:3000/gestionale/collaudo/hr/interna/` = `200`, `curl -I http://127.0.0.1:3000/gestionale/collaudo/fleet/anagrafica/` = `200`, `curl -i https://smart-cv.it/test/login/` = `200`. **Note utili:** l'HTML pubblico di `smart-cv.it/test/login/` e' aggiornato con asset sotto `/test/...`; resta da validare nel browser utente il comportamento post-login dopo il refresh completo della cache.

## 2026-05-15 11:05:00 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-003 / stabilizzazione routing locale. **Azione svolta:** corretto il secondo errore di routing introdotto dalla gestione manuale del basePath: i link Next non devono ricevere URL gia' prefissati perche' il router aggiunge automaticamente `/test`, `/gestionale/test` o `/gestionale/collaudo` in base alla build. **File coinvolti:** `frontend/src/lib/app-path.ts`, `directives/error_memory.md`, `directives/activity_log.md`. **Esito:** completato. **Verifiche eseguite:** build e verifica URL locali dopo rigenerazione ambiente. **Note utili:** mantenere distinti link applicativi e URL assoluti/asset; i primi devono restare senza prefisso manuale.

## 2026-05-15 12:10:00 - Aggiornamento activity

**Agente:** Codex orchestrazione principale. **Obiettivo collegato:** OBJ-006 / Parco Macchine operativo. **Azione svolta:** riorganizzate le azioni operative del modulo mezzi secondo il flusso richiesto: creazione gruppi da modale con ricerca e selezione mezzi tramite checkbox, pulsanti assicurazione/revisione sui gruppi, pulsanti assicurazione/revisione/assegnazione/restituzione nel dettaglio mezzo e registrazione comunicazione ufficiale quando un mezzo viene assegnato. **File coinvolti:** `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`. **Esito:** completato in collaudo codice. **Verifiche eseguite:** `npm run build`, `py_compile` di router e schemi fleet. **Note utili:** la comunicazione di assegnazione genera numero progressivo annuo nel formato `n/anno`, registra destinatari da configurazione e aggiunge canali email/sms/whatsapp dell'assegnatario se presenti; l'invio reale SMS/WhatsApp resta subordinato alla futura configurazione SIM/gateway.

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

## 2026-05-15 01:15:00 - Miglioramento UX operativo modulo mezzi

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretto il disallineamento tra funzionalita' presenti e visibilita' reale in pagina del modulo mezzi. La dashboard fleet ora espone liste operative per assicurazioni in scadenza o mancanti, revisioni in scadenza o mancanti, mezzi da assegnare e mezzi da restituire con link diretti al fascicolo sul tab corretto. Nel dettaglio mezzo e' stata aggiunta la restituzione esplicita dell'assegnazione attiva e, in fondo alla scheda, un elenco unico delle operazioni del mezzo con apertura del dettaglio riga per riga.  
**File coinvolti:** `frontend/src/components/fleet/FleetDashboardClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/lib/api.ts`, `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`.  
**Esito:** completato su Collaudo e Test.  
**Verifiche eseguite:** `py_compile` backend fleet, `npm run build`, rebuild Test con `NEXT_PUBLIC_BASE_PATH=/test`, upload frontend su hosting, deploy backend fleet sul VPS con restart `calabriaverde-test` attivo, `GET https://smart-cv.it/api/health` `200`, `GET https://smart-cv.it/test/fleet/` `200`, `GET https://smart-cv.it/test/fleet/anagrafica/` `200`.  
**Note utili:** la dashboard ora espone le azioni in modo evidente, mentre il fascicolo mezzo concentra anche la restituzione e uno storico operazioni espandibile; il registro comunicazioni complessivo globale resta invece un passo successivo dedicato.  

## 2026-05-15 01:40:00 - Stabilizzazione login, redirect e cache locale/test

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-001 - Stabilizzazione piattaforma collaudo/test  
**Azione svolta:** corretto il flusso di navigazione auth per gli ambienti con `basePath`, introducendo un helper condiviso per i percorsi applicativi e riallineando login, logout, redirect dashboard, reset password e ritorni dal fascicolo HR. E' stato inoltre disattivato temporaneamente il service worker in produzione, sostituendolo con cleanup automatico delle registrazioni esistenti per eliminare cache stale che causavano refresh anomali e schermate non aggiornate sia online sia in locale.  
**File coinvolti:** `frontend/src/lib/app-path.ts`, `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/(auth)/register/page.tsx`, `frontend/src/app/(auth)/reset-password/page.tsx`, `frontend/src/app/(dashboard)/layout.tsx`, `frontend/src/app/layout.tsx`, `frontend/src/components/layout/Header.tsx`, `frontend/src/components/system/UnderConstructionPage.tsx`, `frontend/src/components/hr/EmployeeDetailClientPage.tsx`, hosting `smart-cv.it/test`, runtime locale `.tmp/project_completion/local_runtime`.  
**Esito:** completato su Collaudo locale e ripubblicato su Test.  
**Verifiche eseguite:** `npm run build` frontend; rebuild statico locale per `/gestionale/collaudo` e `/gestionale/test`; `curl -I http://127.0.0.1:3000/gestionale/collaudo/login/` `200`; `curl -I http://127.0.0.1:3000/gestionale/test/login/` `200`; controllo del contenuto generato locale con presenza del cleanup `navigator.serviceWorker.getRegistrations()`; rebuild `NEXT_PUBLIC_BASE_PATH=/test`, upload frontend su hosting e verifica server-side del file `login/index.html` pubblicato su `smart-cv.it/test`.  
**Note utili:** il browser che aveva gia' un vecchio service worker puo' richiedere un primo caricamento della nuova login per completare l'unregister, ma dalla build pubblicata in poi il frontend non registra piu' nuove cache attive.  

## 2026-05-15 02:24:00 - Ripristino accesso Test con endpoint HTTPS stabile

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-003 - Deploy e integrazione ambienti Test/Produzione  
**Azione svolta:** individuato il disallineamento DNS che impediva al frontend pubblico di raggiungere l'API sul VPS (`smart-cv.it` risolve verso hosting esterno, non verso il VPS), predisposto un endpoint HTTPS stabile sul VPS `https://82-165-198-214.sslip.io/api`, emesso certificato Let's Encrypt dedicato, aggiornato nginx sul VPS, ricostruita la build pubblica `smart-cv.it/test` puntandola al nuovo endpoint e riallineati anche gli script del runtime locale per usare lo stesso backend stabile sia su `/gestionale/test` sia su `/gestionale/collaudo`.  
**File coinvolti:** `scripts/local/Common.ps1`, `scripts/local/Status.ps1`, `frontend/out`, hosting `smart-cv.it/test`, configurazione nginx e certbot sul VPS.  
**Esito:** completato con workaround infrastrutturale stabile.  
**Verifiche eseguite:** `curl -I https://smart-cv.it/test/login/` da hosting `200`; `curl -i https://82-165-198-214.sslip.io/api/health -H 'Origin: https://smart-cv.it'` `200` con header `Access-Control-Allow-Origin`; login API verificato via Python sul VPS con credenziali admin `200`; rebuild locale completato per `/gestionale/collaudo` e `/gestionale/test`; `curl -I http://127.0.0.1:3000/gestionale/collaudo/login/` `200`; `curl -I http://127.0.0.1:3000/gestionale/test/login/` `200`; verifica dei bundle locali con endpoint `https://82-165-198-214.sslip.io/api`.  
**Note utili:** il dominio `smart-cv.it` continua a pubblicare record DNS esterni (`A 217.160.0.247`, `AAAA 2001:8d8:100f:f000::200`), quindi l'API non puo' tornare su `smart-cv.it/api` finche' i DNS non verranno riallineati o instradati esplicitamente verso il VPS.  

## 2026-05-15 14:10:00 - Rifinitura workflow assegnazione mezzi

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiornato il workflow di assegnazione mezzi con ricerca server-side del personale interno, visualizzazione della data di nascita per evitare omonimie, assegnazione opzionale a reparto/sede aziendale, verbale progressivo automatico non modificabile, conferma obbligatoria quando i km consegna differiscono dall'ultima registrazione, proroga con documento/comunicazione ufficiale e anteprima mezzi con scadenze assicurazione/revisione colorate. La lista mezzi ora distingue assegnatario, reparto/sede e utilizzatore corrente.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/schemas/fleet.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/009_fleet_assignment_units.py`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`.  
**Esito:** completato in Collaudo locale.  
**Verifiche eseguite:** migration locale fino a `009_fleet_assignment_units`, `py_compile` backend fleet, smoke API autenticato con `GET /api/fleet/assignment-units`, `GET /api/fleet/vehicles`, `GET /api/fleet/vehicles/1` tutti `200`, `npm run lint` senza errori, `npm run build` OK.  
**Note utili:** sul DB locale `organizations` non espone ancora tutte le colonne del modello moderno; il router fleet usa `load_only` e query a colonne esplicite per non dipendere da campi non necessari come `pec`.

## 2026-05-16 10:55:00 - Catalogo tecnico normalizzato Parco Macchine

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** rielaborata l'architettura dati del parco macchine introducendo il catalogo tecnico locale normalizzato per marche, modelli e allestimenti/motori. Ogni mezzo fisico `vehicles` ora ha un `trim_id` obbligatorio verso `vehicle_trims`; la migration effettua il backfill dei 20 mezzi importati creando i record tecnici locali prima di rendere il collegamento obbligatorio. Aggiunto il servizio `FleetCatalogService` con logica `lookup locale -> fallback API VIN opzionale -> salvataggio DB -> creazione mezzo fisico`, normalizzazione anti-duplicati e endpoint catalogo.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/schemas/fleet.py`, `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/010_fleet_vehicle_catalog.py`, `backend/execution/export_test_bundle.py`, `backend/execution/import_test_bundle.py`, `backend/execution/import_fleet_bundle.py`.  
**Esito:** completato in Collaudo locale.  
**Verifiche eseguite:** `py_compile` backend/migration/script OK, `alembic upgrade head` locale fino a `010_fleet_vehicle_catalog`, smoke API autenticato su `/api/fleet/catalog/brands`, `/api/fleet/catalog/models`, `/api/fleet/catalog/trims`, `/api/fleet/vehicles`, `/api/fleet/vehicles/1`, verifica DB `vehicles.trim_id IS NULL = 0`, test servizio creazione mezzo in transazione con rollback.  
**Note utili:** il fallback esterno e' predisposto su NHTSA VIN decoder ma disattivato di default con `FLEET_EXTERNAL_LOOKUP_ENABLED=false`; questo mantiene il comportamento economico richiesto, usando l'API solo se esplicitamente abilitata e se il dato locale manca.

## 2026-05-16 11:35:00 - Frontend catalogo tecnico Parco Macchine

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiunta la pagina frontend `Parco Macchine > Catalogo tecnico` per visualizzare e cercare allestimenti tecnici, creare marca/modello/motore e creare un mezzo fisico collegato obbligatoriamente a un allestimento. Aggiornato il menu laterale e pubblicata la build su Test.  
**File coinvolti:** `frontend/src/components/fleet/FleetCatalogClientPage.tsx`, `frontend/src/app/(dashboard)/fleet/catalogo/page.tsx`, `frontend/src/components/layout/Sidebar.tsx`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`.  
**Esito:** completato su Collaudo e Test.  
**Verifiche eseguite:** `npm run lint` senza errori, `npm run build` OK con route `/fleet/catalogo`, deploy frontend Test, migration backend Test fino a `010_fleet_vehicle_catalog`, `https://smart-cv.it/test/fleet/catalogo/` `200`, endpoint autenticato `GET https://82-165-198-214.sslip.io/api/fleet/catalog/trims?search=isuzu` `200`.  
**Note utili:** il catalogo era gia' presente lato backend ma non visibile in UI; da ora la verifica utente passa dalla nuova voce del menu Parco Macchine.

## 2026-05-16 12:35:00 - Estensione dati tecnici e gomme catalogo mezzi

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** esteso il catalogo tecnico mezzi con campi dettagliati per motore, codice motore, coppia, cambio, trazione, carrozzeria, porte, posti, classe euro, CO2, consumi, dimensioni, massa, traino e tabella dedicata alle misure gomme del trim, inclusa misura default e note per misure alternative. Aggiornata la pagina `Parco Macchine > Catalogo tecnico` per compilare e visualizzare questi dati.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/schemas/fleet.py`, `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/011_fleet_trim_technical_details.py`, `frontend/src/components/fleet/FleetCatalogClientPage.tsx`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`.  
**Esito:** completato su Collaudo e Test.  
**Verifiche eseguite:** `py_compile` backend OK, `npm run lint` senza errori, `npm run build` OK, migration locale `011_fleet_trim_technical_details` applicata, smoke API locale creazione/detail trim tecnico con gomme OK, deploy backend Test e migration Test fino a `011`, `GET https://82-165-198-214.sslip.io/api/fleet/catalog/trims/1` autenticato `200`, file frontend pubblicato verificato su hosting in `/home/www/Gestionale/public/test/fleet/catalogo/index.html`.  
**Note utili:** i 20 mezzi importati non hanno VIN/telaio valorizzato, quindi non e' possibile arricchirli automaticamente tramite lookup VIN finche' non viene fornita una sorgente dati tecnica o i VIN corretti; il catalogo ora e' pronto a importare e conservare quei dati.

## 2026-05-16 13:20:00 - Provider esterni catalogo mezzi

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** predisposta l'integrazione con piattaforme esterne per popolare il catalogo mezzi senza database proprietario iniziale. Aggiunta configurazione centralizzata per provider targa italiana, VIN NHTSA e Wheel-Size, tabella `vehicle_external_lookups` per audit/cache delle interrogazioni, servizio provider-based con salvataggio automatico del trim trovato nel catalogo locale e UI in `Parco Macchine > Catalogo tecnico` per cercare da targa o VIN.  
**File coinvolti:** `backend/app/core/config.py`, `backend/app/models/fleet.py`, `backend/app/schemas/fleet.py`, `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/012_fleet_external_lookup_cache.py`, `frontend/src/components/fleet/FleetCatalogClientPage.tsx`.  
**Esito:** completato in Collaudo locale, pronto per attivazione API key/provider scelto.  
**Verifiche eseguite:** `py_compile` backend OK, `npm run lint` senza errori, `npm run build` OK, migration locale `012_fleet_external_lookup_cache` applicata, smoke service locale provider status e lookup disattivato con log di audit OK e dato di prova rimosso.  
**Note utili:** il provider targa resta volutamente generico (`FLEET_PLATE_API_URL` + `FLEET_PLATE_API_KEY`) per poter collegare TuttoTarghe/InfoTarga o altro fornitore senza riscrivere il gestionale; finche' `FLEET_EXTERNAL_LOOKUP_ENABLED=false` non partono chiamate esterne.

## 2026-05-16 13:55:00 - Popolamento reale catalogo marche/modelli

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretto il catalogo tecnico per mostrare anche marche e modelli, non solo allestimenti. Aggiunto endpoint di import da fonte pubblica NHTSA e contatore reale del catalogo. Eseguito import su Test.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/schemas/fleet.py`, `backend/app/api/fleet/router.py`, `frontend/src/components/fleet/FleetCatalogClientPage.tsx`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`.  
**Esito:** completato su Test.  
**Verifiche eseguite:** `py_compile` backend OK, `npm run lint` senza errori, `npm run build` OK, deploy backend/frontend Test, import NHTSA Test con `12.243` marche e `2.503` modelli importati, `GET /api/fleet/catalog/stats` autenticato OK, pagina `https://smart-cv.it/test/fleet/catalogo/` `200`.  
**Note utili:** la ricerca da targa richiede ancora una API targa italiana configurata; su Test `FLEET_EXTERNAL_LOOKUP_ENABLED=true` abilita VIN/NHTSA, mentre la targa risponde correttamente `Provider targa non configurato` finche' non viene inserito `FLEET_PLATE_API_URL`/`FLEET_PLATE_API_KEY`.

## 2026-05-16 14:10:00 - Correzione UX provider targa non configurato

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretta la pagina `Parco Macchine > Catalogo tecnico` per non mostrare come errore la mancanza del provider targa. La UI ora disabilita `Cerca e salva` quando il provider selezionato non e' pronto e mostra un messaggio informativo dedicato.  
**File coinvolti:** `frontend/src/components/fleet/FleetCatalogClientPage.tsx`, `directives/error_memory.md`, `directives/activity_log.md`.  
**Esito:** completato in Collaudo locale, pronto per Test.  
**Verifiche eseguite:** `npm run lint` senza errori, `npm run build` OK.  
**Note utili:** l'assenza di API key targa e' uno stato di configurazione, non un errore di caricamento; questa distinzione va mantenuta per tutti i provider esterni.

## 2026-05-16 14:30:00 - Predisposizione TuttoTarghe Free

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** adattato il provider targa al formato reale di TuttoTarghe (`POST /job/jobsync` con Bearer token e body `targhe/type`). Configurato il default per usare il solo job `tecnici`, adatto al piano Free per consumare pochi crediti durante i test. Migliorato il parser dei payload annidati per mappare marca/modello/allestimento/cilindrata/alimentazione/classi ambientali da risposte eterogenee.  
**File coinvolti:** `backend/app/core/config.py`, `backend/app/services/fleet_catalog.py`.  
**Esito:** completato in Collaudo locale, pronto per Test appena disponibile il token.  
**Verifiche eseguite:** `py_compile` backend OK.  
**Note utili:** su Test andranno impostati `FLEET_PLATE_PROVIDER=tuttotarghe`, `FLEET_PLATE_API_URL=https://api.tuttotarghe.it/job/jobsync`, `FLEET_PLATE_JOB_TYPES=tecnici` e poi `FLEET_PLATE_API_KEY=<token>`.

## 2026-05-16 14:55:00 - Import economico dati targa

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiunto metodo convenzionale economico per recuperare e inserire dati targa senza chiamate API: import CSV/paste da libretti, Excel, visure manuali o controlli convenzionali. L'import crea mezzo fisico, marca, modello, allestimento, scadenza assicurazione/revisione, record assicurativo e misura gomme default quando presenti.  
**File coinvolti:** `backend/app/schemas/fleet.py`, `backend/app/api/fleet/router.py`, `frontend/src/components/fleet/FleetCatalogClientPage.tsx`, hosting `smart-cv.it/test`, VPS `/opt/calabriaverde-test/backend`.  
**Esito:** completato su Collaudo e Test.  
**Verifiche eseguite:** `py_compile` backend OK, `npm run lint` senza errori, `npm run build` OK, deploy backend/frontend Test, smoke API autenticato `POST /api/fleet/catalog/import-plates` con targa fittizia OK, cleanup del dato di prova, pagina `https://smart-cv.it/test/fleet/catalogo/` `200`.  
**Note utili:** usare questo flusso per import massivi economici fino all'attivazione del token TuttoTarghe; l'API resta solo per integrazioni puntuali o aggiornamenti successivi.

## 2026-05-16 15:10:00 - Lookup targa conforme livello execution

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiunto `execution/lookup_targa.py` come adattatore locale per dati targa da fonti convenzionali o provider API autorizzati. Il modulo normalizza targa e campi tecnici da CSV, restituisce uno schema unico e non effettua scraping di portali protetti da CAPTCHA/anti-bot.  
**File coinvolti:** `execution/lookup_targa.py`, `directives/error_memory.md`, `directives/activity_log.md`.  
**Esito:** completato in Collaudo locale.  
**Verifiche eseguite:** da eseguire con CSV reale o fixture.  
**Note utili:** questo livello execution resta agganciabile al backend senza rischiare blocchi/rotture dovute a scraping non autorizzato.

## 2026-05-19 00:00:00 - Attivazione provider Targa.co.it/RegCheck

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** verificata la documentazione ufficiale Targa.co.it/RegCheck e sostituito il flusso TuttoTarghe/RapidAPI con provider `targa_co_it`, che usa lo username account come credenziale API. Aggiunto parsing XML/JSON ASMX per `/CheckItaly`, configurazione `FLEET_PLATE_USERNAME` e stato provider coerente nella UI/API.  
**File coinvolti:** `backend/app/core/config.py`, `backend/app/services/fleet_catalog.py`, `.env.example`, `directives/error_memory.md`, `directives/activity_log.md`.  
**Esito:** completato in Collaudo locale; da promuovere su Test impostando `FLEET_PLATE_PROVIDER=targa_co_it`, `FLEET_PLATE_USERNAME=<username>`, `FLEET_EXTERNAL_LOOKUP_ENABLED=true`.  
**Verifiche eseguite:** credito RegCheck controllato senza lookup targa: 110 crediti disponibili.  
**Note utili:** non esiste API key separata per questo provider: username per API, password solo per dashboard.

## 2026-05-19 00:20:00 - Correzione endpoint RegCheck e gestione API

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretto endpoint targa da `bespokeapi.asmx` a `https://www.regcheck.org.uk/api/reg.asmx`, aggiunto parser per cilindrata testuale italiana, introdotto router amministrativo `/admin/integrations/fleet-plate` e sostituita la pagina provvisoria `Amministrazione > Configurazione` con una form reale per gestire provider, endpoint, username e stato lookup.  
**File coinvolti:** `backend/main.py`, `backend/app/api/admin_integrations/router.py`, `backend/app/core/config.py`, `backend/app/services/fleet_catalog.py`, `frontend/src/app/(dashboard)/admin/settings/page.tsx`, `.env.example`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` OK, `npm run lint` senza errori bloccanti, `npm run build` OK, endpoint admin integrazioni OK, pagina `https://smart-cv.it/test/admin/settings/` 200, lookup gratuito `BN071VN` trovato e salvato come PEUGEOT 206 senza consumo crediti (`110 -> 110`).  
**Note utili:** usare sempre la targa campione gratuita `BN071VN` per smoke test provider Italia prima di provare targhe reali.

## 2026-05-19 00:35:00 - Timeout lookup targa e alias RSC statici

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** adeguato il provider al percorso diretto indicato dal sito (`https://www.targa.co.it/api/reg.asmx`), aumentato il timeout lookup a 55 secondi e reso configurabile in Amministrazione. Aggiunto script post-build per generare alias RSC statici puntati (`__next...fleet.catalogo.txt`) richiesti da Next 16 sull'hosting statico.  
**File coinvolti:** `backend/app/core/config.py`, `backend/app/services/fleet_catalog.py`, `backend/app/api/admin_integrations/router.py`, `frontend/package.json`, `frontend/scripts/create-rsc-aliases.mjs`, `frontend/src/app/(dashboard)/admin/settings/page.tsx`, `.env.example`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` OK, `npm run lint` senza errori bloccanti, `npm run build` OK, file RSC puntati online `200`, lookup campione `BN071VN` `found`, endpoint `https://www.targa.co.it/api/reg.asmx`, timeout `55`, crediti invariati `110 -> 110`.  
**Note utili:** se ricompaiono 504 su file `__next...txt`, verificare che lo script `create-rsc-aliases.mjs` sia stato eseguito dopo la build e prima del deploy.

## 2026-05-19 10:20:00 - Riconoscimento mezzo da tessera

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiunto pulsante `Riconosci mezzo` dentro ogni tessera dell'anagrafica mezzi. Il flusso apre una modale, chiede conferma, mostra contatore durante l'estrazione dati da targa, espone i dati riconosciuti e aggiorna il mezzo solo dopo conferma. Aggiunto endpoint backend `/fleet/vehicles/{vehicle_id}/recognition/apply` per applicare l'allestimento riconosciuto al mezzo esistente e lasciare nota nello storico testuale del mezzo.  
**File coinvolti:** `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` OK, `npm run lint` senza errori bloccanti, `npm run build` OK, backend Test `active`, pagina `https://smart-cv.it/test/fleet/anagrafica/` `200`, smoke API lista mezzi OK.  
**Note utili:** il riconoscimento su targa reale consuma credito solo dopo conferma utente nel modale; evitare smoke test con targhe reali non autorizzate.

## 2026-05-19 10:30:00 - Storico assicurazioni e revisioni nel riconoscimento mezzo

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** esteso il riconoscimento mezzo per recuperare anche l'assicurazione corrente dal provider Targa.co.it/RegCheck e per mostrare nella modale tutti gli storici assicurazioni/revisioni gia' presenti nel gestionale. Alla conferma dell'aggiornamento, se il provider restituisce compagnia e scadenza, viene creato un nuovo record assicurativo corrente preservando i precedenti come storico.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` OK, `npm run lint` senza errori bloccanti, `npm run build` OK, backend Test `active`, pagina `https://smart-cv.it/test/fleet/anagrafica/` `200`.  
**Note utili:** l'API documenta assicurazione corrente italiana, non uno storico remoto completo; lo storico completo viene mantenuto dal gestionale a ogni aggiornamento/riconoscimento.

## 2026-05-19 11:00:00 - Audit API e ordinamento operativo mezzi

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** esteso il riconoscimento mezzo con log API visibili in modale: lookup tecnico, lookup assicurativo, raw payload, esito e messaggi di errore. L'applicazione dell'aggiornamento crea un log `vehicle_recognition_apply` con esito salvataggio tecnico/assicurativo. La lista mezzi ora espone stato assicurazione/revisione e viene ordinata per priorita': completi attivi, parziali attivi, scaduti/mancanti, solo targa/dati minimi.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` OK, `npm run lint` senza errori bloccanti, `npm run build` OK, backend Test `active`, lista mezzi autenticata OK con campi `compliance_status`, `insurance_status`, `revision_status` e ordinamento corretto.  
**Note utili:** se il provider non restituisce assicurazione o revisione, la modale lo evidenzia esplicitamente; revisione remota italiana non disponibile nel provider attuale.

## 2026-05-19 11:20:00 - Pagina principale Parco Macchine unificata

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiornata la pagina principale `Parco Macchine` (`/fleet/`) per mostrare una sola lista operativa dei mezzi, ordinata dalla API per priorita': mezzi con assicurazione e revisione attive, mezzi parziali, mezzi con dati ma coperture/revisioni scadute o mancanti, mezzi con soli dati minimi. Ogni riga mostra targa, marca/modello, stato dati, assicurazione, revisione, assegnazione, sede, km e sinistri aperti; il click apre il dettaglio del mezzo con storico e operazioni.  
**File coinvolti:** `frontend/src/components/fleet/FleetDashboardClientPage.tsx`, hosting `smart-cv.it/test`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `npm run lint` senza errori bloccanti, `npm run build` OK, deploy statico Test OK, `https://smart-cv.it/test/fleet/` `200`, smoke API autenticato `/api/fleet/vehicles?page=1&page_size=5` OK con ordinamento e campi `compliance_status`, `insurance_status`, `revision_status`.  
**Note utili:** per la vista principale del parco macchine usare sempre `/fleet/`; `/fleet/anagrafica/` resta la pagina di gestione operativa con riconoscimento da tessera e azioni anagrafiche.

## 2026-05-19 11:40:00 - Correzione Gateway Timeout su apply riconoscimento targa

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretto il flusso di applicazione del riconoscimento targa: l'endpoint `/fleet/vehicles/{id}/recognition/apply` non richiama piu' il provider esterno assicurativo, ma usa l'ultimo lookup gia' registrato in `vehicle_external_lookups`. Ridotto inoltre il timeout massimo del controllo assicurativo accessorio a 15 secondi, lasciando il log dell'errore senza bloccare il flusso principale.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, VPS Test `/opt/calabriaverde-test/backend`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` locale e remoto OK, servizio `calabriaverde-test` `active`, smoke autenticato `POST /api/fleet/vehicles/{id}/recognition/apply` su Test completato in circa 120 ms.  
**Note utili:** il riconoscimento puo' ancora registrare un errore se il provider esterno non risponde, ma il salvataggio non deve piu' generare `Gateway Timeout` per una seconda chiamata duplicata.

## 2026-05-19 15:30:00 - Correzione routing Test e cache lookup targa/assicurazione

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretto il routing client che usciva da `/test` quando la navigazione avveniva con `window.location.href`, aggiungendo `withBrowserBasePath(...)` e aggiornando la pagina principale fleet. Corretti anche i link grezzi rimasti nelle tessere dell'anagrafica mezzi. Aggiunta cache tecnica e assicurativa dei lookup riusciti: se un riconoscimento targa e' gia' registrato, il sistema riusa `vehicle_external_lookups` senza nuova chiamata al provider.  
**File coinvolti:** `frontend/src/lib/app-path.ts`, `frontend/src/components/fleet/FleetDashboardClientPage.tsx`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `npm run lint` senza errori bloccanti, `npm run build` OK, deploy frontend Test OK, `https://smart-cv.it/test/fleet/dettaglio/?id=2` `200`, backend Test `active`, smoke riconoscimento cache su mezzo `ES760CH` completato in circa 126 ms con crediti invariati `100 -> 100`.  
**Note utili:** per navigazioni manuali browser usare `withBrowserBasePath`; per `<Link>`/`router.push` usare `withAppBasePath`. I lookup gia' salvati non devono consumare nuovi crediti.

## 2026-05-19 16:20:00 - Persistenza cache assicurativa e recupero ES766CH

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretta la mancata persistenza dei log assicurativi nel riconoscimento mezzo: dopo `lookup_italy_insurance(...)` ora viene eseguito commit prima di leggere i log della modale, cosi' la cache resta disponibile alle richieste successive. Applicato manualmente l'aggiornamento tecnico gia' recuperato per il mezzo `ES766CH` usando l'allestimento locale `D-MAX II (TFR, TFS)`.  
**File coinvolti:** `backend/app/api/fleet/router.py`, VPS Test `/opt/calabriaverde-test/backend`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` OK, backend Test `active`, seconda chiamata riconoscimento `ES766CH` da cache in circa 107 ms con crediti invariati `94 -> 94`, apply `ES766CH` OK con marca `ISUZU`, modello `D-MAX II (TFR, TFS)`, alimentazione `Diesel`, anno `2012`.  
**Note utili:** il provider ha restituito assicurazione `empty` per `ES766CH`, quindi non e' stata salvata copertura; questo va mostrato come dato non reperito, non come errore applicativo.

## 2026-05-19 16:45:00 - Prontuario Openapi e provider Automotive

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / documentazione sistema  
**Azione svolta:** verificata la documentazione ufficiale Openapi Automotive e OAuth. Aggiunto provider backend `openapi_automotive/openapi_sandbox` con endpoint `IT-car` e `IT-insurance`, parsing dei dati tecnici e gestione Bearer token. Aggiornata la pagina configurazione con i provider Openapi e aggiunta sezione `Amministrazione > Documentazione` con prontuario operativo. Creata cartella `directives/documentation` con documenti markdown su API key, parco macchine, ambienti, registro errori/cache, risorse umane e strumenti.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/admin_integrations/router.py`, `frontend/src/app/(dashboard)/admin/documentation/page.tsx`, `frontend/src/app/(dashboard)/admin/settings/page.tsx`, `frontend/src/app/(dashboard)/admin/page.tsx`, `frontend/src/components/layout/Header.tsx`, `directives/documentation/*`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** consultazione fonti ufficiali Openapi; prova sandbox con stringa API visibile in console: risposta `Wrong Token`, quindi non e' Bearer token; prova OAuth Basic con username non email: `Wrong Auth Data Provided`; `py_compile` OK, `npm run lint` senza errori bloccanti, `npm run build` OK, backend Test `active`, `https://smart-cv.it/test/admin/documentation/` `200`, configurazione integrazioni API OK.  
**Note utili:** per attivare Openapi serve generare o fornire il Bearer token OAuth dalla console oppure fornire email account Openapi + API key per generarlo via `POST https://oauth.openapi.it/token`. Non usare la API key account direttamente sugli endpoint Automotive.

## 2026-05-19 17:35:00 - Consolidamento metodo Targa.co.it/RegCheck

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / documentazione sistema  
**Azione svolta:** letta la documentazione Targa.co.it/RegCheck e bloccato il metodo operativo: `CheckItaly` per dati tecnici, `CheckInsuranceStatusItaly` per assicurazione corrente, username come credenziale, nessuna revisione italiana disponibile dal provider. Corretto il parser cilindrata per valori in litri e fasce cc, aggiunto salvataggio VIN se presente e registrazione esplicita dell'esito revisioni non salvate da provider.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `frontend/src/app/(dashboard)/admin/documentation/page.tsx`, `directives/documentation/api-key-provider-targhe.md`, `directives/documentation/parco-macchine.md`, `directives/error_memory.md`.  
**Esito:** completato in Collaudo locale; da promuovere su Test dopo conferma deploy.  
**Verifiche eseguite:** saldo RegCheck letto prima/dopo, smoke con targa documentata `BN071VN` su `CheckItaly` e `CheckInsuranceStatusItaly`, `py_compile` backend OK, parser cilindrata OK, build frontend OK.  
**Note utili:** il saldo e' passato da 92 a 91 dopo gli smoke test, quindi anche la targa campione va trattata come potenzialmente a pagamento; misurare sempre saldo prima/dopo e non chiamare provider da `recognition/apply`.

## 2026-05-19 18:05:00 - Chiarezza salvataggio assicurazione e pulizia codici modello

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** corretto il flusso `recognition/apply` per salvare almeno la compagnia assicurativa sulla scheda mezzo quando il provider la restituisce senza scadenza valida; lo storico copertura viene creato solo con scadenza valida. Aggiunto messaggio di esito al frontend e pulizia dei codici piattaforma RegCheck/Isuzu tra parentesi dal modello operativo del mezzo.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `directives/documentation/api-key-provider-targhe.md`, `directives/error_memory.md`.  
**Esito:** completato in Collaudo locale; da promuovere su Test.  
**Verifiche eseguite:** `py_compile` backend OK, test pulizia modello `D-MAX II (TFR, TFS) -> D-MAX II` OK, build frontend OK dopo correzione duplicato variabile.  
**Note utili:** `TFR/TFS` sono codici tecnici piattaforma/telaio Isuzu, non trattamento fine rapporto/servizio; non devono comparire come nome modello operativo.

## 2026-05-19 18:25:00 - Gestione HTTP 500 Targa.co.it come esito senza dati

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** aggiornato il provider Targa.co.it/RegCheck: se `CheckItaly` restituisce HTTP 500 viene registrato come esito `empty` cacheabile, con messaggio chiaro su targa non trovata/non coperta/dato remoto non disponibile. La modale senza allestimento ora mostra anche i log API, cosi' l'utente vede cosa e' successo senza rilanciare la chiamata.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `directives/documentation/api-key-provider-targhe.md`, `directives/error_memory.md`.  
**Esito:** completato in Collaudo locale; da promuovere su Test.  
**Verifiche eseguite:** `py_compile` backend OK, test helper modello/cilindrata OK, build frontend OK.  
**Note utili:** non testare ES765CH/ES769CH con chiamate reali senza consenso esplicito, perche' ogni lookup puo' scalare credito.

## 2026-05-19 18:45:00 - Persistenza e visualizzazione completa payload targa

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** sincronizzato `vehicle_trims.raw_payload` anche per allestimenti gia' esistenti, esposto `raw_payload` nelle risposte API e aggiunta visualizzazione dei campi completi recuperati dal provider nella modale riconoscimento e nel dettaglio mezzo. Aggiunta pulizia dei nomi modello gia' presenti in cache.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `directives/documentation/api-key-provider-targhe.md`.  
**Esito:** completato in Collaudo locale; da promuovere su Test.  
**Verifiche eseguite:** `py_compile` backend OK, test helper modello/cilindrata OK, build frontend OK.  
**Note utili:** un credito targa deve alimentare sia campi strutturati sia payload completo consultabile; non perdere dati non ancora mappati in colonne dedicate.

## 2026-05-19 18:06:00 - Promozione Test correzione riconoscimento targa

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine  
**Azione svolta:** promosso su Test il backend e il frontend del flusso riconoscimento mezzo. Il backend ora salva compagnia assicurativa e storico copertura quando il provider restituisce scadenza valida, espone l'esito del salvataggio, sincronizza `raw_payload` anche per allestimenti gia' esistenti e consente `force_refresh=true` solo da azione esplicita. Il frontend mostra quando il dato arriva da cache, permette "Riesegui dal provider" e visualizza i campi completi recuperati dal provider.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` backend locale OK; build frontend con `NEXT_PUBLIC_BASE_PATH=/test` OK; upload backend Test OK; `systemctl restart calabriaverde-test` OK e servizio `active`; upload frontend Test OK; `https://smart-cv.it/api/health` 200; login API Test OK; lista mezzi API Test OK; file pagina dettaglio Test presenti su hosting.  
**Note utili:** non sono state effettuate nuove chiamate reali al provider targa durante questa verifica, per evitare consumo crediti. Le chiamate online a singole pagine statiche hanno mostrato qualche rifiuto connessione intermittente da hosting, ma `/test/fleet/` e API risultano raggiungibili. Dopo il deploy e' stata eseguita anche una normalizzazione DB non pagante sui modelli gia' salvati: rimossi codici tra parentesi tipo `TFR, TFS` da 8 record tra modelli e mezzi.

## 2026-05-19 18:20:00 - Tabella snapshot dati provider targa

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / conservazione dati API  
**Azione svolta:** aggiunta tabella dedicata `vehicle_plate_provider_snapshots` per conservare ogni ciclo di riconoscimento targa in un record unico: payload tecnico completo, payload assicurativo completo, payload aggregato, campi estratti normalizzati, stato, errori, mezzo, allestimento e riferimenti ai log API originali. Aggiornata la procedura `recognition` per creare lo snapshot dopo il lookup tecnico/assicurativo, senza richiamare il provider in fase di applicazione dati.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/013_fleet_plate_provider_snapshots.py`, `directives/documentation/api-key-provider-targhe.md`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` backend OK; migrazione Alembic `012 -> 013` applicata su Test; backend Test riavviato e `active`; `https://smart-cv.it/api/health` 200; verifica SQLAlchemy sul server: tabella `vehicle_plate_provider_snapshots` esistente con colonne attese.  
**Note utili:** la tabella non consuma crediti: registra solo dati gia' ricevuti dal provider o dalla cache locale.

## 2026-05-19 18:42:00 - Replica dati Isuzu da singolo lookup targa

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / gestione pacchetti omogenei  
**Azione svolta:** aggiunti allo storico assicurazioni i campi `data_scadenza_provider`, `tolleranza_giorni` e `provider_payload`, cosi' la data restituita dal provider resta conservata ma lo scadenziario usa la data operativa al netto della tolleranza. Eseguito un lookup reale sul campione Isuzu `ES762CH` e replicati dati tecnici/allestimento e assicurazione sui 20 mezzi Isuzu censiti nel DB Test. Non e' stato copiato il telaio/VIN perche' e' dato univoco del singolo mezzo.  
**File coinvolti:** `backend/app/models/fleet.py`, `backend/app/schemas/fleet.py`, `backend/app/api/fleet/router.py`, `backend/migrations/versions/014_fleet_insurance_provider_fields.py`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` backend OK; migrazione Alembic `013 -> 014` applicata su Test; backend Test `active`; script campione: `sample=ES762CH updated_isuzu=20 company=HDI ASSICURAZIONI provider_due=2026-06-06 operational_due=2026-05-22`; API lista mezzi Test mostra 20 Isuzu con scadenza `2026-05-22`; DB: `snapshots=20`, `replicated_snapshots=19`, `current_replicated_insurance=20`.  
**Note utili:** per pacchetti futuri usare lo stesso schema: una targa campione alimenta lo snapshot completo, poi la replica interna aggiorna i mezzi del gruppo omogeneo senza ulteriori chiamate provider.

## 2026-05-19 19:10:00 - Sanitizzazione payload condivisi e fix placeholder dettaglio mezzo

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / qualita' dati provider  
**Azione svolta:** corretto il salvataggio dei dati tecnici provider separando dati condivisi di allestimento da dati univoci del mezzo. `vehicle_trims.raw_payload` viene ora sanitizzato prima del salvataggio e non conserva VIN, targa, registration number o campi equivalenti; il payload completo resta nello snapshot specifico del lookup. Pulito il frontend dettaglio mezzo per usare placeholder ASCII `-` al posto del trattino lungo Unicode che su alcuni ambienti veniva mostrato come mojibake `â€”`.  
**File coinvolti:** `backend/app/services/fleet_catalog.py`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `directives/documentation/api-key-provider-targhe.md`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** build frontend Test OK; backend Test riavviato e `active`; sanitizzazione DB Test eseguita su payload condivisi e snapshot replicati: `sanitized=20`; nessuna nuova chiamata reale al provider targa.  
**Note utili:** il VIN e' un dato univoco del veicolo fisico e deve essere estratto o inserito per ogni targa/mezzo. Non va replicato tra mezzi uguali; la replica puo' riguardare solo dati comuni di modello/allestimento e coperture assicurative aziendali omogenee.

## 2026-05-19 19:25:00 - Etichette provider e pulizia riferimenti replica

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / qualita' scheda mezzo  
**Azione svolta:** normalizzate le etichette dei campi provider in italiano tecnico con helper frontend comune, riusato nel dettaglio mezzo e nella modale di riconoscimento. Rimossi dal DB Test i riferimenti operativi alla replica: note mezzo ridotte all'ultima nota, note assicurative di replica azzerate, metadati `replicated_*` rimossi dagli snapshot e stati snapshot riportati a `captured`.  
**File coinvolti:** `frontend/src/lib/provider-payload.ts`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** build frontend Test OK; upload frontend Test OK; API health 200; DB Test: `vehicle_notes_multiline=0`, `insurance_replica_notes=0`, `snapshot_status_replicated=0`; nessuna nuova chiamata al provider targa.  
**Note utili:** la pagina frontend ha mostrato un rifiuto connessione intermittente su alcune richieste `HEAD`, ma `/test/fleet/` ha risposto 200 dopo retry; l'API e' rimasta online.

## 2026-05-19 19:35:00 - Copertura assicurativa con tolleranza e pacchetto Isuzu neutro

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / scadenziario assicurazioni  
**Azione svolta:** aggiunta funzione backend `insurance_coverage_until` per valorizzare sempre `assicurazione_copertura`: usa `copertura_al` se inserita, altrimenti la data provider, altrimenti `data_scadenza + tolleranza_giorni`. Puliti sul DB Test i 20 record assicurativi Isuzu che riportavano `Pacchetto Isuzu replicato da ES762CH`, sostituiti con `Convenzione flotta Isuzu`; aggiornata la copertura fino al 2026-06-06 per i mezzi coinvolti.  
**File coinvolti:** `backend/app/api/fleet/router.py`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` backend OK; backend Test riavviato e `active`; API health 200; DB Test: `bad_package_rows=0`, campioni ES779CH/ES778CH/ES760CH con scadenza operativa `2026-05-22` e copertura fino al `2026-06-06`.  
**Note utili:** nessuna chiamata al provider targa; intervento solo su logica backend e dati gia' presenti.

## 2026-05-19 19:48:00 - Rimozione pacchetto assicurativo non API e stato copertura

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / chiarezza coperture assicurative  
**Azione svolta:** rimossa dalla visualizzazione della scheda mezzo la riga `Pacchetto`, perche' non proveniente dal provider targa. Rinominato lo stato assicurativo da `Corrente/Storico` a `Copertura attuale/Copertura storica`. Azzerati su Test i valori `package_name` residui dei record Isuzu.  
**File coinvolti:** `frontend/src/components/fleet/FleetDetailClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** build frontend Test OK; upload frontend Test OK; API health 200; DB Test: `isuzu_package_rows=0`, `non_empty_package_rows=0`.  
**Note utili:** nessuna chiamata al provider targa; la compagnia e le scadenze restano i dati utili provenienti/salvati dal lookup.

## 2026-05-19 20:05:00 - Dettaglio mezzo: coperture, stato operativo e km

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / scheda mezzo operativa  
**Azione svolta:** semplificata la sezione `Coperture assicurative` lasciando solo compagnia, numero polizza, scadenza assicurazione e copertura fino al; rimossa la lista intermedia duplicata delle coperture. Uniformato il box `Dati tecnici provider` in una sola griglia con etichette coerenti. Sostituito lo stato generico del mezzo con uno stato operativo calcolato da assicurazione e revisione: mancante, scaduta, in scadenza o ok per ciascuna delle due voci. Aggiunto pulsante `Aggiorna km` nel dettaglio mezzo e endpoint backend `PATCH /fleet/vehicles/{id}/km` con salvataggio nota e log gestionale.  
**File coinvolti:** `backend/app/api/fleet/router.py`, `backend/app/schemas/fleet.py`, `frontend/src/components/fleet/FleetDetailClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** `py_compile` backend OK; build frontend Test OK; upload frontend Test OK; controllo stringhe obsolete OK (`Compagnia attuale`, `Polizza attuale`, `Copertura attuale`, `Copertura storica` assenti dal dettaglio mezzo).  
**Note utili:** nessuna chiamata al provider targa e nessun consumo token API; l'aggiornamento km e' manuale e tracciato nello storico tecnico/log lookup gestionale.

## 2026-05-19 20:30:00 - Pulizia fascicolo mezzo e scheda catalogo provider

**Agente:** Codex orchestrazione principale  
**Obiettivo collegato:** OBJ-007 - Attivazione Parco Macchine / dettaglio e catalogo tecnico  
**Azione svolta:** eliminata dal dettaglio mezzo la descrizione sotto il titolo `Fascicolo mezzo` e rimossi dalla riga compatta dell'elenco operazioni i dati ripetuti a destra. Nel catalogo tecnico, il click su un allestimento apre ora una scheda tecnica estesa con dati strutturati, pneumatici e tutti i campi salvati nel payload provider normalizzati con etichette italiane.  
**File coinvolti:** `frontend/src/components/fleet/FleetDetailClientPage.tsx`, `frontend/src/components/fleet/FleetCatalogClientPage.tsx`.  
**Esito:** completato e promosso su Test.  
**Verifiche eseguite:** build frontend Test OK; upload frontend Test OK; API health 200; verifica SSH hosting: `fleet/catalogo/index.html` e `fleet/dettaglio/index.html` aggiornati alle 23:28 del server.  
**Note utili:** nessuna chiamata al provider targa e nessun consumo token API. I campi come kW, porte, posti, immagini, classe Euro, cambio, colore, polizza o revisione vengono esposti se presenti nel payload salvato; Targa.co.it/RegCheck finora ha restituito dati tecnici e assicurazione, mentre la revisione resta normalmente da storico locale/provider dedicato.

## 2026-05-20 09:10:00 - Avvio design a oggetti e tessere

**Agente:** Codex orchestrazione principale
**Obiettivo collegato:** UX-001 - Rimodulazione grafica a oggetti collegabili
**Azione svolta:** creato il componente comune `ObjectCard` per rappresentare ogni elemento primario come oggetto con chiave, tipo, stato, proprieta, relazioni, azioni e nota permessi. Applicato il pattern ad anagrafica mezzi e anagrafica personale interna/esterna, sostituendo la resa tabellare HR con tessere coerenti e predisposte al drag and drop. Documentato il modello grafico in `directives/documentation/object-card-design.md`.
**File coinvolti:** `frontend/src/components/common/ObjectCard.tsx`, `frontend/src/components/fleet/FleetRegistryClientPage.tsx`, `frontend/src/components/hr/HrRegistryPage.tsx`, `directives/documentation/object-card-design.md`.
**Esito:** completato in collaudo locale e promosso su Test.
**Verifiche eseguite:** build frontend OK (`npm.cmd run build`); build frontend Test OK con `NEXT_PUBLIC_BASE_PATH=/test`; upload frontend Test OK; API health 200; verifica SSH hosting su `fleet/index.html`, `fleet/anagrafica/index.html`, `hr/interna/index.html`, `hr/esterna/index.html`.
**Note utili:** la tessera mostra la visibilita come concetto UX, ma la sicurezza reale deve restare lato backend con filtro per ruoli, ambito organizzativo, modulo e privilegi puntuali.

## 2026-05-20 15:45:00 - Pulizia grafica, menu ed etichette

**Agente:** Codex orchestrazione principale
**Obiettivo collegato:** UX-002 - Semplificazione interfaccia e accessibilita operativa
**Azione svolta:** riorganizzato il menu laterale in Operatività, Supporto e Sistema; rinominate le voci principali in Persone, Mezzi, Strumenti e Amministrazione; semplificate le etichette operative in HR e Parco Macchine; migliorati `ObjectCard`, `Button`, `MetricCard`, `SectionLead` e layout dashboard per tessere piu leggibili e azioni piu accessibili.
**File coinvolti:** `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/components/layout/Header.tsx`, `frontend/src/components/common/ObjectCard.tsx`, `frontend/src/components/common/MetricCard.tsx`, `frontend/src/components/common/SectionLead.tsx`, `frontend/src/components/ui/Button.tsx`, pagine HR/Fleet/Admin.
**Esito:** completato in collaudo locale e promosso su Test.
**Verifiche eseguite:** build frontend OK; build frontend Test OK con `NEXT_PUBLIC_BASE_PATH=/test`; upload frontend Test OK; API health 200; pagina `fleet` 200; verifica SSH hosting su `dashboard/index.html`, `hr/interna/index.html`, `fleet/index.html`, `admin/index.html`.
**Note utili:** mantenuta invariata la logica dati; intervento limitato a navigazione, microcopy, leggibilita e accessibilita.
