-- ============================================================
-- Pawn to Queen — Phase 2: Switch user_id columns for Clerk
--
-- Clerk's user IDs are strings (e.g. "user_2AbcXyz123"), not UUIDs.
-- We drop the FK to auth.users (which Clerk doesn't populate), drop
-- the RLS policies (they reference user_id, which would otherwise
-- block the column-type change), and convert user_id columns to text.
--
-- DESTRUCTIVE: this migration TRUNCATES every data table so we
-- start fresh. The user picked "start fresh" during Phase 2 setup.
-- If you decide later to migrate Supabase users → Clerk users, do
-- it BEFORE running this migration.
--
-- Order matters here:
--   1. Drop RLS policies (otherwise altering user_id fails — policies
--      depend on the column).
--   2. Truncate data tables.
--   3. Drop the FK constraints to auth.users.
--   4. Alter user_id columns from uuid → text.
-- ============================================================

-- ─── 1. Drop ALL owner-only policies ─────────────────────────────────
-- They reference user_id, so they must go before we change its type.

drop policy if exists "profiles_select_own"        on public.profiles;
drop policy if exists "profiles_insert_own"        on public.profiles;
drop policy if exists "profiles_update_own"        on public.profiles;
drop policy if exists "profiles_delete_own"        on public.profiles;

drop policy if exists "rating_entries_select_own"  on public.rating_entries;
drop policy if exists "rating_entries_insert_own"  on public.rating_entries;
drop policy if exists "rating_entries_update_own"  on public.rating_entries;
drop policy if exists "rating_entries_delete_own"  on public.rating_entries;

drop policy if exists "games_select_own"           on public.games;
drop policy if exists "games_insert_own"           on public.games;
drop policy if exists "games_update_own"           on public.games;
drop policy if exists "games_delete_own"           on public.games;

drop policy if exists "puzzles_select_own"         on public.puzzles;
drop policy if exists "puzzles_insert_own"         on public.puzzles;
drop policy if exists "puzzles_update_own"         on public.puzzles;
drop policy if exists "puzzles_delete_own"         on public.puzzles;

drop policy if exists "goals_select_own"           on public.goals;
drop policy if exists "goals_insert_own"           on public.goals;
drop policy if exists "goals_update_own"           on public.goals;
drop policy if exists "goals_delete_own"           on public.goals;

drop policy if exists "journal_select_own"         on public.journal;
drop policy if exists "journal_insert_own"         on public.journal;
drop policy if exists "journal_update_own"         on public.journal;
drop policy if exists "journal_delete_own"         on public.journal;

drop policy if exists "study_sessions_select_own"  on public.study_sessions;
drop policy if exists "study_sessions_insert_own"  on public.study_sessions;
drop policy if exists "study_sessions_update_own"  on public.study_sessions;
drop policy if exists "study_sessions_delete_own"  on public.study_sessions;

drop policy if exists "achievements_select_own"    on public.achievements;
drop policy if exists "achievements_insert_own"    on public.achievements;
drop policy if exists "achievements_delete_own"    on public.achievements;

-- Older catch-all policies from the dashboard's "enable RLS" template.
drop policy if exists "Users can manage their own profile"  on public.profiles;
drop policy if exists "Users can manage their own ratings"  on public.rating_entries;


-- ─── 2. Truncate (avoid orphaned FK rows when we drop FKs) ────────────

truncate table
  public.rating_entries,
  public.games,
  public.puzzles,
  public.goals,
  public.journal,
  public.study_sessions,
  public.achievements
restart identity;

-- profiles has the PK = user_id, so its truncate cascades
truncate table public.profiles cascade;


-- ─── 3. Drop FK constraints to auth.users ─────────────────────────────
-- The constraint names are Postgres-generated. We discover them by
-- querying pg_constraint and dropping anything that references auth.users.

do $$
declare r record;
begin
  for r in
    select c.conname, t.relname
    from pg_constraint c
    join pg_class t       on c.conrelid = t.oid
    join pg_namespace n   on n.oid = t.relnamespace
    join pg_class t2      on c.confrelid = t2.oid
    join pg_namespace n2  on n2.oid = t2.relnamespace
    where n.nspname  = 'public'
      and n2.nspname = 'auth'
      and t2.relname = 'users'
      and c.contype  = 'f'
  loop
    execute format('alter table public.%I drop constraint %I', r.relname, r.conname);
  end loop;
end$$;


-- ─── 4. Change user_id columns from uuid → text ───────────────────────
-- Need to drop the PK on profiles first (it's also user_id), then
-- restore it after the type change.

alter table public.profiles        drop constraint if exists profiles_pkey;
alter table public.profiles        alter column user_id type text using user_id::text;
alter table public.profiles        add primary key (user_id);

alter table public.rating_entries  alter column user_id type text using user_id::text;
alter table public.games           alter column user_id type text using user_id::text;
alter table public.puzzles         alter column user_id type text using user_id::text;
alter table public.goals           alter column user_id type text using user_id::text;
alter table public.journal         alter column user_id type text using user_id::text;
alter table public.study_sessions  alter column user_id type text using user_id::text;
alter table public.achievements    alter column user_id type text using user_id::text;


-- RLS stays ENABLED on every table — so anon/authenticated clients
-- (other than the service role) can't read or write. Server actions
-- go through src/supabase/admin.ts which uses SUPABASE_SERVICE_ROLE_KEY
-- and bypasses RLS by design.
--
-- When we migrate to Clerk's Supabase JWT template (Phase 5), policies
-- will be re-added using a JWT claim that reads the Clerk user id.
-- The text type for user_id supports that out of the box.
