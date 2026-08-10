-- 002_repoint_user_fks.sql
--
-- Every user-referencing foreign key was pointing at auth.users instead of
-- public.users. That breaks the app in a non-obvious way: PostgREST resolves
-- embedded selects (`user:users ( id, display_name, avatar_url )`) by following a
-- foreign key into a table it exposes. auth.users is not exposed, so the feed
-- query, the circle-members query, and the comments query in docs/database.md all
-- fail to embed the author — they return posts with no user attached.
--
-- Re-point all six at public.users. Run AFTER 001, which creates that table and
-- backfills it; the FK validation scan needs a matching row for every existing
-- child row. All six child tables were empty when this was written, so the scan
-- is trivial either way.
--
-- Cascade behaviour matches docs/database.md: creator_id is an audit column with
-- no cascade (deleting a user must not silently delete a circle other people are
-- in); everything else cascades with its owner.

alter table circles drop constraint if exists circles_creator_id_fkey;
alter table circles add constraint circles_creator_id_fkey
  foreign key (creator_id) references users(id);

alter table circle_members drop constraint if exists circle_members_user_id_fkey;
alter table circle_members add constraint circle_members_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

alter table user_books drop constraint if exists user_books_user_id_fkey;
alter table user_books add constraint user_books_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

alter table feed_posts drop constraint if exists feed_posts_user_id_fkey;
alter table feed_posts add constraint feed_posts_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

alter table reactions drop constraint if exists reactions_user_id_fkey;
alter table reactions add constraint reactions_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

alter table comments drop constraint if exists comments_user_id_fkey;
alter table comments add constraint comments_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;
