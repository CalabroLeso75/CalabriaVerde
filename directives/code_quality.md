# Direttiva: qualità del codice

## Obiettivo

Garantire che ogni codice prodotto o modificato dagli agenti sia pulito, modulare, leggibile e manutenibile.

## Regole

- Usare nomi chiari per variabili, funzioni, classi e file.
- Separare le responsabilità.
- Evitare funzioni troppo lunghe.
- Evitare duplicazioni.
- Non introdurre dipendenze non necessarie.
- Non inserire credenziali o dati sensibili nel codice.
- Gestire gli errori in modo esplicito.
- Validare gli input.
- Mantenere coerenza con lo stile del progetto.
- Applicare patch minime quando si correggono problemi localizzati.

## Prima di creare nuovo codice

L'agente deve verificare se esistono già:

- funzioni riutilizzabili;
- componenti esistenti;
- script in `execution/`;
- direttive specifiche;
- configurazioni già predisposte.

## Dopo la modifica

L'agente deve eseguire un controllo adeguato:

- test;
- lint;
- type check;
- verifica sintattica;
- avvio dello script;
- simulazione con dati di esempio;
- controllo manuale del flusso.

Il risultato del controllo deve essere registrato in `directives/activity_log.md`.
