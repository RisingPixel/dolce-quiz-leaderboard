## Problema

Il video promo viene caricato dal browser solo quando serve, quindi al primo passaggio "classifica → video" si vede un ritardo / schermo nero mentre buffera.

Anche se l'elemento `<video>` ha `preload="auto"`, il tag è dentro un contenitore con `opacity-0`: alcuni browser deprioritizzano il download finché l'elemento non è visibile. Inoltre non c'è alcun controllo che ritardi lo switch finché il video non è pronto.

## Soluzione (solo `src/routes/index.tsx`)

1. **Forzare il preload all'avvio della pagina**
   - All'mount del componente, chiamare `videoRef.current.load()` esplicitamente, così il download parte subito mentre l'utente vede la classifica.
   - Aggiungere uno stato `videoReady` che diventa `true` quando il video raggiunge `readyState >= 3` (HAVE_FUTURE_DATA) — ascoltato via evento `canplaythrough` / `canplay`.

2. **Hint di preload a livello di documento**
   - Iniettare un `<link rel="preload" as="video" href={PROMO_VIDEO_SRC} />` tramite l'API `head` della route (o un `useEffect` che lo appende a `document.head`), così la richiesta parte al primo paint con priorità alta.

3. **Ritardare lo switch se il video non è ancora pronto**
   - Nel `useEffect` che gestisce il timer, se al momento di passare a `"video"` `videoReady === false`, posticipare lo switch (es. ricontrollare ogni 500 ms fino a quando è pronto, oppure aspettare l'evento `canplaythrough`).
   - In questo modo non si vede mai uno schermo nero in attesa del buffering.

4. **Mantenere il video sempre montato** (già così) e con `preload="auto"`, ma rimuovere il `pointer-events-none` non c'entra — non si tocca il layout né la business logic.

Nessuna modifica a stili, schema DB, API o altri file.
