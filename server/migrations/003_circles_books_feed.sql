-- 003_circles_books_feed.sql
--
-- circles, circle_members, books, user_books, reviews, feed_posts, reactions,
-- comments — the rest of the schema in docs/database.md. These tables already
-- exist in the live project (created before this migration set started being
-- tracked); this file is the missing reproducible record of them, written
-- with `if not exists` throughout so running it against the live DB is a
-- no-op. FKs point at public.users directly — see 001/002 for why.
--
-- A brand-new clone: run 001, then this file, then 002 is a no-op (nothing
-- to repoint, since these tables were created with the right FK to begin
-- with).

create extension if not exists pgcrypto;

-- -------------------------------------------------------------- circles
create table if not exists circles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text unique not null,
  creator_id   uuid not null references users(id),
  created_at   timestamptz not null default now()
);
-- creator_id is an audit column only. It grants NO extra permissions.

-- ------------------------------------------------------- circle_members
create table if not exists circle_members (
  circle_id  uuid not null references circles(id) on delete cascade,
  user_id    uuid not null references users(id)   on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index if not exists circle_members_user_id_idx on circle_members (user_id);

-- ---------------------------------------------------------------- books
-- Shared catalog: one row per title, reused across every user.
create table if not exists books (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  author      text,
  genre       text,
  page_count  int check (page_count is null or page_count > 0),
  cover_url   text,
  isbn        text,
  created_at  timestamptz not null default now()
);
create unique index if not exists books_isbn_key on books (isbn) where isbn is not null;
create index if not exists books_title_author_idx on books (lower(title), lower(coalesce(author,'')));

-- ----------------------------------------------------------- user_books
-- A user's personal copy/status of a catalog book.
create table if not exists user_books (
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
create index if not exists user_books_user_status_idx on user_books (user_id, status);
create index if not exists user_books_finished_at_idx on user_books (finished_at) where status = 'finished';

-- -------------------------------------------------------------- reviews
create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  user_book_id  uuid not null unique references user_books(id) on delete cascade,
  rating        numeric(2,1) check (rating >= 0 and rating <= 5),
  qa_json       jsonb not null default '[]'::jsonb,   -- [{"q":"...","a":"..."}]
  article_text  text not null,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------- feed_posts
create table if not exists feed_posts (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references circles(id) on delete cascade,
  user_id       uuid not null references users(id)   on delete cascade,
  type          text not null check (type in ('started','added','finished')),
  user_book_id  uuid references user_books(id) on delete cascade,
  created_at    timestamptz not null default now()
);
create index if not exists feed_posts_circle_created_idx on feed_posts (circle_id, created_at desc);

-- ------------------------------------------------------------ reactions
create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references feed_posts(id) on delete cascade,
  user_id     uuid not null references users(id)      on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)      -- one like per user per post
);

-- ------------------------------------------------------------- comments
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references feed_posts(id) on delete cascade,
  user_id     uuid not null references users(id)      on delete cascade,
  content     text not null check (length(trim(content)) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_created_idx on comments (post_id, created_at);

-- lock everything down; service-role bypasses this, anon key gets nothing
alter table circles        enable row level security;
alter table circle_members enable row level security;
alter table books          enable row level security;
alter table user_books     enable row level security;
alter table reviews        enable row level security;
alter table feed_posts     enable row level security;
alter table reactions      enable row level security;
alter table comments       enable row level security;
