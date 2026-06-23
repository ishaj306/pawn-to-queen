<div align="center">

# ♕ Pawn to Queen

### *Every Master Was Once A Pawn.*

**A luxury chess journal — the personal operating system for ambitious players.**

Track ratings, games, puzzles, habits, journal entries and goals — all in one
editorial-grade product that feels like a Hermès-bound chess manuscript, not a SaaS dashboard.

[Live demo](#) · [Architecture](#architecture) · [Tech stack](#tech-stack) · [Local setup](#local-setup)

---

</div>

## What it is

Most chess analytics products look like accounting software. Chess.com's stats
page, Lichess insights, even most chess journals — they treat your improvement
as a spreadsheet.

**Pawn to Queen treats it as a story.**

Twelve pages, each designed like a chapter in a leather-bound journal:
ivory + antique gold + emerald palette, Playfair Display headings, Cormorant
Garamond quotes, Inter body, vintage chessboard textures and faded chess-piece
engravings on every screen. Every interaction has weight. Every animation has
intent.

It also happens to track your ratings, games, puzzles, study sessions, journal
entries, goals, achievements, and a 53-week activity heatmap — all persisted
to Postgres with proper auth, RLS, and per-user data isolation.

## ✨ Features

**12 pages, each fully designed:**

| Page | What it does |
| --- | --- |
| **Landing** | 10-section editorial home — hero, quote, Pawn→Queen journey, feature grid, second-brain pitch, screenshots, why, CTA |
| **Sign In / Sign Up / Forgot Password** | Luxury auth shell — chessboard texture background, vertical piece column, Clerk Elements inside a bespoke `JournalCard` |
| **Dashboard** | Greeting, title badge, 6 stat cards, rating chart with milestone reference lines, recent games, monthly progress, goals widget, achievements widget |
| **Rating Tracker** | Format tabs (Rapid/Blitz/Bullet/Daily) with sliding indicator, hero stats, large chart with all milestone references, **Pawn → Knight → Bishop → Rook → Queen** journey timeline with pulsing crown, recent entries, monthly progress bars, insights |
| **Games Log + Opening Explorer** | Filter bar (result + format + search), 6 stat cards, expandable journal cards with page-turn animation, opening explorer with mini donut charts, weak / best openings, stacked performance bar chart |
| **Puzzle Tracker + Heatmap** | Glowing streak orb centerpiece, recent sessions, **12-week GitHub-style heatmap** with hover tooltip across 4 activity tracks, dual-axis rating × accuracy chart, daily consistency, achievement progress |
| **Goals** | Progress bars auto-computed from your real activity data, segmented metric picker, completed goals shown as gold trophy cards |
| **Journal** | 5 kinds (lesson / mistake / tournament / thought / daily) × 6 mood badges, searchable feed, journal cards with delete |
| **Study Planner** | Daily 7-item checklist auto-derived from today's logged activity, plus full session log |
| **Achievements** | 23 badges across 5 groups (rating milestones, puzzles, games, streaks, journal), glowing earned tiles, progress bars on locked ones — unlock state derived from your real data |
| **Statistics** | Week / Month / Year toggle, rating trajectory + games × puzzles bars + top openings + insights |
| **Calendar** | Full 53-week year heatmap, click any day to see what happened (games, puzzles, study, journal, rating delta) |
| **Profile** | Avatar, Pawn→Queen journey rendered as your level, editable form (name, target rating, Chess.com / Lichess handles, bio) |
| **Settings** | Notification toggles wired to DB, sign-out, danger-zone delete account (two-step confirm) |

## 🎨 Design system

A small, deliberate palette and three typefaces, used everywhere:

- **Ivory** `#FAF8F2` — page background
- **Antique Gold** `#E6C46A` — borders, accents, ornaments
- **Emerald** `#0E5A3C` — primary actions, the protagonist colour
- **Ink** `#111111` — body text

Typography:

- **Playfair Display** — headings (editorial, slightly italic on emphasis words)
- **Cormorant Garamond** — quotes, italic captions, eyebrow text
- **Inter** — body, form labels, UI

Recurring design vocabulary visible across all pages:

- **Corner brackets** on every card (4 thin `border-t` / `border-l` marks)
- **Fleur dividers** (`❦`) framing quote lines
- **Vertical chess-piece rails** alternating gold and emerald
- **Faded engravings** of the queen, knight, bishop and rook bleeding off card edges
- **Pulsing gold halos** on active states (current streak, current journey title, unlocked achievements)
- **Sliding emerald pill** for active tabs (via Framer Motion `layoutId`)

## 🏛 Architecture

**8 Postgres tables**, all with row-level security and Clerk-keyed `user_id` columns:

```
profiles · rating_entries · games · puzzles · goals · journal · study_sessions · achievements
```

**Auth gates everything that writes:** Clerk owns the session, server actions
read `auth().userId`, queries always filter by it. Service-role admin client
bypasses RLS only inside server actions; the anon key is locked out by policy.

**Achievement derivation is pure logic** in [`src/lib/achievements.ts`](src/lib/achievements.ts) —
unlock state computed live from activity rows, then persisted idempotently.
The Goals page does the same trick via `recomputeGoals()`.

**Per-page metadata + OG image generated at the edge** (`opengraph-image.tsx`)
for clean social previews. `robots.ts` + `sitemap.ts` keep crawlers on public
surfaces only — the protected dashboard never gets indexed.

## 🛠 Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| **Framework** | Next.js 16 (App Router, Turbopack) | Server actions co-locate with pages, RSC keeps initial load light |
| **Language** | TypeScript | Hand-typed `Database` interface mirrors the SQL schema |
| **Styling** | Tailwind CSS v4 | `@theme inline` palette tokens; corner-bracket pattern composes well |
| **Animation** | Framer Motion | Tab sliding via `layoutId`, fade-up patterns, glow loops |
| **Charts** | Recharts | Reference lines for rating milestones, dual-axis lines |
| **Auth** | Clerk (`@clerk/nextjs` + Clerk Elements) | Bespoke luxury sign-in screens powered by Clerk's headless primitives |
| **Database** | Supabase Postgres | RLS-first, idempotent migrations in `supabase/migrations/` |
| **Forms** | React Hook Form + Zod | Form-level + field-level validation, narrow union types from the DB schema |
| **State** | Zustand | Lightweight client-side store for the hydrated profile row |
| **Hosting** | Vercel | Co-located with Clerk + Supabase edge functions |

## 🚀 Local setup

**Prerequisites**

- Node 20+
- A Clerk account (free tier is fine) — get a publishable + secret key
- A Supabase project — get the URL, anon key, and service-role key

**Steps**

1. Clone and install:
   ```bash
   git clone https://github.com/ishaj306/pawn-to-queen.git
   cd pawn-to-queen
   npm install --legacy-peer-deps
   ```

2. Copy `.env.example` to `.env.local` and fill it in:
   ```bash
   cp .env.example .env.local
   # then edit with your real keys
   ```

3. Apply the database migrations. In Supabase Dashboard → **SQL Editor**,
   paste and run each file from `supabase/migrations/` in order:
   - `0001_initial_schema.sql` — creates all 8 tables + indexes
   - `0002_rls_policies.sql` — owner-only policies
   - `0003_clerk_user_id.sql` — switches `user_id` columns to `text` (Clerk uses string IDs)

4. Configure Clerk:
   - Dashboard → **Configure → Customization → Paths** — set sign-in to `/login`,
     sign-up to `/signup`, after-sign-in/up to `/dashboard`
   - Enable Email + Google in **Authentication → SSO**

5. Run it:
   ```bash
   npm run dev
   ```
   Visit [localhost:3000](http://localhost:3000), sign up, log a rating,
   watch the dashboard fill in.

## 📁 Project structure

```
src/
├── app/
│   ├── (auth)/                   # Sign in / Sign up / Forgot password
│   ├── (dashboard)/              # All 12 authenticated pages
│   ├── privacy/, terms/          # Public legal pages
│   ├── opengraph-image.tsx       # Edge-rendered OG image
│   ├── robots.ts, sitemap.ts
│   ├── layout.tsx                # ClerkProvider + AuthProvider + fonts + metadata
│   ├── error.tsx, not-found.tsx, loading.tsx
│   ├── page.tsx                  # Landing
│   └── globals.css               # Tailwind v4 @theme tokens
├── components/
│   ├── auth/                     # AuthShell, journal-card primitives
│   ├── games/, puzzles/, ratings/, goals/, journal/, study/
│   │                             # Per-feature modals
│   └── ui/                       # base-ui shadcn primitives
├── features/                     # Server actions, one folder per domain
│   ├── auth/, ratings/, games/, puzzles/, goals/,
│   │   journal/, study/, achievements/, profile/
├── lib/
│   ├── achievements.ts           # Pure unlock logic
│   ├── rating-format.ts          # Format encoder/decoder
│   └── utils.ts
├── store/                        # Zustand
├── supabase/                     # Server, admin, browser clients
├── types/database.ts             # Hand-typed schema
└── utils/stats.ts                # titleFor, TITLE_JOURNEY, RATING_MILESTONES
supabase/
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_rls_policies.sql
│   └── 0003_clerk_user_id.sql
└── README.md
```

## 🗺 Roadmap

Already shipped — what's listed under [Features](#-features).

Up next:

- **Production deploy** to Vercel + a custom domain
- **PostHog analytics** (scaffolded, awaiting keys)
- **Sentry error monitoring**
- **Demo account** with seeded 90-day activity for quick portfolio previews
- **Chess.com / Lichess sync** — pull real games via their public APIs
- **AI coach** — explain blunders in your logged games using the model of choice
- **Mobile app** — React Native shell against the same Supabase backend

## 🙏 Credits

Built by [Isha](https://github.com/ishaj306) as a portfolio project.

Design language inspired by Hermès, Ralph Lauren, vintage chess manuscripts,
and the editorial design of *The New York Review of Books*.

Quotes throughout — Benjamin Franklin, Richard Teichmann, and various chess
proverbs in the public domain.

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

*"Every Master Was Once A Pawn."*

♕

</div>
