-- 001_users.sql
--
-- public.users mirrors auth.users.
--
-- Supabase Auth owns identity and sessions; auth.users is its table and we never
-- write to it. This table owns the app-level profile fields (display_name,
-- avatar_url) and — critically — is the table PostgREST can embed. auth.users is
-- not exposed through the API, so `user:users(...)` in the feed and circle queries
-- can only resolve against a table in the public schema. See docs/database.md.
--
-- Rows are provisioned lazily server-side in GET /api/auth/me (docs/features/auth.md).
-- The backfill at the bottom covers anyone who signed in before that existed.

create extension if not exists pgcrypto;

create table if not exists users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text not null,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

create index if not exists users_email_lower_idx on users (lower(email));

-- Service-role (Express) bypasses RLS. Enabling it with no policies means a leaked
-- anon key reads nothing. Authorization is enforced in Express, not here.
alter table users enable row level security;

-- Backfill anyone already in auth.users. Google puts the display name under
-- full_name, older providers under name; fall back to the email's local part so
-- display_name (NOT NULL) is always satisfiable.
insert into users (id, email, display_name, avatar_url, created_at)
select
  u.id,
  u.email,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    split_part(u.email, '@', 1)
  ),
  u.raw_user_meta_data->>'avatar_url',
  u.created_at
from auth.users u
where u.email is not null
on conflict (id) do nothing;
