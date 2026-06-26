-- ============================================================
-- Pawn to Queen — Phase 5: Daily aggregates SQL function
--
-- Replaces "fetch every row, aggregate in JS" with a single SQL call
-- that returns one row per day in a window, with counts across every
-- activity table. Used by /calendar and /stats.
--
-- Returns rows for EVERY day in [start_date, end_date], including
-- days with zero activity (via generate_series). This means the
-- client doesn't have to fill gaps.
-- ============================================================

create or replace function public.get_user_daily_aggregates(
  p_user_id    text,
  p_start_date date,
  p_end_date   date
)
returns table (
  day              date,
  games_count      int,
  puzzles_count    int,
  study_minutes    int,
  journal_count    int,
  last_rating      int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.day,
    coalesce(g.cnt, 0)::int as games_count,
    coalesce(p.total, 0)::int as puzzles_count,
    coalesce(s.total, 0)::int as study_minutes,
    coalesce(j.cnt, 0)::int as journal_count,
    r.rating as last_rating
  from generate_series(p_start_date, p_end_date, '1 day'::interval) as d(day)
  left join lateral (
    select count(*) as cnt
    from public.games
    where user_id = p_user_id and played_at = d.day
  ) g on true
  left join lateral (
    select sum(count) as total
    from public.puzzles
    where user_id = p_user_id and session_date = d.day
  ) p on true
  left join lateral (
    select sum(minutes) as total
    from public.study_sessions
    where user_id = p_user_id and entry_date = d.day
  ) s on true
  left join lateral (
    select count(*) as cnt
    from public.journal
    where user_id = p_user_id and entry_date = d.day
  ) j on true
  left join lateral (
    select rating
    from public.rating_entries
    where user_id = p_user_id and entry_date = d.day
    order by created_at desc
    limit 1
  ) r on true
  order by d.day;
$$;

-- Grant execute to the service role (used by our admin client).
-- Authenticated/anon roles don't need this — the API surface is the
-- server action, not the function directly.
grant execute on function public.get_user_daily_aggregates(text, date, date) to service_role;
