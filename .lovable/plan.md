
# La Dolce Quiz — Classifica Evento

App leaderboard single-event con pagina pubblica per TV 1920x1080, API pubblica per inserire punteggi, e backoffice admin protetto da password.

## Stack
- TanStack Start (già nel progetto)
- Lovable Cloud (Supabase) per database
- Server functions / server routes per insert e delete

## Setup backend
- Abilitare Lovable Cloud
- Tabella `leaderboard_entries`:
  - `id` uuid PK default `gen_random_uuid()`
  - `name` text not null
  - `score` integer not null check (score >= 0)
  - `created_at` timestamptz default `now()`
- Indice su `(score desc, created_at asc)` per ordinamento veloce
- RLS: SELECT pubblico a tutti; INSERT/DELETE solo `service_role` (operazioni passano da server routes)
- GRANT SELECT a `anon` e `authenticated`; GRANT ALL a `service_role`
- Secret: `ADMIN_PASSWORD` (richiesto via add_secret)

## Pagine

### `/` — Public leaderboard (TV 16:9)
- Layout landscape 1920x1080, ottimizzato per visione da lontano
- Header: titolo "La Dolce Quiz" (display serif elegante, crema) + sottotitolo "Classifica Evento"
- Tabella Top 20: colonne `#`, `Nome`, `Punteggio`
- Ordinamento: `score desc`, `created_at asc` (tie-break)
- Top 3 evidenziati con sfondo/colore leggermente diverso (no medaglie)
- Polling ogni 5s (TanStack Query con `refetchInterval: 5000`)
- Auto-scroll verticale fluido se le 20 righe non entrano in altezza disponibile
- "Ultimo aggiornamento: HH:MM:SS" in piccolo in basso

### `/admin` — Backoffice
- Form password (confronto server-side con `ADMIN_PASSWORD`)
- Dopo login (sessione in memoria / sessionStorage del token effimero), tabella di TUTTE le entries ordinate per `created_at desc`
- Colonne: nome, score, created_at, bottone Elimina (conferma)
- UI minimale shadcn (Table + Button + Input)

## API / Server

### `POST /api/score` (server route pubblica, `src/routes/api/public/score.ts`)
- Body JSON `{ name, score }`
- Validazione Zod:
  - `name`: string, trim, min 1, max 30
  - `score`: integer, >= 0
- Filtro profanità: lista parole offensive (IT + EN base) → 400 se match
- Insert via `supabaseAdmin`
- Risposta: `{ success: true, id }`
- CORS aperto (POST + OPTIONS) per permettere call da app del quiz esterna

### `POST /api/public/admin/delete` (server route)
- Body `{ password, id }`
- Verifica password vs `process.env.ADMIN_PASSWORD` (timingSafeEqual)
- Delete via `supabaseAdmin`

### `POST /api/public/admin/login` (opzionale)
- Verifica password, ritorna ok (l'UI memorizza la password in sessionStorage e la rinvia ad ogni delete)

### Lettura leaderboard
- Pagina pubblica e admin leggono via client Supabase (RLS SELECT pubblico)

## Design system (`src/styles.css`)
- Background: dark teal `oklch(~0.28 0.05 180)`
- Foreground: crema `oklch(~0.93 0.04 85)`
- Accent rosso terracotta (come bottone "CONTINUAMO") per evidenziare top 1
- Font: display serif elegante (es. "Playfair Display" o "Cormorant") per titoli + sans pulito (es. "Inter") per dati
- Texture sottile carta vintage in overlay (SVG noise + pattern floreale opacity bassa)

## File da creare
```
src/routes/index.tsx            (leaderboard TV)
src/routes/admin.tsx            (backoffice)
src/routes/api/public/score.ts  (POST insert)
src/routes/api/public/admin/delete.ts
src/lib/profanity.ts            (lista parole)
src/integrations/supabase/*     (auto via Cloud)
src/styles.css                  (tokens tema)
```

## Note
- Single-event, niente logica multi-evento
- Niente auth utente: admin è solo password env
- L'endpoint `/api/score` è pubblico (no auth) — usato dall'app del quiz per inviare punteggi
