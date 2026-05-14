# Moduli comuni

## Scopo

Questa cartella logica descrive i moduli e le procedure riusabili che non devono restare duplicate dentro le singole sezioni del gestionale.

## Frontend

### `frontend/src/components/common/`

- `SectionLead.tsx`
  - intro standard per descrizione breve e dettaglio operativo della pagina
- `MetricCard.tsx`
  - card KPI riusabile per dashboard, HR, strumenti e futuri moduli operativi
- `NoticeBanner.tsx`
  - messaggi standard di errore, esito positivo o informazione
- `PaginationBar.tsx`
  - navigazione paginata uniforme per tabelle e liste

### `frontend/src/hooks/`

- `useDebouncedValue.ts`
  - debounce generico per filtri di ricerca e input reattivi

## Script operativi backend

### `backend/execution/common/`

- `db.py`
  - helper condiviso per connessioni MySQL/MariaDB via variabili ambiente
- `bundle.py`
  - serializzazione JSON, caricamento file bundle e ordinamento export

## Regola di progetto

Quando una procedura o un componente viene usato in piu moduli:

1. si estrae in una cartella comune coerente
2. si documenta qui
3. si evita di duplicare logica nei moduli verticali

## Stato attuale

- adottato da:
  - HR
  - Parco Macchine
  - Strumenti / Geografia
  - script bundle Test
  - export legacy personale esterno
- da estendere in seguito a:
  - dashboard KPI
  - amministrazione contratti
  - eventuali nuovi moduli cartografici e anagrafici
