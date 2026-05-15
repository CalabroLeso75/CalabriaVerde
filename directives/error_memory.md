# Memoria locale degli errori

Questo file conserva gli errori rilevanti incontrati nel progetto e le relative soluzioni.

Prima di cercare soluzioni esterne, consultare questo file.

---

## Template nuovo errore

```markdown
## ERR-001 - Titolo sintetico dell'errore

**Data:** data e ora  
**Contesto:** dove si è verificato l'errore  
**File coinvolti:** elenco file  
**Messaggio di errore:** messaggio essenziale  
**Causa individuata:** spiegazione sintetica  
**Correzione applicata:** cosa è stato modificato  
**Prevenzione futura:** cosa controllare per evitare che si ripeta  
**Stato:** risolto / parziale / da verificare  
```

---

## Errori registrati

Nessun errore registrato.


## 2026-05-10 18:09:39 - Aggiornamento error

**Contesto:** ripresa Fase 0 backend/frontend. **Errore:** DEBUG=release non parseabile come booleano da Pydantic; mapper SQLAlchemy fragili per ordine import; Alembic non trovava il package app; next build falliva senza rete per next/font Google. **Causa individuata:** valori env storici, relazioni string-based senza registrazione completa modelli, PYTHONPATH non inizializzato in migrations/env.py, rete sandbox bloccata. **Correzione applicata:** validator DEBUG, import/relazioni robuste con backref, path backend aggiunto in migrations/env.py, build rieseguita con accesso rete autorizzato. **Prevenzione futura:** verificare import main + configure_mappers, alembic upgrade head --sql e build frontend dopo modifiche strutturali.


## 2026-05-10 19:22:58 - Aggiornamento error

**Contesto:** pubblicazione smart-cv.it/Prod. **Errore:** 404 online dopo primo upload. **Causa individuata:** i file erano stati caricati in /Gestionale/Prod, ma il sito Laravel/hosting serve probabilmente da /Gestionale/public. **Correzione applicata:** creata/verificata /Gestionale/public/Prod e ricaricata la build statica. **Prevenzione futura:** prima del deploy su hosting verificare sempre document root effettiva e presenza di public/ nei progetti Laravel o hosting PHP.


## 2026-05-10 21:28:33 - Aggiornamento error

**Contesto:** preparazione deploy provvisorio. **Errore/rischio:** API utenti/pending prive di controllo ruolo effettivo; frontend statico aveva path/API potenzialmente non coerenti con /Prod; env backend fragile e .env.example non allineato ai nomi reali; presenza locale di file sensibili/artefatti ignorati. **Correzione applicata:** aggiunto require_admin_user sulle route utenti; API fallback non punta piu' a localhost; basePath parametrico; env_file backend robusto con extra ignore; .env.example riallineato; verificato che file sensibili/artefatti risultano ignorati e non tracciati. **Prevenzione futura:** prima del backend pubblico verificare ruoli, segreti reali, CORS, DB e secret scan; non committare .env/chiavi/out/node_modules/venv.


## 2026-05-11 08:48:51 - Aggiornamento error

**Contesto:** analisi collaudo backend/frontend con agente dedicato. **Errore/rischio:** collaudo tecnico parziale non ancora promuovibile a TEST stabile. **Elementi bloccanti:** RBAC HR troppo permissivo, admin pending ancora mock, fascicolo dipendente linkato ma route assente nell'export statico, build dipendente da Google Fonts/rete, dati professionali registrazione non persistiti, route sidebar/admin mancanti, backend pubblico non ancora validato end-to-end. **Correzione prevista:** chiudere checklist collaudo prima della promozione stabile a TEST/produzione. **Prevenzione futura:** ogni promozione ambiente richiede checklist e aggiornamento registri.


## 2026-05-11 14:02:04 - Aggiornamento error

**Contesto:** preparazione test anagrafica collaudo. **Errore/rischio:** DB locale aveva dati importati ma schema parzialmente legacy rispetto ai modelli Python; users usava hashed_password/status active, roles/organizations avevano nomi colonna legacy; frontend dev con output export dava 500 su next/image ottimizzata. **Causa individuata:** precedenti script/import avevano creato schema operativo non piu' allineato alla migration/modelli correnti; Next static export richiede immagini non ottimizzate. **Correzione applicata:** creato align_collaudo_schema.py con dry-run/apply e backup tabelle piccole; aggiunta configurazione images.unoptimized=true; verificati API e frontend. **Prevenzione futura:** prima dei test end-to-end eseguire dry-run import e controllo schema collaudo; mantenere report in .tmp/project_completion/collaudo/.


## 2026-05-11 18:01:24 - Aggiornamento error

Contesto: pagina amministrativa /admin/contracts in collaudo locale. Errore: il browser mostrava un blocco CORS su GET /api/admin/contracts/types, ma la causa reale era una risposta backend 500. Causa individuata: il database gestionale_cv era fermo ad Alembic 001_initial_schema e mancava la tabella contract_type_definitions introdotta dalla migration 003_admin_contract_types. Correzione applicata: verificato il log backend, applicate le migration 002 e 003, creato seed deterministico dei contratti base, riavviato backend locale e verificata la route con login admin. Prevenzione futura: quando una nuova sezione admin dipende da tabelle aggiuntive, controllare sempre alembic current e backend.err.log prima di trattare la console browser come problema CORS. Stato: risolto.


## 2026-05-12 20:44:00 - Aggiornamento error

Contesto: provisioning backend FastAPI su VPS per l'ambiente Test. Errore/rischio: il servizio MariaDB del VPS risultava attivo ma non ascoltava sulla porta standard 3306; i tentativi di migration fallivano con Connection refused su localhost:3306. Causa individuata: l'istanza MariaDB del VPS e' configurata per ascoltare sulla porta 8443. Correzione applicata: creazione database dedicato gestionale_cv_test e utente applicativo dedicato, aggiornamento env del backend Test verso DB_PORT=8443, migration rieseguite con successo. Prevenzione futura: sui server esterni verificare sempre systemctl status, socket/porta reale e ss -ltnp prima di assumere la porta 3306 nei runbook.


## 2026-05-12 20:50:00 - Aggiornamento error

Contesto: import del bundle dati di collaudo nel database Test su VPS. Errore/rischio: il primo import falliva per colonne legacy non presenti nella migration e per codici organizzazione duplicati (ACV) nel database locale. Causa individuata: il collaudo locale contiene alcune colonne e duplicazioni residue da allineamenti precedenti dello schema. Correzione applicata: import_test_bundle.py ora filtra solo le colonne esistenti nel DB di destinazione e normalizza i codici organizzazione duplicati mantenendo gli ID referenziati dai dipendenti. Prevenzione futura: per promozioni tra ambienti usare import deterministici che facciano intersection delle colonne e non assumano un dump 1:1 di schemi non perfettamente omogenei.


## 2026-05-12 23:46:00 - Aggiornamento error

Contesto: import anagrafica personale esterno da sorgente legacy verso Collaudo e Test. Errore/rischio: il database locale azienda_local, usato per l'anagrafica interna, non contiene record esterni; inoltre una prima lettura parallela del bundle VPS mostrava JSON incompleto durante il trasferimento e il target collaudo ha uno schema organizations non identico ai modelli piu' recenti. Causa individuata: la sorgente reale del personale esterno e' il database legacy gestionale_cv sul VPS; l'upload del bundle e il suo import non possono essere eseguiti in parallelo senza rischio di file parziali; la tabella organizations locale non espone tutte le colonne moderne, ad esempio pec. Correzione applicata: creati export_personale_esterno_legacy.py e import_personale_esterno_bundle.py con bundle JSON deterministico, grant di sola lettura sulla base legacy, import seriale dopo upload completato e filtro dinamico delle colonne presenti nel target prima di insert/update. Prevenzione futura: per ogni nuova anagrafica verificare prima l'effettiva sorgente dati, evitare import paralleli su file ancora in trasferimento e usare sempre script che intersechino le colonne reali del database di destinazione. Stato: risolto con 120 esterni importati e 48 scarti legittimi per codice fiscale mancante nella sorgente.


## 2026-05-13 01:22:00 - Aggiornamento error

Contesto: attivazione locale del modulo Geografia in collaudo. Errore/rischio: il primo tentativo di migration Alembic puntava ancora a un host remoto definito nel file .env invece del database locale, mentre l'import geografico provava a scrivere su tabelle non ancora create. Causa individuata: l'ambiente locale eredita variabili DB storiche dal progetto e Alembic legge la configurazione centralizzata, quindi senza override esplicito non usa automaticamente localhost/gestionale_cv. Correzione applicata: rieseguite le migration con override esplicito di DB_HOST, DB_PORT, DB_NAME, DB_USER e LOCAL_DB_NO_PASSWORD verso il database locale; import geografico rilanciato solo dopo la creazione delle tabelle. Prevenzione futura: per ogni nuova migration in collaudo verificare prima quale database sta leggendo Alembic e forzare l'ambiente locale quando il file .env contiene host remoti o ambienti di test condivisi. Stato: risolto.

Contesto: promozione del modulo Geografia dall'ambiente Collaudo a Test su VPS. Errore/rischio: la migration 004 sul server andava a buon fine, ma il successivo import del bundle falliva con Connection refused su localhost:3306 nonostante il backend Test fosse gia' funzionante. Causa individuata: import_test_bundle.py usa di default localhost:3306 e non eredita automaticamente la configurazione del servizio systemd; sul VPS il database Test ascolta sulla porta 8443 definita nel file /opt/calabriaverde-test/backend/.env. Correzione applicata: rieseguito l'import caricando esplicitamente l'ambiente del backend Test con `set -a; source /opt/calabriaverde-test/backend/.env; set +a` prima di lanciare lo script, quindi riavviato il servizio. Prevenzione futura: tutti gli script manuali eseguiti sul VPS devono essere lanciati o tramite EnvironmentFile del servizio oppure dopo source del file .env, in particolare quelli che parlano direttamente con MariaDB. Stato: risolto.

Contesto: pagina Strumenti > Geografia su Test dopo il primo deploy del modulo. Errore/rischio: la schermata mostrava errore di caricamento mentre il riepilogo restava vuoto, nonostante summary e dati fossero presenti nel database Test. Causa individuata: l'endpoint `/api/admin/geography/regions` ordinava con `GeoRegion.sort_order.asc().nullslast()`, sintassi non compatibile con MariaDB/MySQL e quindi fonte di errore server. Correzione applicata: sostituito l'ordinamento con una `case` SQL compatibile che sposta i null in fondo senza usare `NULLS LAST`, quindi ridistribuito il router backend e riavviato il servizio Test. Prevenzione futura: quando si scrivono query SQLAlchemy destinate a MariaDB evitare costrutti PostgreSQL-oriented come `nullslast()` se non si e' verificata la traduzione effettiva del dialect. Stato: risolto.


## 2026-05-14 18:30:00 - Aggiornamento error

Contesto: avvio locale Collaudo/Test sul PC Windows. Errore/rischio: il sito locale restava irraggiungibile nonostante gli script di bootstrap e la build frontend esistessero. Causa individuata: il runtime locale dipendeva da `next/font/google`, quindi il build export falliva offline o in ambienti con rete limitata; inoltre il precedente approccio con piu' dev server risultava fragile e poco verificabile. Correzione applicata: rimossi i font Google dal layout in favore di fallback locali/CSS, introdotto runtime statico servito da Python con backend FastAPI separato e script `scripts/local/` che generano `gestionale/collaudo` e `gestionale/test` in modo deterministico. Prevenzione futura: per il collaudo locale evitare dipendenze build-time da rete esterna e preferire script di runtime ripetibili che non dipendano da HMR o porte gia' occupate. Stato: risolto.


## 2026-05-14 19:18:00 - Aggiornamento error

Contesto: promozione su ambiente Test del consolidamento HR esterni e bundle dati. Errore/rischio: sul VPS la migration `005` risultava applicata solo in parte (`tipo_collaborazione` e indice presenti, ma `alembic_version` ancora a `004`), e lo script remoto `import_test_bundle.py` era una versione vecchia che ignorava la configurazione DB su porta `8443`, fallendo con connection refused su `localhost:3306`. Causa individuata: precedente tentativo di migration interrotto e script di import non riallineato alla cartella `backend/execution/common/` introdotta in locale. Correzione applicata: aggiornato manualmente il backfill esterni e `alembic_version` a `006_backfill_external_collaboration_type`, caricate sul VPS la versione corrente di `import_test_bundle.py` e gli helper `execution/common`, rieseguito l'import bundle con env esplicite del DB Test e riavviato il servizio `calabriaverde-test`. Prevenzione futura: prima di ogni promozione verificare sempre `alembic_version`, presenza reale di colonne/indici introdotti dall'ultima migration e versione degli script remoti di import/export rispetto al ramo `collaudo`. Stato: risolto.


## 2026-05-14 19:22:00 - Aggiornamento error

Contesto: stop del runtime locale su Windows. Errore/rischio: `Stop-All.ps1` fermava correttamente gli ambienti ma lasciava in console messaggi rumorosi di `Accesso negato` da `taskkill`, rendendo il collaudo piu' confuso. Causa individuata: `taskkill` emetteva errori standard su PID non gestibili anche quando la procedura complessiva era completata. Correzione applicata: soppressione esplicita dello stderr di `taskkill` in `scripts/local/Common.ps1`. Prevenzione futura: i launcher locali devono essere silenziosi sugli errori non bloccanti e lasciare in output solo lo stato utile per chi esegue il collaudo. Stato: risolto.


## 2026-05-14 21:45:00 - Aggiornamento error

Contesto: applicazione della migration `007_fleet_module` sul database locale di Collaudo. Errore/rischio: Alembic rifiutava l'upgrade con messaggio di revisione sovrapposta tra `005_external_collaboration_profiles` e `006_backfill_external_collaboration_type`, pur avendo una catena lineare di migration nel codice. Causa individuata: nella tabella `alembic_version` erano rimaste due righe (`005...` e `006...`) e le revisioni lunghe oltre 32 caratteri risultavano troncate in `varchar(32)`, generando uno stato ambiguo. Correzione applicata: pulita la tabella `alembic_version` lasciando una sola head valida, applicata `007_fleet_module`, poi riallineata la head a `007_fleet_module`. Prevenzione futura: controllare sempre `SELECT * FROM alembic_version` quando Alembic segnala overlap inattesi; usare identificativi revisione compatti nelle future migration o verificare il limite della colonna `version_num`. Stato: risolto.


## 2026-05-14 22:40:00 - Aggiornamento error

Contesto: pagine del modulo Parco Macchine in locale e su Test mostravano `Errore caricamento / Failed to fetch`. Errore/rischio: il frontend fleet risultava raggiungibile ma non riusciva a ottenere dati, lasciando il modulo apparentemente rotto. Causa individuata: il backend Test non era ancora stato promosso a `007_fleet_module` con i dati mezzi, mentre il runtime statico locale continuava a dipendere da un backend `127.0.0.1:8010` non abbastanza stabile per un uso browser continuativo. Correzione applicata: aggiornato `import_test_bundle.py` per includere le tabelle fleet, caricato sul VPS il bundle Test con `vehicles`, `vehicle_revisions` e `aib_team_vehicles`, applicata la migration `007_fleet_module`, rieseguito l'import sul database `gestionale_cv_test`, riavviato `calabriaverde-test` e riconfigurato il launcher locale per usare `https://smart-cv.it/api` come API stabile. Prevenzione futura: ogni nuovo modulo che legge dati dinamici deve essere promosso su Test insieme a migration, bundle e verifica autenticata delle route API prima di considerare valido il collaudo frontend; per il runtime statico locale evitare dipendenze da backend effimeri se esiste gia' un backend Test pubblico affidabile. Stato: risolto.


## 2026-05-14 23:05:00 - Aggiornamento error

Contesto: apertura di pagine protette dopo sessioni precedenti lasciava a schermo `Errore caricamento / Token non valido o scaduto`. Errore/rischio: il sito appariva rotto anche quando il problema reale era solo un token stale nel browser; la login poteva inoltre reindirizzare alla dashboard solo per presenza del token, senza verificarne la validita'. Causa individuata: il client API non gestiva in modo centralizzato le risposte `401/403` dovute ad autenticazione scaduta, e `frontend/src/app/(auth)/login/page.tsx` considerava sufficiente l'esistenza di `access_token` in `localStorage`. Correzione applicata: introdotti in `frontend/src/lib/api.ts` i helper `clearAuthState`, `redirectToLogin`, `isAuthFailure` e l'opzione `skipAuthRedirect`; sui fallimenti auth il client pulisce i token, notifica `auth-state-changed` e rimanda alla login sul `basePath` corretto. La login ora valida la sessione con `GET /auth/me` e solo in caso positivo entra in dashboard. Prevenzione futura: tutte le pagine che consumano API protette devono usare il client condiviso invece di gestire localmente gli errori auth; le route di login non devono mai fidarsi della sola presenza di token in `localStorage`. Stato: risolto.


## 2026-05-14 23:58:00 - Aggiornamento error

Contesto: estensione del modulo Parco Macchine con funzioni operative avanzate e promozione su Test. Errore/rischio: durante la prima promozione del backend fleet esteso il frontend statico sarebbe rimasto solo parzialmente operativo senza un riallineamento completo di migration, bundle dati e servizio VPS; inoltre il router iniziale toccava relazioni lazy (`current_user.employee`) in punti che avrebbero potuto generare problemi di sessione SQLAlchemy nei contesti piu' stretti. Causa individuata: il nuovo strato fleet introduce dipendenze tra gruppi, assegnazioni, alert e comunicazioni ufficiali, quindi non basta distribuire il frontend senza aggiornare contemporaneamente backend, schema e import/export dati; per l'attore autenticato era piu' sicuro ricavare l'`employee_id` con query esplicita. Correzione applicata: aggiunta la migration `008_fleet_ops_comms`, aggiornati gli script `export_test_bundle.py` e `import_test_bundle.py`, introdotti i modelli `communications.py` e il servizio `communication_log.py`, corretto il router fleet con helper `current_user_employee_id(...)` e verifica end-to-end via `FastAPI TestClient`; poi promozione completa su VPS fino a `008_fleet_ops_comms` con verifica del servizio attivo e route pubblicate. Prevenzione futura: ogni estensione verticale che introduce workflow trasversali deve nascere gia' con script bundle aggiornati, smoke test API end-to-end e una logica riusabile centrale per audit e comunicazioni, invece di appoggiarsi a effetti collaterali dei moduli esistenti. Stato: risolto.


## 2026-05-15 10:40:00 - Aggiornamento error

Contesto: accesso a `https://smart-cv.it/test/` e runtime locale statico `gestionale/collaudo` e `gestionale/test`. Errore/rischio: online la navigazione poteva rimbalzare tra login e dashboard, mentre in locale diversi link interni portavano a `404 File not found` nonostante la build esistesse. Causa individuata: molte route interne del frontend usavano percorsi assoluti grezzi come `/dashboard`, `/hr`, `/fleet` senza passare dal `basePath`; in un export statico servito sotto `/test` o `/gestionale/collaudo` questi link uscivano dal perimetro pubblicato e rompevano la navigazione. In parallelo il layout dashboard considerava valida la sessione sulla sola presenza del token, senza una verifica reale su `/auth/me`, rendendo piu' facile il rimbalzo con token stale. Correzione applicata: centralizzata la generazione URL in `withAppBasePath(...)` con aggiunta dello slash finale per le route statiche, aggiornati sidebar, dashboard, HR, strumenti e fleet per usare il path helper, verificato il rebuild locale con `200` su login/dashboard/hr/fleet, e rinforzato `frontend/src/app/(dashboard)/layout.tsx` con validazione reale della sessione prima di mostrare la dashboard. Prevenzione futura: nessun nuovo link interno deve usare path hardcoded senza helper di ambiente; ogni guardia auth deve verificare il token contro `/auth/me` e non soltanto contro `localStorage`. Stato: risolto e da ricontrollare nel browser utente dopo refresh completo.


## 2026-05-15 11:05:00 - Aggiornamento error

Contesto: navigazione interna in locale dopo la correzione basePath. Errore/rischio: i link generati in Collaudo/Test locale diventavano doppi, ad esempio `/gestionale/test/gestionale/test/hr/esterna`. Causa individuata: `next.config.ts` imposta gia' `basePath`, e il componente `Link` di Next aggiunge automaticamente quel prefisso; il helper `withAppBasePath(...)` lo aggiungeva una seconda volta. Correzione applicata: `withAppBasePath(...)` ora normalizza solo le route interne e lo slash finale, lasciando a Next la gestione del `basePath`; il prefisso esplicito resta solo dove serve fuori dal router, ad esempio asset o redirect browser non gestiti da Next. Prevenzione futura: per i link `<Link>` e `router.push/replace` usare path applicativi puri (`/hr/esterna/`), non URL gia' prefissati; usare il basePath esplicito solo per asset statici e `window.location`. Stato: risolto.


## 2026-05-15 12:10:00 - Aggiornamento error

Contesto: workflow Parco Macchine per gruppi, rinnovi, assegnazioni e comunicazioni ufficiali. Errore/rischio: alcune funzioni erano disponibili come endpoint o form secondari ma non erano posizionate dove l'utente le cercava, generando ambiguita' operativa su dove creare gruppi, aggiornare assicurazioni/revisioni e assegnare mezzi. Causa individuata: la UI era cresciuta per blocchi tecnici invece che per flusso operativo; mancava una modale di selezione mezzi per creare gruppi e mancava una comunicazione ufficiale tracciata all'atto dell'assegnazione. Correzione applicata: aggiunti pulsanti e modali nei punti operativi corretti, esteso `FleetGroupCreate` con `vehicle_ids`, creazione membership in transazione, e registrazione nel registro comunicazioni dell'assegnazione mezzo con progressivo annuo e metadata del verbale. Prevenzione futura: ogni nuovo workflow deve essere verificato dal punto di vista dell'utente finale prima della promozione su Test, non solo tramite presenza endpoint/API. Stato: risolto lato struttura e da verificare in browser dopo promozione.
