# Modello grafico oggetto/tessera

## Principio

Ogni elemento primario del gestionale deve essere trattato come oggetto:

- persona interna o esterna;
- mezzo, mezzo meccanico, attrezzatura;
- assicurazione;
- revisione;
- ruolo aziendale;
- turnazione;
- distretto, distaccamento, SOUP, sala operativa;
- ruolo operativo come DOS, direttore lavori, responsabile parco, utilizzatore;
- documento, comunicazione, alert, sinistro.

Ogni oggetto ha:

- una chiave primaria leggibile, per esempio codice fiscale, targa, codice sede, codice polizza;
- un tipo oggetto;
- uno stato;
- proprieta proprie;
- relazioni verso altri oggetti;
- azioni consentite all'utente.

## Tessera oggetto

La tessera comune e' `frontend/src/components/common/ObjectCard.tsx`.

La tessera deve mostrare:

- tipo oggetto e chiave primaria;
- titolo e sottotitolo;
- stato sintetico;
- proprieta principali;
- relazioni con altri oggetti;
- azioni disponibili;
- nota di visibilita/permessi.

La tessera e' predisposta per drag and drop tramite proprieta `draggable` e `onDragStart`.

## Regola permessi

La visibilita vera deve essere garantita dal backend. Il frontend puo' nascondere o disabilitare le azioni per migliorare l'esperienza utente, ma non deve essere considerato controllo di sicurezza sufficiente.

Ogni API che restituisce oggetti deve filtrare in base a:

- utente autenticato;
- ruoli attivi;
- ambito organizzativo;
- modulo;
- privilegi puntuali su lettura, modifica, assegnazione, eliminazione, export.

## Relazioni tra oggetti

Le relazioni non devono essere testo libero quando diventano strutturali. Devono puntare a oggetti identificabili:

- mezzo -> assicurazione corrente;
- mezzo -> revisioni;
- mezzo -> assegnatari;
- persona -> ruolo aziendale;
- persona -> turnazione;
- persona -> sede operativa;
- sede -> distretto;
- distaccamento -> distretto;
- comunicazione -> mittente/destinatari.

## Stato attuale

Prima applicazione completata:

- anagrafica mezzi;
- anagrafica persone interne/esterne.
- menu principale organizzato in Operatività, Supporto e Sistema;
- etichette principali semplificate: Persone, Mezzi, Strumenti, Amministrazione;
- azioni rese piu esplicite: Nuova persona, Nuovo gruppo mezzi, Aggiorna da targa, Pulisci filtri, Fascicolo.

## Regole di microcopy

Le etichette devono essere brevi, concrete e orientate all'azione.

Preferire:

- Persone invece di Risorse Umane quando si parla dell'oggetto gestito;
- Personale interno/personale esterno invece di Anagrafica interna/esterna;
- Mezzi invece di Parco Macchine quando il menu porta all'elenco operativo;
- Tutti i mezzi invece di Anagrafica mezzi;
- Aggiorna da targa invece di Riconosci mezzo;
- Pulisci filtri invece di Reset.

Evitare intestazioni doppie nella stessa vista. Il titolo pagina resta nell'header; il contenuto deve partire con una breve descrizione operativa o direttamente con gli strumenti di lavoro.

Prossimi passi consigliati:

- estendere `ObjectCard` ad assicurazioni e revisioni;
- aggiungere `ObjectRelationBoard` per collegamenti drag and drop;
- creare endpoint backend di permessi oggetto;
- applicare il pattern a sedi, ruoli e turnazioni.
