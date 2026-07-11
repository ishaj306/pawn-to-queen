-- ============================================================
-- Pawn to Queen — Phase 6: Per-format ratings
--
-- Before this migration, profiles.current_rating / peak_rating were
-- single scalars, but rating_entries.format is one of four formats
-- (Rapid / Blitz / Bullet / Daily). Logging a Blitz rating would
-- overwrite the headline Rapid number — a real chess-modelling bug.
--
-- Fix: keep per-format current/peak in a JSONB map, and let each user
-- choose which format their headline current_rating/peak_rating mirror
-- (primary_format, default Rapid). The app recomputes both on every
-- rating write/delete from the source rating_entries rows.
--
-- Apply order: AFTER 0001..0005. Idempotent.
-- ============================================================

alter table public.profiles
  add column if not exists primary_format text not null default 'Rapid'
    check (primary_format in ('Rapid','Blitz','Bullet','Daily'));

-- format_ratings shape: { "Rapid": { "current": 1234, "peak": 1300 }, ... }
alter table public.profiles
  add column if not exists format_ratings jsonb not null default '{}'::jsonb;
