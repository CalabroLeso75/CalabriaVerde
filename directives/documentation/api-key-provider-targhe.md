# API targhe: metodo ufficiale Targa.co.it / RegCheck

## Scopo

Questo documento blocca il metodo corretto per interrogare le targhe italiane nel Parco Macchine. Il provider operativo e' Targa.co.it / RegCheck, gestito da Infinite Loop Development Ltd.

La regola principale e': non cercare token separati. Per questo provider la credenziale API e' lo username dell'account; la password serve per accedere alla dashboard.

## Credenziale e saldo

Credenziale gestionale:

```text
FLEET_PLATE_PROVIDER=targa_co_it
FLEET_PLATE_USERNAME=<username account Targa.co.it>
FLEET_EXTERNAL_LOOKUP_ENABLED=true
```

La API key non e' richiesta per Targa.co.it. Se presente, viene usata solo come fallback legacy, ma la configurazione corretta resta `FLEET_PLATE_USERNAME`.

Controllo saldo:

```http
GET https://www.regcheck.org.uk/ajax/getcredits.aspx?username=<username>
```

Prima di prove su targhe reali verificare il saldo. La documentazione indica `BN071VN` come targa campione, ma sul nostro account almeno una prova tecnica/assicurativa ha scalato credito: quindi ogni test va trattato come potenzialmente a pagamento e va misurato con saldo prima/dopo.

## Endpoint tecnici Italia

La documentazione Targa.co.it / RegCheck indica per le auto italiane:

```http
GET https://www.targa.co.it/api/reg.asmx/CheckItaly?RegistrationNumber=<TARGA>&username=<USERNAME>
```

Risposta:

- XML con nodo `vehicleJson`;
- dentro `vehicleJson` c'e' JSON con marca, modello, anno, cilindrata, alimentazione, versione, potenza, eventuale VIN e immagine.

Campi principali da estrarre:

- `MakeDescription.CurrentTextValue` oppure `CarMake.CurrentTextValue`;
- `ModelDescription.CurrentTextValue` oppure `CarModel.CurrentTextValue`;
- `Description`;
- `RegistrationYear`;
- `EngineSize.CurrentTextValue`;
- `FuelType.CurrentTextValue`;
- `Version`;
- `PowerCV`;
- `PowerKW`;
- `Vin` o `VehicleIdentificationNumber`.

Nota cilindrata: in Italia il campo puo' arrivare come `2.0`, come `1199`, oppure come fascia testuale tipo `14 cv (da 1119,2 a 1243,6 cc.)`. Il parser deve trasformare:

- `2.0` in `2000`;
- `1199` in `1199`;
- fascia `da 1119,2 a 1243,6 cc.` nel primo valore utile, quindi `1119`.

## Endpoint assicurazione Italia

La documentazione indica per lo stato assicurativo:

```http
GET https://www.targa.co.it/api/bespokeapi.asmx/CheckInsuranceStatusItaly?regNumber=<TARGA>&username=<USERNAME>
```

Risposta XML attesa:

```xml
<InsuranceDetails>
  <Company>...</Company>
  <Expiry>2025-01-23T00:00:00</Expiry>
  <IsInsured>true</IsInsured>
  <Region>VE</Region>
</InsuranceDetails>
```

Il gestionale salva una copertura assicurativa solo se sono presenti sia compagnia sia scadenza valida. Date sentinella come `0001-01-01T00:00:00` non devono essere salvate.

Se il provider restituisce la compagnia ma non una scadenza valida, il gestionale aggiorna solo `assicurazione_compagnia` sulla scheda mezzo e registra nel log perche' non ha creato il record storico della copertura. Il record `vehicle_insurance_records` richiede una `data_scadenza` valida.

## Revisioni

Targa.co.it / RegCheck, nella documentazione Italia verificata, non espone uno storico revisioni italiano. Il gestionale deve quindi:

- non promettere revisione remota da questo provider;
- mostrare "revisione non reperita dal provider italiano configurato";
- mantenere e valorizzare solo lo storico revisioni locale o un futuro provider dedicato.

## Metodo gestionale obbligatorio

1. Normalizzare la targa rimuovendo spazi e portandola in maiuscolo.
2. Cercare prima in cache locale `vehicle_external_lookups` con `lookup_type=plate`, `status=found`, `trim_id` presente.
3. Se non esiste cache, chiamare `CheckItaly`.
4. Salvare sempre il raw payload in `vehicle_external_lookups`.
5. Creare o riusare Brand, Model e VehicleTrim normalizzati.
6. Sincronizzare sempre `vehicle_trims.raw_payload` anche quando l'allestimento esiste gia', cosi' il dettaglio mezzo espone tutti i campi recuperati con un solo credito.
7. Chiamare `CheckInsuranceStatusItaly` solo come lookup accessorio e con timeout breve.
8. Salvare il log assicurativo prima di rispondere alla modale.
9. In `recognition/apply` non richiamare il provider: applicare solo dati gia' salvati nei log/cache.
10. Salvare sul mezzo: marca, modello, categoria, anno, alimentazione, classe euro se presente, numero telaio se presente, assicurazione solo se completa.
11. Registrare un log `vehicle_recognition_apply` con esito tecnico, assicurativo, VIN e nota revisioni.
12. Mostrare nel dettaglio mezzo i dati strutturati principali e il payload completo appiattito in campi leggibili.

## Errori noti

- `HTTP 500`: il provider puo' restituirlo anche per targa non trovata o input non valido. Registrare corpo risposta se disponibile.
- Se `CheckItaly` restituisce HTTP 500, trattare l'esito come `empty/not_found` e salvarlo in cache: non riprovare la stessa targa senza motivo, perche' puo' consumare credito.
- Timeout: non bloccare il salvataggio tecnico; registrare errore nel log API.
- `Company` assente o `Expiry=0001-01-01`: assicurazione non salvabile.
- `Company` presente ma `Expiry` assente: salvare solo compagnia sulla scheda mezzo, non creare storico copertura.
- Revisione assente: comportamento previsto per Targa.co.it Italia.
- Modelli tipo `D-MAX II (TFR, TFS)`: `TFR/TFS` sono codici tecnici piattaforma/telaio Isuzu, non voci contrattuali; nella scheda mezzo mostrare `D-MAX II` e tenere la stringa originale come versione/allestimento o raw payload.

## Verifica rapida

Targa campione documentata:

```text
BN071VN
```

Il test tecnico deve restituire almeno marca/modello/alimentazione/cilindrata. Il test assicurativo puo' restituire `IsInsured=false` e `Expiry=0001-01-01T00:00:00`; in quel caso non si salva nessuna copertura.

Prima e dopo il test controllare:

```http
GET https://www.regcheck.org.uk/ajax/getcredits.aspx?username=<username>
```
