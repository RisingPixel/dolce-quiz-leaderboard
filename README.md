# 🏆 Dolce Quiz Leaderboard

The leaderboard for the **La Dolce Quiz** event — https://la-dolce-quiz.netlify.app/

Built with [TanStack Start](https://tanstack.com/start), [Supabase](https://supabase.com), and deployed on [Cloudflare Workers](https://workers.cloudflare.com).

---

## 🌐 URLs

| | |
|---|---|
| **Public Leaderboard** | https://dolce-quiz-leaderboard.lovable.app/ |
| **Admin Panel** | https://dolce-quiz-leaderboard.lovable.app/admin |
| **Git Repository** | https://github.com/RisingPixel/dolce-quiz-leaderboard |

> **Admin password:** `dolcepassword2026`

---

## 🎮 How It Works

The quiz app submits scores to the leaderboard API after each game:

```http
POST /api/public/score
Content-Type: application/json

{
  "name": "Mario",
  "score": 150
}
```

The leaderboard stores the player name, score, and a server-side timestamp, then automatically updates the ranking. The player appears on screen within seconds.

### Score Rules

| Field | Constraint |
|---|---|
| `name` | 1–30 characters, passes a profanity filter (IT + EN) |
| `score` | Integer, 0–1 000 000 |

Ranking is **score descending**; ties are broken by **earliest submission**.

---

## 📺 Public Leaderboard (`/`)

Designed for **Full HD 16:9** TVs and kiosks at the venue.

- Shows the **Top 20** players
- **Auto-refreshes** every 5 seconds via Supabase polling
- **Smooth auto-scroll** when content overflows the screen
- **Top 3** highlighted with special styling
- Italian dark-teal visual theme (Cormorant Garamond + Inter)

---

## 🛠️ Admin Panel (`/admin`)

A password-protected backoffice for event staff.

- View all submitted scores
- Delete invalid or test entries
- No manual score editing (scores come from the game only)

Authentication is password-only (`ADMIN_PASSWORD` env var); the password is re-sent with every mutating request — there are no sessions or cookies.

---

## 🗄️ Database

Hosted on **Supabase**. Single table:

**`public.leaderboard_entries`**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `name` | `text` | NOT NULL |
| `score` | `integer` | NOT NULL, ≥ 0 |
| `created_at` | `timestamptz` | Server timestamp (DEFAULT `now()`) |

An index on `(score DESC, created_at ASC)` matches the leaderboard sort order exactly.

Row-Level Security is enabled: `SELECT` is open to the public, but `INSERT` and `DELETE` go through the service-role key (server only).

---

## 🔌 Game Integration

Any Rising Pixel game can post a score with a single HTTP call:

```http
POST https://dolce-quiz-leaderboard.lovable.app/api/public/score
Content-Type: application/json
Access-Control-Allow-Origin: *

{
  "name": "Player Name",
  "score": 123
}
```

The endpoint is CORS-open (`*`) so it can be called directly from a browser or a game client. The player appears on the leaderboard within the next 5-second poll cycle.

---

## 🧑‍💻 Local Development

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.x

```bash
# Install dependencies
bun install

# Copy and fill in environment variables
cp .env.example .env

# Start the dev server (Vite + TanStack Start SSR)
bun run dev
```

### Environment Variables

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Client + SSR | Public Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + SSR | Public anon key |
| `SUPABASE_URL` | Server only | Same value, no `VITE_` prefix |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | Same anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS — keep secret |
| `ADMIN_PASSWORD` | Server only | Password for the admin panel |

### Other Commands

```bash
bun run build   # Production build (targets Cloudflare Workers via Nitro)
bun run lint    # ESLint
bun run format  # Prettier
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR, file-based routing) |
| Database | [Supabase](https://supabase.com) (Postgres + RLS) |
| Styling | Tailwind CSS + custom CSS variables |
| Build | [Vite](https://vitejs.dev) + [Nitro](https://nitro.build) |
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com) |
| Package manager | [Bun](https://bun.sh) |
