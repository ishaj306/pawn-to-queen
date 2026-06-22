-- ============================================================
-- Pawn to Queen — Phase 1: Schema
-- Idempotent: safe to re-run.
-- Apply order: 0001 (this file), then 0002 (policies).
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─── profiles ─────────────────────────────────────────────────
-- One row per auth.users user. Created by the signup server action.

create table if not exists public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  full_name            text,
  username             text unique,
  current_rating       int  default 800,
  peak_rating          int  default 800,
  target_rating        int  default 1500,
  chess_com_username   text,
  lichess_username     text,
  bio                  text,
  avatar_url           text,
  notify_email         boolean default true,
  notify_push          boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Bring older profiles tables up to spec (idempotent column adds)
alter table public.profiles add column if not exists target_rating       int     default 1500;
alter table public.profiles add column if not exists chess_com_username  text;
alter table public.profiles add column if not exists lichess_username    text;
alter table public.profiles add column if not exists bio                 text;
alter table public.profiles add column if not exists avatar_url          text;
alter table public.profiles add column if not exists notify_email        boolean default true;
alter table public.profiles add column if not exists notify_push         boolean default false;


-- ─── rating_entries ───────────────────────────────────────────
-- One row per rating snapshot. Existing rows have format encoded in notes
-- as `[fmt:rapid]\n…` — we backfill below.

create table if not exists public.rating_entries (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  rating            int  not null,
  format            text not null default 'Rapid'
                       check (format in ('Rapid','Blitz','Bullet','Daily')),
  entry_date        date not null default current_date,
  notes             text,
  game_result       text,
  mistake_category  text,
  mindset           text,
  takeaway          text,
  is_starred        boolean default false,
  created_at        timestamptz default now()
);

-- Older rating_entries tables get the format column added.
alter table public.rating_entries
  add column if not exists format text not null default 'Rapid';

-- Backfill `format` from the [fmt:xxx] prefix the modal used, then strip
-- the prefix from notes. Runs once; safe to re-run (the regex won't match
-- after the prefix has already been removed).
update public.rating_entries
   set format = case
     when notes ilike '[fmt:rapid]%'  then 'Rapid'
     when notes ilike '[fmt:blitz]%'  then 'Blitz'
     when notes ilike '[fmt:bullet]%' then 'Bullet'
     when notes ilike '[fmt:daily]%'  then 'Daily'
     else format
   end,
   notes = regexp_replace(notes, '^\[fmt:(rapid|blitz|bullet|daily)\]\n?', '', 'i')
 where notes ~* '^\[fmt:(rapid|blitz|bullet|daily)\]';


-- ─── games ────────────────────────────────────────────────────
-- One row per played game (Page 5).

create table if not exists public.games (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  opponent      text not null,
  played_at     date not null default current_date,
  platform      text not null
                  check (platform in ('Chess.com','Lichess','OTB')),
  result        text not null
                  check (result in ('win','loss','draw')),
  opening       text not null,
  accuracy      int  check (accuracy between 0 and 100),
  time_control  text,
  format        text not null
                  check (format in ('Rapid','Blitz','Bullet','Daily')),
  blunders      int  default 0 check (blunders >= 0),
  mistakes      int  default 0 check (mistakes >= 0),
  brilliant     int  default 0 check (brilliant >= 0),
  missed_wins   int  default 0 check (missed_wins >= 0),
  notes         text,
  created_at    timestamptz default now()
);


-- ─── puzzles ──────────────────────────────────────────────────
-- One row per puzzle session (Page 6).

create table if not exists public.puzzles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  session_date    date not null default current_date,
  count           int  not null check (count > 0),
  accuracy        int  check (accuracy between 0 and 100),
  minutes         int  check (minutes > 0),
  puzzle_rating   int,
  notes           text,
  created_at      timestamptz default now()
);


-- ─── goals ────────────────────────────────────────────────────
-- A target the user is working toward. current_value is recomputed by
-- the app on relevant writes (or via a future SQL view).

create table if not exists public.goals (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  metric         text not null
                   check (metric in ('rating','puzzles','streak','games','study_minutes')),
  start_value    int  not null default 0,
  current_value  int  not null default 0,
  target_value   int  not null,
  due_date       date,
  completed_at   timestamptz,
  created_at     timestamptz default now()
);


-- ─── journal ──────────────────────────────────────────────────
-- Free-form journaling — lessons, mistakes, tournaments, thoughts, daily.

create table if not exists public.journal (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null default current_date,
  kind        text not null
                check (kind in ('lesson','mistake','tournament','thought','daily')),
  title       text,
  body        text not null,
  mood        text check (mood in ('focused','tired','excited','frustrated','calm','curious')),
  created_at  timestamptz default now()
);


-- ─── study_sessions ───────────────────────────────────────────
-- For the future Study Planner page — time spent learning by kind.

create table if not exists public.study_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null default current_date,
  kind        text not null
                check (kind in ('video','book','opening','endgame','tactics','game_review')),
  minutes     int  not null check (minutes > 0),
  topic       text,
  notes       text,
  created_at  timestamptz default now()
);


-- ─── achievements ─────────────────────────────────────────────
-- One row per badge a user has unlocked. `key` is the badge id from app code.

create table if not exists public.achievements (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  key          text not null,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, key)
);


-- ─── Indexes ──────────────────────────────────────────────────
-- The activity pages all sort by date desc and filter by user, so we
-- want (user_id, <date column> desc) composite indexes everywhere.

create index if not exists idx_rating_entries_user_date    on public.rating_entries  (user_id, entry_date desc);
create index if not exists idx_rating_entries_user_format  on public.rating_entries  (user_id, format);
create index if not exists idx_games_user_date             on public.games           (user_id, played_at desc);
create index if not exists idx_games_user_opening          on public.games           (user_id, opening);
create index if not exists idx_puzzles_user_date           on public.puzzles         (user_id, session_date desc);
create index if not exists idx_goals_user_status           on public.goals           (user_id, completed_at);
create index if not exists idx_journal_user_date           on public.journal         (user_id, entry_date desc);
create index if not exists idx_study_sessions_user_date    on public.study_sessions  (user_id, entry_date desc);
create index if not exists idx_achievements_user           on public.achievements    (user_id);


-- ─── updated_at trigger for profiles ──────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
