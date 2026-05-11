# Direttiva: ambienti di lavoro e deploy

## Obiettivo

Mantenere separati collaudo locale, test su hosting e produzione, evitando promozioni non verificate.

## Ambienti

### Collaudo

- Ambiente locale sul PC di sviluppo.
- Usa il workspace corrente.
- Frontend: Next.js locale.
- Backend: FastAPI locale.
- Database: MySQL locale.
- Scopo: sviluppo, verifiche tecniche, test end-to-end prima della pubblicazione.

### Test

- Ambiente pubblico provvisorio su hosting.
- URL previsto: `https://smart-cv.it/test/`.
- Cartella remota: `/Gestionale/public/test/`.
- Scopo: verifica visuale e funzionale non definitiva.
- Non deve contenere credenziali o file sorgente sensibili.

### Produzione

- Ambiente pubblico finale.
- URL previsto: `https://smart-cv.it/produzione/`, salvo diversa configurazione dominio.
- Cartella remota: `/Gestionale/public/produzione/`.
- Scopo: rilascio finale o pre-finale approvato.
- Deve essere aggiornata solo dopo verifiche in collaudo e test.

## Regole di promozione

1. Ogni modifica nasce in collaudo.
2. Dopo verifiche locali, la modifica può essere pubblicata in test.
3. La produzione si aggiorna solo dopo esito positivo in test.
4. Ogni promozione deve aggiornare `directives/activity_log.md`.
5. Errori di deploy o configurazione ambiente devono aggiornare `directives/error_memory.md`.
6. Decisioni su branch, repository, domini o cartelle devono aggiornare `directives/decisions.md`.

## Repository e tracciamento

- Il repository di collaudo rappresenta il workspace locale e il ramo `collaudo`.
- Il repository/ramo di produzione è rappresentato dal ramo `produzione` e deve contenere solo modifiche approvate.
- L'ambiente `test` non richiede un ramo autonomo obbligatorio: è una pubblicazione verificabile della versione candidata proveniente da `collaudo`.
- Non committare `.env`, `.tmp/`, build statiche, credenziali, chiavi private o artefatti rigenerabili.
- Prima di aggiornare produzione, verificare sempre `git status` e i registri locali.
- Quando verranno introdotti repository remoti separati, questa direttiva dovrà indicare URL, branch protetti e procedura di sincronizzazione.

## File temporanei

- Tutti i file temporanei di deploy, log, manifest SFTP, pacchetti e verifiche vanno in `.tmp/project_completion/`.
