# environment.md

Env vars, Supabase project setup, and how to run the thing. Load when scaffolding or when a key is missing.

## Server — `server/.env`

```bash
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase — Project Settings → API
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # SERVER ONLY. Never ship to the client.
SUPABASE_STORAGE_BUCKET=book-scans

# Google Gemini — https://aistudio.google.com/apikey
GEMINI_API_KEY=...
GEMINI_TEXT_MODEL=gemini-2.0-flash
GEMINI_VISION_MODEL=gemini-2.0-flash

# Google Books — optional; the API works unkeyed at a lower quota
GOOGLE_BOOKS_API_KEY=
```

## Client — `client/.env`

```bash
VITE_API_URL=http://localhost:4000/api

# Supabase — Project Settings → API. The anon key is public by design
# (RLS + no permissive policies make it useless without Express), and it
# is the one Supabase credential this client is allowed to hold — it's
# what drives Google sign-in via Supabase Auth. See features/auth.md.
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Do not add `VITE_GEMINI_*` or any other external-API key here — Gemini and Google Books stay behind Express. `VITE_SUPABASE_SERVICE_ROLE_KEY` must never exist anywhere in `client/`.

## Boot-time validation

`server/src/config/env.js` reads and validates every variable at startup and **throws before the server listens** if one is missing. Failing loudly at boot beats a 500 three days later.

```js
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  CLIENT_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_STORAGE_BUCKET: z.string().default('book-scans'),
  GEMINI_API_KEY: z.string().min(10),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_VISION_MODEL: z.string().default('gemini-2.0-flash'),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
```

Nothing else in the codebase reads `process.env`. Import `env` instead.

## Supabase project setup (once, day 1)

1. Create a project at supabase.com. Save the DB password.
2. **SQL Editor** → paste `server/migrations/001_init.sql` (the schema in `database.md`) → Run.
3. **Storage** → New bucket → name `book-scans`, **Public** (cover scans are not sensitive and public URLs keep the client simple).
4. **Project Settings → API** → copy the project URL and the `service_role` key into `server/.env`; copy the project URL and the `anon` key into `client/.env`.
5. **Authentication → Providers** → enable **Google**. You'll need a Google Cloud OAuth 2.0 Client ID (Web application) — set its authorized redirect URI to the callback URL Supabase shows on this page (`https://<project-ref>.supabase.co/auth/v1/callback`), then paste that Client ID + Secret into the Supabase provider settings.
6. **Authentication → URL Configuration** → add `http://localhost:5173` (and later the Vercel URL) to **Redirect URLs**, or `signInWithOAuth`'s `redirectTo` will be rejected.

## Google Gemini setup

1. Get a key at aistudio.google.com/apikey (free tier is enough for this project).
2. Verify the model name is current before relying on it — model IDs change. `gemini-2.0-flash` handles both vision and text.

## Local run

```bash
# terminal 1
cd server && npm install && npm run dev      # nodemon index.js → :4000

# terminal 2
cd client && npm install && npm run dev      # vite → :5173
```

Scripts:

```jsonc
// server/package.json
{ "type": "module", "scripts": { "dev": "nodemon index.js", "start": "node index.js", "seed": "node scripts/seed.js" } }

// client/package.json
{ "type": "module", "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" } }
```

## CORS

Development allows `http://localhost:5173`. Production allows exactly the deployed client origin — never `*`, because the app sends an `Authorization` header.

## Sanity checks when something is broken

| Symptom | First thing to check |
|---|---|
| Every request 401s | Client isn't attaching `Authorization`, or the Supabase session expired/was revoked |
| Google sign-in redirects to an error page | Redirect URL not whitelisted in Supabase Auth → URL Configuration, or the Google Cloud OAuth client's redirect URI doesn't exactly match Supabase's callback URL |
| `GET /api/auth/me` 404s right after first sign-in | `public.users` row was never provisioned — see `features/auth.md` |
| CORS error in console | `CLIENT_URL` doesn't exactly match the browser origin (port, trailing slash) |
| Supabase returns empty arrays with no error | Using the anon key instead of service-role — RLS is silently filtering everything |
| Scan endpoint 500s | Bucket doesn't exist, or the image exceeds the 5MB multer limit |
| Gemini 404 on the model | Model ID is stale; check the current name |
| Book insert fails with 23505 | The `unique (user_id, book_id)` constraint — return a 409, not a 500 |
