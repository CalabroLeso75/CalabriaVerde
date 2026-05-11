# Direttiva: importazione anagrafica

## Obiettivo

Importare e mantenere aggiornata l'anagrafica persone dal database legacy locale `azienda_local` verso il database di collaudo `gestionale_cv`, senza cancellare dati e con report verificabili.

## Procedura standard

1. Eseguire sempre prima una simulazione senza scrittura.
2. Salvare report e anomalie in `.tmp/project_completion/collaudo/import_anagrafica/`.
3. Procedere con scrittura solo dopo verifica del report.
4. Non cancellare record destinazione durante l'import ordinario.
5. Aggiornare i registri dopo ogni import o dopo ogni errore significativo.

## Script di riferimento

Usare:

```powershell
backend\venv\Scripts\python.exe backend\execution\import_anagrafica_azienda_local.py
```

Per applicare davvero le modifiche:

```powershell
backend\venv\Scripts\python.exe backend\execution\import_anagrafica_azienda_local.py --apply
```

## Regole dati

- Chiave di upsert: `codice_fiscale`.
- I record senza codice fiscale devono essere scartati e riportati nelle anomalie.
- Le matricole duplicate devono essere segnalate prima dell'import.
- Gli aggiornamenti devono toccare solo i campi mappati dallo script.
- Le tabelle di destinazione non devono essere svuotate automaticamente.

## Ambiente

- Sorgente predefinita: `localhost:3306/azienda_local`.
- Destinazione predefinita: `localhost:3306/gestionale_cv`.
- Le credenziali possono essere sovrascritte con variabili ambiente `IMPORT_SRC_*` e `IMPORT_DST_*`.
