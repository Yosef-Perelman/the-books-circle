# database.md

Supabase Postgres schema. **This file is the single source of truth for the data model.** Change it here first, then write a migration.

Load this for anything touching tables, queries, or models.

## Ground rules

- Postgres on Supabase. Accessed only from Express via `@supabase/supabase-js` with the **service-role key**.
- **RLS is not our authorization layer.** Because everything goes through Express with the service-role key, RLS is bypassed. Authorization is enforced in services/middleware. Enable RLS on all tables with no permissive policies anyway, so a leaked anon key is useless.
- All ids are `uuid` with `DEFAULT gen_random_uuid()`.
- All timestamps are `timestamptz DEFAULT now()`.
- Columns are `snake_case`. Models map to `camelCase` before returning. Nothing above the model layer sees `snake_case`.
- Deletes: none in MVP. Nothing in the UI deletes a row except unliking a post.

## Schema

```sql
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- users
-- id mirrors auth.users(id) — Supabase Auth's own identity table.
-- No password_hash: Google sign-in via Supabase Auth owns credentials, we don't.
create table users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text unique not null,
  display_name   text not null,
  avatar_url     text,
  created_at     timestamptz not null default now()
);
create index on users (lower(email));

-- -------------------------------------------------------------- circles
create table circles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text unique not null,
  creator_id   uuid not null references users(id),
  created_at   timestamptz not null default now()
);

-- creator_id is an audit column only. It grants NO extra permissions.

-- ------------------------------------------------------- circle_members
create table circle_members (
  circle_id  uuid not null references circles(id) on delete cascade,
  user_id    uuid not null references users(id)   on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index on circle_members (user_id);

-- ---------------------------------------------------------------- books
-- Shared catalog: one row per title, reused across every user.
create table books (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  author      text,
  genre       text,
  page_count  int check (page_count is null or page_count > 0),
  cover_url   text,
  isbn        text,
  created_at  timestamptz not null default now()
);
create unique index books_isbn_key on books (isbn) where isbn is not null;
create index books_title_author_idx on books (lower(title), lower(coalesce(author,'')));

-- ----------------------------------------------------------- user_books
-- A user's personal copy/status of a catalog book.
create table user_books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  book_id     uuid not null references books(id),
  status      text not null default 'want' check (status in ('want','reading','finished')),
  source      text check (source in ('scan','search','manual')),
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, book_id)
);
create index user_books_user_status_idx   on user_books (user_id, status);
create index user_books_finished_at_idx   on user_books (finished_at) where status = 'finished';

-- -------------------------------------------------------------- reviews
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  user_book_id  uuid not null unique references user_books(id) on delete cascade,
  rating        numeric(2,1) check (rating >= 0 and rating <= 5),
  qa_json       jsonb not null default '[]'::jsonb,   -- [{"q":"...","a":"..."}]
  article_text  text not null,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------- feed_posts
create table feed_posts (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references circles(id) on delete cascade,
  user_id       uuid not null references users(id)   on delete cascade,
  type          text not null check (type in ('started','added','finished')),
  user_book_id  uuid references user_books(id) on delete cascade,
  created_at    timestamptz not null default now()
);
create index feed_posts_circle_created_idx on feed_posts (circle_id, created_at desc);

-- ------------------------------------------------------------ reactions
create table reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references feed_posts(id) on delete cascade,
  user_id     uuid not null references users(id)      on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)      -- one like per user per post
);

-- ------------------------------------------------------------- comments
create table comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references feed_posts(id) on delete cascade,
  user_id     uuid not null references users(id)      on delete cascade,
  content     text not null check (length(trim(content)) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index comments_post_created_idx on comments (post_id, created_at);

-- lock everything down; service-role bypasses this, anon key gets nothing
alter table users          enable row level security;
alter table circles        enable row level security;
alter table circle_members enable row level security;
alter table books          enable row level security;
alter table user_books     enable row level security;
alter table reviews        enable row level security;
alter table feed_posts     enable row level security;
alter table reactions      enable row level security;
alter table comments       enable row level security;
```

## User provisioning

`public.users` is not populated automatically when someone signs in with Google — Supabase only writes to its own `auth.users`. The first request that hits `GET /api/auth/me` for a given `auth.users.id` must upsert a matching `public.users` row (`id`, `email`, `display_name`, `avatar_url` sourced from the Supabase user's `user_metadata`) before reading it back. See `features/auth.md`. No DB trigger — do it in the service layer, same as everything else in this file.

## Why it's shaped this way

- **`books` is a shared catalog.** Two members reading *The Hobbit* point at the same row. This is what makes the deferred per-book page a free query later, and it makes the "Various Genres" leaderboard category possible without duplicating genre strings.
- **`user_books` is the unit of ownership.** Every authorization check about a book is "does `user_books.user_id` equal `req.user.id`?"
- **`unique (user_id, book_id)`** means a user cannot add the same title twice. Handle the constraint violation as a friendly 409, not a 500.
- **`reviews` keeps both `qa_json` and `article_text`.** Never discard the raw interview — it enables regeneration and is the "explainable AI" talking point in the demo.
- **`feed_posts.user_book_id` is nullable** so a plain text composer post could be added later; MVP only creates the three typed posts.
- **No leaderboard table.** All four categories are aggregations. See `features/leaderboard.md`.
- **No streak table.** Streaks are computed from `finished_at`.

## Book deduplication rule

When adding a book from any of the three sources, resolve the catalog row in this order:

1. If an ISBN is present → look up `books` by that ISBN. Match wins.
2. Else → look up by `lower(title)` + `lower(author)`. Match wins.
3. Else → insert a new `books` row.

Put this in `book.model.findOrCreate()`. Never let a controller do it.

## Status transition rules (enforce in `userBook.service`)

| To | Side effects | Allowed from |
|---|---|---|
| `want` | clear `started_at`, `finished_at` | any |
| `reading` | set `started_at = now()` if null; create `started` feed post | any |
| `finished` | set `finished_at = now()`; create `finished` feed post; requires a review to exist | any |

- `finished` is **only** reachable through the review endpoint (`POST /api/user-books/:id/review`). A bare `PATCH` to `status: 'finished'` is rejected with 400 — the interview is mandatory.
- Re-entering a status the row is already in is a no-op 200, not an error, and creates no duplicate post.
- `updated_at` is set by the service on every write (no trigger; keep it simple).

## Feed post creation

Posts are created **by the service that caused them**, never by the client:

| Action | Post type | Created in |
|---|---|---|
| add a book (any source) | `added` | `userBook.service.addBook` |
| status → `reading` | `started` | `userBook.service.updateStatus` |
| review submitted | `finished` | `review.service.createReview` |

A post is created **once per circle the user belongs to**. In MVP that's their active circle; write the helper to loop over memberships so multi-circle is free later.

## Common queries

**Circle feed** (one round trip using PostgREST embedding):

```js
supabase.from('feed_posts')
  .select(`
    id, type, created_at,
    user:users ( id, display_name, avatar_url ),
    user_book:user_books (
      id, status,
      book:books ( id, title, author, cover_url, page_count, genre ),
      review:reviews ( rating, article_text )
    ),
    reactions ( user_id ),
    comments ( id )
  `)
  .eq('circle_id', circleId)
  .order('created_at', { ascending: false })
  .limit(50)
```

Then map in the model: `likeCount = reactions.length`, `likedByMe = reactions.some(r => r.user_id === viewerId)`, `commentCount = comments.length`. Do not send raw `reactions` arrays to the client.

**A user's shelf by status:**

```js
supabase.from('user_books')
  .select('id, status, started_at, finished_at, book:books(*), review:reviews(rating, article_text)')
  .eq('user_id', userId)
  .eq('status', status)
  .order('updated_at', { ascending: false })
```

**Circle member ids** (needed by every leaderboard query):

```js
supabase.from('circle_members').select('user_id').eq('circle_id', circleId)
```

## Migrations

Keep numbered SQL files in `server/migrations/`:

```
001_users.sql               public.users + backfill from auth.users
002_repoint_user_fks.sql    user FKs → public.users (see below)
003_<what_changed>.sql
```

Apply via the Supabase SQL editor or the Supabase MCP `apply_migration`. There is no migration runner in the app.

**Applied state (2026-08-10):** all nine tables and every index above exist in project `xklpjrfajiaquzvmewma`, all empty except `users` (2 rows, backfilled from the two Google sign-ins). Migrations `001` and `002` are applied.

### Every user FK must reference `public.users`, never `auth.users`

This bit the project once already and the failure is silent, so it's worth stating plainly.

The six `user_id` / `creator_id` columns were originally pointed at `auth.users(id)`. That is valid SQL and every insert works — but **PostgREST resolves embedded selects by following a foreign key into a table it exposes**, and `auth.users` is not exposed through the API. So this, from the feed query:

```js
.select('id, type, created_at, user:users ( id, display_name, avatar_url ), ...')
```

…fails to resolve the author, and posts come back with no user attached. Same for circle members and comments. Nothing errors at the SQL level; the data is just missing.

`public.users` is the app-facing identity table and the only thing FKs should reference. `users.id → auth.users(id) on delete cascade` is the single link between the two, and it belongs in exactly that one place.

If you add a table with a user column, reference `users(id)`.

## Seed data

For demo purposes, seed one circle (`Friends 1`, code `F1-8KZQ`) with 4–5 users, ~10 catalog books across ≥4 distinct genres, and a spread of `finished_at` dates inside the current month **and** previous months — otherwise the Monthly/All-Time leaderboard toggle looks identical and the demo falls flat. Keep the seed script at `server/scripts/seed.js`.
