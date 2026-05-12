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
