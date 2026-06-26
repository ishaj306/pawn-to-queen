# Supabase migrations — Pawn to Queen

Apply these in order against your Supabase project. There's no migration
runner wired up yet, so paste each file into the SQL editor manually.

## Files

| File | What it does |
| --- | --- |
| `migrations/0001_initial_schema.sql` | Creates `profiles`, `rating_entries`, and the six new architecture tables (`games`, `puzzles`, `goals`, `journal`, `study_sessions`, `achievements`). Adds the `format` column to `rating_entries` and back-fills it from the `[fmt:xxx]` notes hack. Adds indexes + an `updated_at` trigger on `profiles`. |
| `migrations/0002_rls_policies.sql` | Enables row-level security on every table and creates owner-only policies (`auth.uid() = user_id`) for select / insert / update / delete. |
| `migrations/0003_clerk_user_id.sql` | Switches `user_id` columns from `uuid` to `text` (Clerk uses string IDs), drops the FK to `auth.users`, drops old policies. **Destructive — truncates data.** |
| `migrations/0004_daily_aggregates.sql` | Adds the `get_user_daily_aggregates(user_id, start, end)` SQL function — replaces "fetch every row and aggregate in JS" for `/calendar` and `/stats`. |
| `migrations/0005_clerk_jwt_rls.sql` | Restores user-scoped RLS policies using `auth.jwt() ->> 'sub'` (the Clerk user id). Requires a Clerk JWT template (see below). |

Both files are **idempotent** — they use `if not exists` for tables and
columns, and `drop policy if exists` + `create policy` for policies, so
you can re-run them safely.

## How to apply

1. Open the Supabase dashboard for your project
2. Go to **SQL Editor → New query**
3. Paste the contents of `0001_initial_schema.sql`, click **Run**
4. New query → paste `0002_rls_policies.sql`, click **Run**

## How to verify

Run these three queries one at a time in the SQL editor.

**1. Tables exist** — should return 8 rows:

```sql
select table_name
from   information_schema.tables
where  table_schema = 'public'
  and  table_name in (
    'profiles','rating_entries','games','puzzles',
    'goals','journal','study_sessions','achievements'
  )
order by table_name;
```

**2. RLS is enabled** — should return 8 rows, all with `rowsecurity = true`:

```sql
select schemaname, tablename, rowsecurity
from   pg_tables
where  schemaname = 'public'
  and  tablename in (
    'profiles','rating_entries','games','puzzles',
    'goals','journal','study_sessions','achievements'
  )
order by tablename;
```

**3. Policies exist** — should return 31 rows (4 per table × 7 tables, plus 3 for `achievements`):

```sql
select tablename, policyname
from   pg_policies
where  schemaname = 'public'
order by tablename, policyname;
```

You should see four policies per table (`*_select_own`, `*_insert_own`,
`*_update_own`, `*_delete_own`), except `achievements` which has three
(no update — unlocking is delete + insert).

## Smoke test the policies

```sql
-- as your signed-in user via the dashboard's "Run as authenticated user" toggle:
insert into puzzles (user_id, session_date, count, accuracy, minutes, puzzle_rating)
values (auth.uid(), current_date, 10, 85, 12, 1150);

select count(*) from puzzles;        -- should be 1
select count(*) from puzzles
 where user_id <> auth.uid();        -- should be 0 (RLS hides others)
```

## Setting up the Clerk JWT template (needed for migration 0005)

Migration 0005 restores user-scoped RLS using `auth.jwt() ->> 'sub'`.
For that to work, Clerk has to issue tokens that Supabase can read.

1. **Get your Supabase JWT secret.** Supabase Dashboard → Settings → API
   → scroll to "JWT Settings" → copy the **JWT Secret** (long base64 string).
2. **Create a JWT template in Clerk.** Clerk Dashboard → Configure →
   Customization → **JWT Templates** → "+ New template".
   - Name: **`supabase`** (this name is referenced by `src/supabase/user.ts`)
   - Signing algorithm: **HS256**
   - Signing key: paste the Supabase JWT secret
   - Token lifetime: 60 seconds is fine (Clerk auto-refreshes)
   - Claims: default is enough; `sub` is auto-included and that's all RLS needs.
3. **Apply migration 0005** in the Supabase SQL editor (after 0001 + 0002 + 0003).
4. **Try it.** Server actions that use `createUserClient()` from
   `src/supabase/user.ts` will now go through RLS. Existing actions still
   use the service-role client (`createAdminClient()`) and bypass RLS —
   so nothing breaks while you migrate them piece-by-piece.

If you don't want to set up the JWT template right now, **skip 0005 and
keep using service-role**. The audit-grade hardening is the point of
0005; the app works without it.

## What's next

- **Phase 2** swaps in Clerk for auth (server actions, middleware, layout).
- **Phase 3** writes `src/features/games/actions.ts` and
  `src/features/puzzles/actions.ts` that call into these tables, and
  replaces the sample seed data in the page files.
- **Phase 5** wires the Supabase CLI so `npm run db:types` regenerates
  `src/types/database.ts` instead of us hand-maintaining it.
