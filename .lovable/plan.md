Aggiungere un parametro querystring `?video=` alla route `/` per abilitare o disabilitare il pannello video promozionale.

Cosa cambia:
- Aggiungere `validateSearch` con schema Zod alla route `/`.
- Parametro `video: z.boolean().default(false)`.
- Nel componente `Leaderboard`, leggere `video` da `Route.useSearch()`.
- Quando `video === false`: forzare `mode` sempre su `"leaderboard"`, saltare tutta la logica di timer video/stall watchdog, e nascondere il pannello video (o non montarlo affatto).
- Quando `video === true`: comportamento attuale invariato (alternanza 20s classifica / 10s video).

Questo permette di usare `/?video=true` per attivare il video e lasciare l'URL senza parametro (default) per mostrare solo la classifica.