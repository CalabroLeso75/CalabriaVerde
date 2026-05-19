# API key e provider targhe

## Scopo

Questo documento definisce il metodo corretto per integrare provider targa nel Parco Macchine senza consumare crediti inutili e senza confondere API key, token e password di accesso alla console.

## Openapi Automotive

Openapi Automotive espone endpoint per dati tecnici e assicurativi dei veicoli. La documentazione ufficiale indica:

- produzione auto Italia: `GET https://automotive.openapi.com/IT-car/{LicensePlate}`
- sandbox auto Italia: `GET https://test.automotive.openapi.com/IT-car/{LicensePlate}`
- produzione assicurazione Italia: `GET https://automotive.openapi.com/IT-insurance/{LicensePlate}`
- sandbox assicurazione Italia: `GET https://test.automotive.openapi.com/IT-insurance/{LicensePlate}`

L'header richiesto dagli endpoint Automotive e':

```http
Authorization: Bearer <TOKEN_OAUTH>
```

La API key vista in console non e' automaticamente il Bearer token. Se usata direttamente su Automotive, il servizio risponde `Wrong Token`.

## Generazione token Openapi

La documentazione OAuth Openapi indica che per creare un token si usa Basic Auth con email account e API key.

Endpoint produzione:

```http
POST https://oauth.openapi.it/token
Authorization: Basic base64(email:apikey)
Content-Type: application/json
```

Payload consigliato:

```json
{
  "scopes": [
    "GET:automotive.openapi.com/IT-car/*",
    "GET:automotive.openapi.com/IT-insurance/*"
  ],
  "ttl": 2592000
}
```

Endpoint sandbox:

```http
POST https://test.oauth.openapi.it/token
```

Per prove iniziali usare sandbox e scope corrispondenti a `test.automotive.openapi.com`.

## Configurazione gestionale

Percorso:

```text
Amministrazione > Configurazione > API targhe e catalogo mezzi
```

Valori per Openapi produzione:

```text
Provider: Openapi Automotive
Endpoint API: https://automotive.openapi.com
API key opzionale: <TOKEN_OAUTH>
Lookup esterno attivo: si
```

Valori per Openapi sandbox:

```text
Provider: Openapi Automotive Sandbox
Endpoint API: https://test.automotive.openapi.com
API key opzionale: <TOKEN_OAUTH_SANDBOX>
Lookup esterno attivo: si
```

## Regola anti spreco crediti

Prima di chiamare un provider a pagamento il sistema deve controllare `vehicle_external_lookups`.

Ordine obbligatorio:

1. cache tecnica locale `lookup_type=plate`, `status=found`, `trim_id` valorizzato;
2. cache assicurativa locale `lookup_type=insurance`, `status=found` o `empty`;
3. chiamata provider solo se la cache non esiste;
4. commit del log prima di mostrare i dati in modale;
5. salvataggio mezzo usando dati gia' estratti, senza seconda chiamata provider.

## Errori noti

- `Wrong Token`: si sta usando API key account al posto del token OAuth.
- `401`: token assente, scaduto o con scope sbagliati.
- `402`: credito o piano non disponibile.
- `404`: targa non trovata o formato non accettato.
- `500`/timeout: errore provider remoto; registrare log, non perdere dati gia' recuperati.

