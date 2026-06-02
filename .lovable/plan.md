## Obiettivo
Su desktop (1920×1080) la classifica mostra solo ~7 righe per via di padding/font troppo grandi. Vogliamo almeno 10 righe visibili e, se ce ne sono di più, scroll automatico su/giù come già previsto.

## Modifiche (solo `src/routes/index.tsx`)

1. **Rendere le righe più compatte** così che 10+ entrino nel viewport:
   - Padding riga: `py-5` → `py-3`
   - Font riga: `text-3xl xl:text-4xl` → `text-2xl xl:text-3xl`
   - Pos #1: `text-5xl` → `text-4xl`; Pos #2-3: `text-4xl` → `text-3xl`
   - Header colonne: `text-xl` → `text-lg`, `pb-3` → `pb-2`
   - Ridurre leggermente il padding verticale del main (`py-10` → `py-6`) e gap header (`gap-8` → `gap-4`) per recuperare spazio
   - Titolo: `text-7xl xl:text-8xl` → `text-6xl xl:text-7xl`, sottotitolo `text-3xl xl:text-4xl` → `text-2xl xl:text-3xl`

2. **Auto-scroll**: il meccanismo esistente (`ResizeObserver` + classe `.auto-scroll` con keyframes `scroll-y` in `src/styles.css`) si attiva già automaticamente quando il contenuto supera l'altezza del contenitore e va su/giù in alternanza. Con le nuove dimensioni:
   - Se ci sono ≤10 righe → nessuno scroll, tutto visibile
   - Se ci sono >10 righe → scroll automatico avanti/indietro
   - Rallentare leggermente l'animazione in `styles.css`: `animation: scroll-y 30s` → `45s` per una lettura più confortevole con liste lunghe (max 20 entry).

## File toccati
- `src/routes/index.tsx` — dimensioni tipografiche/padding
- `src/styles.css` — durata animazione `.auto-scroll`

Nessuna modifica a logica dati, API o backend.
