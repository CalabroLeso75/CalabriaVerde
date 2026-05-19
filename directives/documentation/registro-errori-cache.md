# Registro errori e cache

## Registro errori

Ogni problema ricorrente va scritto in `directives/error_memory.md` con:

- contesto;
- errore/rischio;
- causa individuata;
- correzione applicata;
- prevenzione futura;
- stato.

## Cache API

Un dato mostrato in modale deve essere gia' persistito nel DB. Non basta `flush`: serve `commit` se quel dato deve essere cache riusabile.

Tabelle coinvolte:

- `vehicle_external_lookups`: log lookup tecnici, assicurativi, VIN e applicazioni.
- `vehicle_trims`: allestimenti tecnici normalizzati.
- `vehicle_insurance_records`: storico assicurazioni.
- `vehicle_revisions`: storico revisioni.

## Metodo di verifica

Prima di chiudere una correzione API:

1. controllare crediti prima;
2. chiamare endpoint una volta;
3. controllare log DB;
4. chiamare endpoint una seconda volta;
5. verificare tempi bassi e crediti invariati;
6. registrare esito in `activity_log.md`.

