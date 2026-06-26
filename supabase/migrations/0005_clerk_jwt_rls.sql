-- ============================================================
-- Pawn to Queen — Phase 5: Restore RLS using Clerk JWT
--
-- After migration 0003 we dropped user-scoped policies entirely and
-- relied on the service-role key in server actions. That works but is
-- a single point of compromise — if the service-role key leaks, RLS
-- doesn't help anyone.
--
-- This migration restores RLS the right way: Clerk signs JWTs with
-- Supabase's JWT secret, and every policy reads the sub claim
-- (= the Clerk user id, a text string like "user_2AbcXyz").
--
-- The new policy expression is:
--    (auth.jwt() ->> 'sub') = user_id
--
-- Server actions can keep using service-role for now (the policies
-- ignore service-role, by design). When we want to fully drop
-- service-role, we switch to src/supabase/user.ts (added in the
-- same patch) which passes the Clerk JWT.
--
-- Apply order: AFTER 0001 + 0002 + 0003. Idempotent.
-- ============================================================

-- Helper — returns the JWT sub (Clerk user id) as text. Wrapping it
-- keeps policy expressions short and lets us change the source later.
create or replace function public.clerk_user_id() returns text
language sql stable
as $$
  select auth.jwt() ->> 'sub';
$$;

-- ─── Owner-only policies, JWT-scoped ─────────────────────────────────
-- The previous migration (0003) dropped these; we recreate them with
-- the new Clerk-aware expression.

-- profiles
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_delete_own"  on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (public.clerk_user_id() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (public.clerk_user_id() = user_id);
create policy "profiles_update_own" on public.profiles for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (public.clerk_user_id() = user_id);

-- rating_entries
drop policy if exists "rating_entries_select_own"  on public.rating_entries;
drop policy if exists "rating_entries_insert_own"  on public.rating_entries;
drop policy if exists "rating_entries_update_own"  on public.rating_entries;
drop policy if exists "rating_entries_delete_own"  on public.rating_entries;
create policy "rating_entries_select_own" on public.rating_entries for select using (public.clerk_user_id() = user_id);
create policy "rating_entries_insert_own" on public.rating_entries for insert with check (public.clerk_user_id() = user_id);
create policy "rating_entries_update_own" on public.rating_entries for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "rating_entries_delete_own" on public.rating_entries for delete using (public.clerk_user_id() = user_id);

-- games
drop policy if exists "games_select_own"  on public.games;
drop policy if exists "games_insert_own"  on public.games;
drop policy if exists "games_update_own"  on public.games;
drop policy if exists "games_delete_own"  on public.games;
create policy "games_select_own" on public.games for select using (public.clerk_user_id() = user_id);
create policy "games_insert_own" on public.games for insert with check (public.clerk_user_id() = user_id);
create policy "games_update_own" on public.games for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "games_delete_own" on public.games for delete using (public.clerk_user_id() = user_id);

-- puzzles
drop policy if exists "puzzles_select_own"  on public.puzzles;
drop policy if exists "puzzles_insert_own"  on public.puzzles;
drop policy if exists "puzzles_update_own"  on public.puzzles;
drop policy if exists "puzzles_delete_own"  on public.puzzles;
create policy "puzzles_select_own" on public.puzzles for select using (public.clerk_user_id() = user_id);
create policy "puzzles_insert_own" on public.puzzles for insert with check (public.clerk_user_id() = user_id);
create policy "puzzles_update_own" on public.puzzles for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "puzzles_delete_own" on public.puzzles for delete using (public.clerk_user_id() = user_id);

-- goals
drop policy if exists "goals_select_own"  on public.goals;
drop policy if exists "goals_insert_own"  on public.goals;
drop policy if exists "goals_update_own"  on public.goals;
drop policy if exists "goals_delete_own"  on public.goals;
create policy "goals_select_own" on public.goals for select using (public.clerk_user_id() = user_id);
create policy "goals_insert_own" on public.goals for insert with check (public.clerk_user_id() = user_id);
create policy "goals_update_own" on public.goals for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "goals_delete_own" on public.goals for delete using (public.clerk_user_id() = user_id);

-- journal
drop policy if exists "journal_select_own"  on public.journal;
drop policy if exists "journal_insert_own"  on public.journal;
drop policy if exists "journal_update_own"  on public.journal;
drop policy if exists "journal_delete_own"  on public.journal;
create policy "journal_select_own" on public.journal for select using (public.clerk_user_id() = user_id);
create policy "journal_insert_own" on public.journal for insert with check (public.clerk_user_id() = user_id);
create policy "journal_update_own" on public.journal for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "journal_delete_own" on public.journal for delete using (public.clerk_user_id() = user_id);

-- study_sessions
drop policy if exists "study_sessions_select_own"  on public.study_sessions;
drop policy if exists "study_sessions_insert_own"  on public.study_sessions;
drop policy if exists "study_sessions_update_own"  on public.study_sessions;
drop policy if exists "study_sessions_delete_own"  on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions for select using (public.clerk_user_id() = user_id);
create policy "study_sessions_insert_own" on public.study_sessions for insert with check (public.clerk_user_id() = user_id);
create policy "study_sessions_update_own" on public.study_sessions for update using (public.clerk_user_id() = user_id) with check (public.clerk_user_id() = user_id);
create policy "study_sessions_delete_own" on public.study_sessions for delete using (public.clerk_user_id() = user_id);

-- achievements
drop policy if exists "achievements_select_own"  on public.achievements;
drop policy if exists "achievements_insert_own"  on public.achievements;
drop policy if exists "achievements_delete_own"  on public.achievements;
create policy "achievements_select_own" on public.achievements for select using (public.clerk_user_id() = user_id);
create policy "achievements_insert_own" on public.achievements for insert with check (public.clerk_user_id() = user_id);
create policy "achievements_delete_own" on public.achievements for delete using (public.clerk_user_id() = user_id);

-- Service-role still bypasses RLS by Postgres default. So existing
-- server actions using src/supabase/admin.ts keep working unchanged.
-- When a server action uses src/supabase/user.ts (the new Clerk-JWT
-- client), the JWT is required and these policies enforce ownership.
