-- ============================================================
-- Pawn to Queen — Phase 1: Row-Level Security
-- Apply AFTER 0001_initial_schema.sql.
-- Idempotent — drops then recreates each policy.
-- Pattern: every table is owner-only. The owner is auth.uid().
-- ============================================================

-- ─── Enable RLS on every table ────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.rating_entries  enable row level security;
alter table public.games           enable row level security;
alter table public.puzzles         enable row level security;
alter table public.goals           enable row level security;
alter table public.journal         enable row level security;
alter table public.study_sessions  enable row level security;
alter table public.achievements    enable row level security;


-- ─── profiles ─────────────────────────────────────────────────
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_delete_own"  on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);


-- ─── rating_entries ───────────────────────────────────────────
drop policy if exists "rating_entries_select_own"  on public.rating_entries;
drop policy if exists "rating_entries_insert_own"  on public.rating_entries;
drop policy if exists "rating_entries_update_own"  on public.rating_entries;
drop policy if exists "rating_entries_delete_own"  on public.rating_entries;

create policy "rating_entries_select_own"
  on public.rating_entries for select
  using (auth.uid() = user_id);

create policy "rating_entries_insert_own"
  on public.rating_entries for insert
  with check (auth.uid() = user_id);

create policy "rating_entries_update_own"
  on public.rating_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rating_entries_delete_own"
  on public.rating_entries for delete
  using (auth.uid() = user_id);


-- ─── games ────────────────────────────────────────────────────
drop policy if exists "games_select_own"  on public.games;
drop policy if exists "games_insert_own"  on public.games;
drop policy if exists "games_update_own"  on public.games;
drop policy if exists "games_delete_own"  on public.games;

create policy "games_select_own"
  on public.games for select
  using (auth.uid() = user_id);

create policy "games_insert_own"
  on public.games for insert
  with check (auth.uid() = user_id);

create policy "games_update_own"
  on public.games for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "games_delete_own"
  on public.games for delete
  using (auth.uid() = user_id);


-- ─── puzzles ──────────────────────────────────────────────────
drop policy if exists "puzzles_select_own"  on public.puzzles;
drop policy if exists "puzzles_insert_own"  on public.puzzles;
drop policy if exists "puzzles_update_own"  on public.puzzles;
drop policy if exists "puzzles_delete_own"  on public.puzzles;

create policy "puzzles_select_own"
  on public.puzzles for select
  using (auth.uid() = user_id);

create policy "puzzles_insert_own"
  on public.puzzles for insert
  with check (auth.uid() = user_id);

create policy "puzzles_update_own"
  on public.puzzles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "puzzles_delete_own"
  on public.puzzles for delete
  using (auth.uid() = user_id);


-- ─── goals ────────────────────────────────────────────────────
drop policy if exists "goals_select_own"  on public.goals;
drop policy if exists "goals_insert_own"  on public.goals;
drop policy if exists "goals_update_own"  on public.goals;
drop policy if exists "goals_delete_own"  on public.goals;

create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);


-- ─── journal ──────────────────────────────────────────────────
drop policy if exists "journal_select_own"  on public.journal;
drop policy if exists "journal_insert_own"  on public.journal;
drop policy if exists "journal_update_own"  on public.journal;
drop policy if exists "journal_delete_own"  on public.journal;

create policy "journal_select_own"
  on public.journal for select
  using (auth.uid() = user_id);

create policy "journal_insert_own"
  on public.journal for insert
  with check (auth.uid() = user_id);

create policy "journal_update_own"
  on public.journal for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "journal_delete_own"
  on public.journal for delete
  using (auth.uid() = user_id);


-- ─── study_sessions ───────────────────────────────────────────
drop policy if exists "study_sessions_select_own"  on public.study_sessions;
drop policy if exists "study_sessions_insert_own"  on public.study_sessions;
drop policy if exists "study_sessions_update_own"  on public.study_sessions;
drop policy if exists "study_sessions_delete_own"  on public.study_sessions;

create policy "study_sessions_select_own"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "study_sessions_insert_own"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "study_sessions_update_own"
  on public.study_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "study_sessions_delete_own"
  on public.study_sessions for delete
  using (auth.uid() = user_id);


-- ─── achievements ─────────────────────────────────────────────
-- Inserts mostly come from server-side achievement-check logic, so we
-- allow the user to insert their own (you can lock this down to
-- service_role only later if you want).

drop policy if exists "achievements_select_own"  on public.achievements;
drop policy if exists "achievements_insert_own"  on public.achievements;
drop policy if exists "achievements_delete_own"  on public.achievements;

create policy "achievements_select_own"
  on public.achievements for select
  using (auth.uid() = user_id);

create policy "achievements_insert_own"
  on public.achievements for insert
  with check (auth.uid() = user_id);

create policy "achievements_delete_own"
  on public.achievements for delete
  using (auth.uid() = user_id);
