# Modulo Geografia

## Scopo

Il modulo `Geografia` centralizza i riferimenti territoriali riusabili da piu' parti del gestionale:

- stati
- regioni italiane
- province italiane
- comuni italiani
- confini provincia
- confini comune
- toponimi Calabria come punti centrali

## Tabelle target

- `geo_countries`
- `geo_regions`
- `geo_provinces`
- `geo_municipalities`
- `geo_province_boundaries`
- `geo_municipality_boundaries`
- `geo_calabria_toponyms`

## Router API

Prefisso backend:

- `/api/admin/geography`

Endpoint principali:

- `/summary`
- `/countries`
- `/regions`
- `/provinces`
- `/municipalities`
- `/province-boundaries`
- `/municipality-boundaries`
- `/calabria-toponyms`

## Import dati

Script:

- `backend/execution/import_geography_module.py`

Importa sempre dal database sorgente:

- `foreign_states`
- `it_regions`
- `it_provinces`
- `it_municipalities`

Import opzionale dei layer aggiuntivi tramite env:

- `GEO_SOURCE_MUNICIPAL_BOUNDARIES_TABLE`
- `GEO_SOURCE_PROVINCE_BOUNDARIES_TABLE`
- `GEO_SOURCE_CALABRIA_TOPONYMS_TABLE`

Se questi valori non sono configurati, il modulo viene comunque popolato per la parte anagrafica base e registra il salto nel report.

## Report

Percorso report di default:

- `.tmp/project_completion/collaudo/geography_import/summary.json`

## Nota importante

Nel database locale ispezionato il legame `regione -> province` non era esplicitato nelle tabelle legacy. Lo script lo ricostruisce in modo deterministico tramite l'ordinamento storico delle province nel dataset sorgente.
