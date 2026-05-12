# Import personale esterno

## Obiettivo

Importare in modo idempotente il personale esterno dal gestionale legacy al collaudo FastAPI, mantenendo:

- `tipo = esterno`
- organizzazione esterna collegata
- fascicolo HR modificabile come gli interni
- report di dry-run/apply in `.tmp/project_completion/collaudo/import_personale_esterno/`

## Script

- `backend/execution/export_personale_esterno_legacy.py`
- `backend/execution/import_personale_esterno_bundle.py`

## Flusso

1. Esportare bundle sorgente dal DB legacy con:
   - `organizations.json`
   - `external_employees.json`
   - `manifest.json`
2. Eseguire dry-run locale su `gestionale_cv`
3. Validare report, anomalie e differenze
4. Eseguire `--apply` in collaudo
5. Rigenerare il bundle Test e promuovere verso VPS/Test

## Note operative

- Le organizzazioni legacy esterne vengono create nel nuovo schema con codice deterministico `EXT###`.
- Per non perdere il legame sorgente, l'id legacy dell'organizzazione viene conservato nel `notes`.
- Se un codice fiscale esiste gia' come record non `esterno`, il record viene saltato e segnalato nelle anomalie.
