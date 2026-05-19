# Ambienti e percorsi

## Ambienti

- Collaudo locale: usato per sviluppo e verifica rapida.
- Test online: `https://smart-cv.it/test/`.
- API Test: `https://82-165-198-214.sslip.io/api`.
- Produzione futura: separata da Test e pubblicata solo dopo verifica.

## Regole basePath

Next gestisce automaticamente il `basePath` per `<Link>` e `router.push`.

Usare:

```ts
withAppBasePath('/fleet/dettaglio?id=1')
```

Per navigazioni manuali browser, invece, serve aggiungere il prefisso esplicito:

```ts
withBrowserBasePath('/fleet/dettaglio?id=1')
```

Errore da non ripetere:

```text
https://smart-cv.it/fleet/
```

quando l'ambiente corretto e':

```text
https://smart-cv.it/test/fleet/
```

