-- ============================================================
-- Pawn to Queen — Phase 7: External game provenance + dedup
--
-- Lets us import games from Chess.com / Lichess without creating
-- duplicates on repeated syncs. `source` records the platform and
-- `external_id` the platform's own game id/url.
--
-- The unique index below is intentionally NON-partial so PostgREST can
-- use it as an ON CONFLICT arbiter for upserts (a partial index cannot
-- serve that role). It still leaves manual games unconstrained: they
-- have external_id = NULL, and Postgres treats NULLs as distinct, so any
-- number of manual rows with (user_id, NULL, NULL) coexist happily. Only
-- imported rows (non-null source + external_id) are deduplicated.
--
-- Apply order: AFTER 0001..0006. Idempotent.
-- ============================================================

alter table public.games add column if not exists source      text; -- 'chess.com' | 'lichess' | null (manual)
alter table public.games add column if not exists external_id text; -- platform game id or url

create unique index if not exists idx_games_user_source_extid
  on public.games (user_id, source, external_id);
