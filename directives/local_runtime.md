# Avvio locale

## Obiettivo

Permettere l'avvio locale separato di `Collaudo` e `Test` senza dipendere da XAMPP, Apache o da porte web standard.

## Porte usate

- backend locale: `8010`
- frontend statico locale: `3000`

Queste porte evitano interferenze con Apache/XAMPP su `80` e `443`.

## URL locali

- Collaudo:
  - `http://127.0.0.1:3000/gestionale/collaudo/login/`
- Test:
  - `http://127.0.0.1:3000/gestionale/test/login/`
- Backend:
  - `http://127.0.0.1:8010/api/health`

## Script

Cartella: `scripts/local/`

- `Start-Collaudo.ps1`
- `Start-Test.ps1`
- `Start-All.ps1`
- `Stop-All.ps1`
- `Status.ps1`
- `Common.ps1`

## Regole operative

1. il backend locale e condiviso da collaudo e test
2. il frontend locale viene pubblicato staticamente sotto un unico host locale
3. i due ambienti usano `basePath` dedicato:
   - `/gestionale/collaudo`
   - `/gestionale/test`
4. PID e log runtime vengono salvati in:
   - `.tmp/project_completion/local_runtime/pids/`
   - `.tmp/project_completion/local_runtime/logs/`

## Note

- il backend viene forzato in locale con:
  - `DB_HOST=localhost`
  - `DB_NAME=gestionale_cv`
  - `DB_USER=root`
  - `LOCAL_DB_NO_PASSWORD=true`
- se il database locale usa una password diversa, va aggiornata la procedura di avvio comune
