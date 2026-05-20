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

Prossimi passi consigliati:

- estendere `ObjectCard` ad assicurazioni e revisioni;
- aggiungere `ObjectRelationBoard` per collegamenti drag and drop;
- creare endpoint backend di permessi oggetto;
- applicare il pattern a sedi, ruoli e turnazioni.
