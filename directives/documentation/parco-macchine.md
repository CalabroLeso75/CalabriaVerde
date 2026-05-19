# Parco Macchine

## Pagine principali

- `/fleet/`: quadro operativo unico con tutti i mezzi.
- `/fleet/anagrafica/`: tessere operative, creazione gruppi e riconoscimento mezzo.
- `/fleet/catalogo/`: catalogo marche, modelli, allestimenti e import.
- `/fleet/dettaglio/?id=<id>`: fascicolo completo del mezzo.

## Riconoscimento targa

Il flusso corretto e':

1. l'utente preme `Riconosci mezzo`;
2. il backend cerca prima in cache;
3. se la cache non esiste, chiama il provider configurato;
4. salva marca, modello e allestimento in catalogo;
5. salva log API persistente;
6. mostra in modale dati tecnici, assicurazione remota, revisioni locali e log;
7. l'utente conferma;
8. `recognition/apply` aggiorna il mezzo senza chiamare di nuovo provider esterni.
9. Con Targa.co.it/RegCheck vengono aggiornati dati tecnici, eventuale telaio e assicurazione corrente se completa; le revisioni italiane non sono fornite dal provider e restano storico locale.

## Storico mezzo

Nel dettaglio mezzo devono vivere:

- assicurazioni correnti e pregresse;
- revisioni correnti e pregresse;
- assegnazioni e restituzioni;
- utilizzi;
- alert SOS;
- sinistri;
- documenti;
- note operative.

## Regola visuale lista mezzi

La lista unica deve ordinare i mezzi cosi':

1. assicurazione attiva e revisione attiva;
2. una tra assicurazione e revisione attiva;
3. dati tecnici presenti ma assicurazione/revisione scadute o mancanti;
4. solo targa o dati minimi.
