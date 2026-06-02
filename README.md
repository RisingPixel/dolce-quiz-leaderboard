# La Dolce Quiz — Classifica Evento

Single-event quiz leaderboard with a public TV display, password-protected admin backoffice, and a REST API for score submissions.

## Stack

- [TanStack Start](https://tanstack.com/start) (SSR) + [Nitro](https://nitro.build/) — deploys to Cloudflare Workers
- [Supabase](https://supabase.com/) — PostgreSQL database
- [Bun](https://bun.sh/) — package manager and runtime

## Local development

```bash
cp .env.example .env        # fill in Supabase + admin credentials
bun install
bun run dev                 # http://localhost:3000
```

Other commands:

```bash
bun run build   # production build (Cloudflare Workers via Nitro)
bun run lint    # ESLint
bun run format  # Prettier
```

## Public API

### Submit a score

```
POST https://dolce-quiz-leaderboard.lovable.app/api/public/score
Content-Type: application/json
```

**Request body**

```json
{
  "name": "Mario Rossi",
  "score": 850
}
```

| Field   | Type    | Constraints                          |
|---------|---------|--------------------------------------|
| `name`  | string  | 1–30 characters, no profanity        |
| `score` | integer | 0–1 000 000                          |

**Success — `201 Created`**

```json
{ "success": true, "id": "uuid-of-new-entry" }
```

**Errors**

| Status | `error` value              | Meaning                            |
|--------|----------------------------|------------------------------------|
| `400`  | `"Invalid JSON"`           | Request body is not valid JSON     |
| `400`  | `"Validation failed"`      | Field type or range constraint     |
| `400`  | `"Nome non consentito"`    | Name contains blocked words        |
| `500`  | `"Database error"`         | Server-side insert failed          |

**CORS** — the endpoint allows requests from any origin (`Access-Control-Allow-Origin: *`). Always include `Content-Type: application/json` in your request headers.

**Example with curl**

```bash
curl -X POST https://dolce-quiz-leaderboard.lovable.app/api/public/score \
  -H "Content-Type: application/json" \
  -d '{"name": "Mario Rossi", "score": 850}'
```

**Example with fetch (browser / Netlify app)**

```js
const res = await fetch(
  "https://dolce-quiz-leaderboard.lovable.app/api/public/score",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: playerName, score: finalScore }),
  }
);
const data = await res.json();
if (!data.success) throw new Error(data.error);
```

## Environment variables

| Variable                    | Context        | Notes                              |
|-----------------------------|----------------|------------------------------------|
| `VITE_SUPABASE_URL`         | Client + SSR   | Public Supabase project URL        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + SSR | Public anon key                |
| `SUPABASE_URL`              | Server only    | Same value, no `VITE_` prefix      |
| `SUPABASE_PUBLISHABLE_KEY`  | Server only    | Same anon key                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only    | Bypasses RLS — keep secret         |
| `ADMIN_PASSWORD`            | Server only    | Protects `/admin` backoffice       |

## Pages

| URL      | Description                                      |
|----------|--------------------------------------------------|
| `/`      | Public TV leaderboard (1920×1080, auto-scroll)  |
| `/admin` | Password-protected entry management             |
