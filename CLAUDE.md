# CLAUDE.md — The Reading Circles

Agent operating instructions. Read this first, every session. Keep it in context; load everything else on demand.

## What this project is

A social reading-tracker web app. You read inside a small private circle of friends. Adding a book is a photo snap. Finishing a book triggers an AI interview that becomes a newspaper-style review article, auto-posted to the circle feed.

Bootcamp final project — 5 days, 3 people. Ship working over perfect.

## The one rule that matters most

**Read `docs/INDEX.md` before touching any code.** It is the router. It tells you which 1–3 docs to load for the task at hand. Do not load the whole `docs/` folder — that defeats its purpose.

Workflow for every task:

1. Read `docs/INDEX.md`.
2. Load only the docs it points you to.
3. Implement.
4. If you changed a contract (route, table, prop, env var), update the owning doc in the same commit.

## Stack (decided — do not re-litigate)

| Layer | Choice |
|---|---|
| Repo | Monorepo: `/client`, `/server` |
| Language | **JavaScript** (ESM). No TypeScript. |
| Client | React 18 + Vite, React Router, Zustand, Mantine |
| Server | Express (MVC), Zod validation, Google sign-in via Supabase Auth (server validates the Supabase-issued token) |
| Database | Supabase Postgres, accessed via `@supabase/supabase-js` (service-role key, server-side only) |
| Storage | Supabase Storage bucket `book-scans` |
| AI | **Google Gemini** — one SDK for vision + text |
| Books metadata | Google Books API |
| Deploy | Client → Vercel · Server → Render · DB/Storage → Supabase |

## Non-negotiable constraints

- **Auth is Google sign-in via Supabase Auth.** The client calls `supabase.auth.signInWithOAuth({ provider: 'google' })` directly and holds the resulting session. Express never issues its own token — `requireAuth` validates the Supabase-issued access token on every protected request via `supabase.auth.getUser(token)`.
- **The Supabase service-role key never reaches the client.** All Postgres/Storage access goes through Express. The one carve-out is auth itself: the client talks to Supabase Auth directly using the public anon key (`VITE_SUPABASE_ANON_KEY`), which is safe to expose by design. Everything else — books, circles, posts, reviews — only ever calls `/api/*`.
- **No admin roles.** Every circle member has equal permissions. There is no "owner" of a circle beyond a `creator_id` audit column.
- **Authorization is enforced server-side.** Hiding a button on the client is not authorization. A user must not be able to mutate another user's `user_books` row even with a guessed ID.
- **Every write is validated with Zod** before it reaches a controller's business logic.
- **One error shape across the whole API.** See `docs/api-contract.md`.
- **Errors are visible to the user** — inline field errors, or a toast. Never only `console.log`.
- **Responsive.** Desktop 3-column feed collapses to single column with drawers on mobile.

## Spec precedence

When sources disagree, this order wins:

1. `docs/` in this repo (the current truth)
2. `reading_circles_handoff.md` (original written spec)
3. The mockup PNGs

The mockups were drawn *before* several rules were decided. Where they conflict, the written spec wins. Specifically the mockups are **wrong** about: cover images on feed posts (there are none on `finished` posts), the profile stats line (removed), and status pills on other members' profiles (read-only there).

## Code conventions (short version)

- ESM `import`/`export` everywhere, `"type": "module"` in both package.json files.
- Server: `routes → middleware → controller → service → model`. Controllers hold no SQL. Models hold no HTTP.
- Client: feature folders under `src/features/<feature>/`. Shared UI in `src/components/`.
- Files/folders `kebab-case`. React components `PascalCase.jsx`. Everything else `camelCase.js`.
- DB columns `snake_case`. JS variables `camelCase`. Map at the model boundary, never leak `snake_case` past it.
- Never hardcode a hex color. Use the Mantine theme token. See `docs/design/colors.md`.

Full version: `docs/conventions.md`.

## What you must not do

- Do not install packages beyond what `docs/architecture.md` lists without saying so first.
- Do not invent API routes. `docs/api-contract.md` is the contract; extend it there first.
- Do not change the DB schema ad hoc. Change `docs/database.md` and write a migration.
- Do not build deferred features (book detail page, notifications, recommendations, monthly recap) unless explicitly asked.
- Do not write tests unless asked — there is no test suite in this build.

## Definition of done for a feature

- [ ] Server route validated, authorized, and returning the standard error shape
- [ ] Client wired with loading + error + empty states
- [ ] Responsive at 375px and 1440px
- [ ] Colors and fonts come from theme tokens
- [ ] The owning doc in `docs/` still matches reality
