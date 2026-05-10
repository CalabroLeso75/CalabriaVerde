# Direttiva: gestione file e cartelle

## Obiettivo

Mantenere il progetto ordinato, portabile e sicuro.

## Regole principali

- I file temporanei devono stare in `.tmp/`.
- Gli script deterministici devono stare in `execution/`.
- Le direttive devono stare in `directives/`.
- Le credenziali devono stare in `.env` o in file specifici esclusi da Git.
- Non committare file temporanei, token, credenziali o chiavi API.
- Non duplicare file con lo stesso scopo.
- Non usare nomi generici come `test.py`, `prova.js`, `nuovo_file.md`, `final_final.py`.

## Prima di creare un file

L'agente deve verificare:

1. se un file equivalente esiste già;
2. se la nuova funzione può essere aggiunta a un modulo esistente;
3. se il nome è coerente;
4. se la cartella è corretta;
5. se il file deve essere versionato oppure escluso.

## Azioni rischiose

Prima di eseguire azioni distruttive, chiedere conferma all'utente.

Azioni rischiose:

- eliminare file o cartelle;
- sovrascrivere file esistenti;
- rinominare file critici;
- modificare configurazioni di produzione;
- alterare database;
- eseguire deploy.
