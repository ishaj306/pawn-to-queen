"use client";

import React from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bell, ChevronRight, Flame } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { StreakNudge } from "@/components/shared/streak-nudge";
import { useChessData } from "@/features/chess-data/use-chess-data";
import { BADGES } from "@/lib/achievements";
import { getNextMilestone, titleFor } from "@/utils/stats";
import type { ChessStats } from "@/lib/chess-stats";
import type { GameRow, GoalRow, AchievementRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Dashboard (Page 3)
//  A premium chess journal × command center
// ─────────────────────────────────────────────────────────────

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

const RATING_MILESTONES = [500, 800, 1000, 1200, 1500];

// ─── Helpers ───
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 22) return "Good Evening";
  return "Good Night";
}

// ─── Decorative atoms ───
function GoldStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1.5l2.65 6.95L22 9.6l-5.5 5.05L18 22l-6-3.6L6 22l1.5-7.35L2 9.6l7.35-1.15z"
        fill="currentColor"
      />
    </svg>
  );
}

function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
      <path
        d="M2 8l5 8h18l5-8-6 4-4-8-4 6-4-6-4 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="8" r="1.6" fill="currentColor" />
      <circle cx="16" cy="2" r="1.6" fill="currentColor" />
      <circle cx="30" cy="8" r="1.6" fill="currentColor" />
      <line x1="4" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Fleur({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6zM3 12c3 1 4 3 6 3 1.5 0 2.5-1 2.5-3S10.5 9 9 9c-2 0-3 2-6 3zm18 0c-3-1-5-3-6-3-1.5 0-2.5 1-2.5 3s1 3 2.5 3c1 0 3-2 6-3zM12 13c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

// ─── Page ───
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const { data, stats, loading } = useChessData();

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Player";
  const firstName = displayName.split(" ")[0];

  // Every number below reads from the ONE computed source (stats), so
  // the dashboard always matches the Rating Tracker, Stats and Wrapped.
  const currentRating = stats.currentRating;
  const peakRating = stats.peakRating;
  const targetRating = getNextMilestone(currentRating);
  const streak = stats.currentStreak;
  const ratingGrowth = stats.ratingGrowth;
  const gamesPlayed = stats.totalGames;
  const winRate = stats.winRate;
  const title = titleFor(currentRating);

  // Rating chart — the real primary-format series (empty until data exists,
  // never a sample arc). Last 12 points to keep the centerpiece readable.
  const chartData = stats.ratingSeries.slice(-12).map((e) => ({
    date: new Date(e.date + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    rating: e.rating,
  }));

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      {/* ─── Background engravings ─── */}
      <span
        className="pointer-events-none absolute top-32 -left-12 font-display text-emerald/[0.04] leading-none select-none hidden lg:block"
        style={{ fontSize: "22rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>
      <span
        className="pointer-events-none absolute bottom-32 -right-10 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "22rem" }}
        aria-hidden="true"
      >
        {PIECES.rook}
      </span>
      <GoldStar className="absolute top-32 right-[8%] size-2.5 text-gold opacity-50 hidden md:block" />
      <GoldStar className="absolute top-[60%] left-[6%] size-2 text-gold opacity-50 hidden md:block" />
      <Crown className="absolute top-20 right-[30%] w-7 h-5 text-gold-deep opacity-30 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10 animate-fade-in-up">
        {/* ─── HEADER ─── */}
        <DashboardHeader
          greeting={greeting()}
          name={firstName}
          title={title}
          streak={streak}
          avatarLetter={displayName[0]?.toUpperCase() ?? "P"}
        />

        {/* ─── RETENTION NUDGE — narrative streak ─── */}
        <StreakNudge />

        {/* ─── STAT CARDS ─── */}
        <StatCardsRow
          currentRating={currentRating}
          peakRating={peakRating}
          targetRating={targetRating}
          winRate={winRate}
          gamesPlayed={gamesPlayed}
          streak={streak}
          ratingGrowth={ratingGrowth}
        />

        {/* ─── QUICK ACTIONS ─── */}
        <QuickActions />

        {/* ─── RATING CHART CENTERPIECE ─── */}
        <RatingChartPanel
          data={chartData}
          title={title}
          currentRating={currentRating}
        />

        {/* ─── 2-COL: Recent Games  |  Goals + Puzzle Streak ─── */}
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <RecentGames games={stats.recentGames} />
            <MonthlyProgress
              weeks={stats.gamesPerWeek}
              thisMonth={stats.gamesThisMonth}
              momPct={stats.monthOverMonthPct}
            />
          </div>
          <aside className="lg:col-span-5 space-y-8">
            <GoalsWidget goals={data?.goals ?? []} />
            <PuzzleStreakWidget stats={stats} />
          </aside>
        </div>

        {/* ─── 2-COL: Achievements  |  Insights ─── */}
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <AchievementsWidget achievements={data?.achievements ?? []} />
          </div>
          <div className="lg:col-span-6">
            <InsightsCard stats={stats} />
          </div>
        </div>

        {/* ─── Footer flourish ─── */}
        <footer className="pt-10 pb-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-gold-deep/40" />
            <Fleur className="size-4 text-gold-deep" />
            <span className="h-px w-12 bg-gold-deep/40" />
          </div>
          <p className="font-serif-quote italic text-ink/50 text-sm">
            One move at a time.
          </p>
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────

function DashboardHeader({
  greeting,
  name,
  title,
  streak,
  avatarLetter,
}: {
  greeting: string;
  name: string;
  title: { name: string; piece: string };
  streak: number;
  avatarLetter: string;
}) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b border-gold/30">
      <div>
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
          {greeting},{" "}
          <span className="italic text-emerald">{name}</span>{" "}
          <span aria-hidden="true">{PIECES.queen}</span>
        </h1>
        <p className="mt-3 font-serif-quote italic text-lg text-ink/65">
          Track. <span className="text-emerald">Learn.</span> Rise.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Streak chip */}
        <div className="flex items-center gap-2 bg-white border border-gold/45 px-3.5 py-2.5 rounded-sm">
          <Flame className="w-3.5 h-3.5 text-gold-deep" />
          <div>
            <p className="font-display text-base leading-none text-ink">
              {streak || 0}
              <span className="text-[11px] text-ink/55 ml-1">d</span>
            </p>
            <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 leading-none mt-0.5">
              Streak
            </p>
          </div>
        </div>

        {/* Title badge */}
        <div className="flex items-center gap-2.5 bg-emerald text-ivory border border-emerald-deep px-4 py-2.5 rounded-sm">
          <span
            className="font-display text-xl leading-none text-gold"
            aria-hidden="true"
          >
            {title.piece}
          </span>
          <div>
            <p className="text-[9px] tracking-[0.22em] uppercase text-gold leading-none">
              Current Title
            </p>
            <p className="font-display text-sm leading-none mt-1">
              {title.name}
            </p>
          </div>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative size-10 bg-white border border-gold/45 rounded-sm flex items-center justify-center text-ink/70 hover:text-emerald hover:border-emerald transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 bg-emerald rounded-full" />
        </button>

        {/* Avatar */}
        <Link
          href="/profile"
          className="size-10 rounded-full bg-emerald text-ivory flex items-center justify-center font-display text-base border-2 border-gold/60 hover:border-gold transition-colors"
        >
          {avatarLetter}
        </Link>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
//  STAT CARDS
// ─────────────────────────────────────────────────────────────

function StatCardsRow({
  currentRating,
  peakRating,
  targetRating,
  winRate,
  gamesPlayed,
  streak,
  ratingGrowth,
}: {
  currentRating: number;
  peakRating: number;
  targetRating: number;
  winRate: number;
  gamesPlayed: number;
  streak: number;
  ratingGrowth: number;
}) {
  const cards = [
    {
      label: "Current Rating",
      value: currentRating,
      sub: ratingGrowth >= 0 ? `+${ratingGrowth} growth` : `${ratingGrowth} growth`,
      piece: PIECES.pawn,
    },
    {
      label: "Peak Rating",
      value: peakRating,
      sub: peakRating === currentRating ? "All-time high" : "Personal best",
      piece: PIECES.knight,
    },
    {
      label: "Target Rating",
      value: targetRating,
      sub: `${targetRating - currentRating} to go`,
      piece: PIECES.bishop,
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: "Last 30 days",
      piece: PIECES.rook,
    },
    {
      label: "Games Played",
      value: gamesPlayed,
      sub: "Lifetime logged",
      piece: PIECES.queen,
    },
    {
      label: "Current Streak",
      value: `${streak}`,
      valueSuffix: streak === 1 ? "day" : "days",
      sub: streak >= 7 ? "On fire" : "Keep going",
      piece: PIECES.king,
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
      {cards.map((c, i) => (
        <article
          key={c.label}
          className="group relative bg-white border border-gold/45 rounded-sm p-5 transition-all hover:-translate-y-0.5 hover:border-emerald hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.25)]"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
          <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
          <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
          <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 font-medium">
              {c.label}
            </p>
            <span
              className="font-display text-2xl text-gold-deep group-hover:text-emerald transition-colors leading-none"
              aria-hidden="true"
            >
              {c.piece}
            </span>
          </div>
          <p className="font-display text-3xl text-emerald leading-none">
            {c.value}
            {"valueSuffix" in c && c.valueSuffix && (
              <span className="text-sm text-ink/55 font-sans ml-1.5">
                {c.valueSuffix}
              </span>
            )}
          </p>
          <p className="mt-2.5 font-serif-quote italic text-[12px] text-ink/55">
            {c.sub}
          </p>
        </article>
      ))}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  QUICK ACTIONS
// ─────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: "Log Game",         href: "/games?action=new",       piece: PIECES.rook },
    { label: "Add Rating",       href: "/ratings?action=log",     piece: PIECES.king },
    { label: "Solve Puzzles",    href: "/puzzles",                piece: PIECES.bishop },
    { label: "Journal Entry",    href: "/journal?action=new",     piece: PIECES.knight },
    { label: "Create Goal",      href: "/goals?action=new",       piece: PIECES.queen },
  ];

  return (
    <section>
      <SectionHeading eyebrow="Quick Actions" title="What will you log today?" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="group relative flex items-center gap-3 bg-emerald text-ivory border border-emerald-deep px-4 py-4 rounded-sm hover:bg-emerald-deep transition-colors"
          >
            <span
              className="font-display text-2xl text-gold leading-none"
              aria-hidden="true"
            >
              {a.piece}
            </span>
            <span className="flex-1 text-[12px] tracking-[0.22em] uppercase font-medium">
              {a.label}
            </span>
            <span
              className="text-gold transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  RATING CHART
// ─────────────────────────────────────────────────────────────

function RatingChartPanel({
  data,
  title,
  currentRating,
}: {
  data: { date: string; rating: number }[];
  title: { name: string; piece: string };
  currentRating: number;
}) {
  const hasData = data.length > 0;
  const min = hasData ? Math.min(...data.map((d) => d.rating)) : 0;
  const max = hasData ? Math.max(...data.map((d) => d.rating)) : 1000;
  const yDomain = [Math.max(0, min - 60), max + 60] as [number, number];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/50" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/50" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/50" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/50" />

      {/* Watermark queen */}
      <span
        className="absolute -bottom-12 -right-6 font-display text-gold/15 leading-none select-none pointer-events-none"
        style={{ fontSize: "24rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <div className="relative p-7 lg:p-9">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-7">
          <div>
            <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
              Rating Curve
            </p>
            <h2 className="font-display text-3xl text-ink leading-tight">
              How your <span className="italic text-emerald">rating</span> has moved
            </h2>
            <p className="mt-2 font-serif-quote italic text-ink/60 text-sm">
              {hasData
                ? `Currently sitting at ${currentRating}.`
                : "No rating history yet — connect an account or log a rating."}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-emerald text-ivory px-5 py-3 rounded-sm">
            <span
              className="font-display text-3xl text-gold leading-none"
              aria-hidden="true"
            >
              {title.piece}
            </span>
            <div>
              <p className="text-[9px] tracking-[0.22em] uppercase text-gold leading-none">
                Title
              </p>
              <p className="font-display text-lg leading-none mt-1">
                {title.name}
              </p>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="h-72 md:h-80 w-full flex flex-col items-center justify-center text-center gap-3 border border-dashed border-gold/40 rounded-sm">
            <span className="font-display text-5xl text-emerald/20" aria-hidden="true">{title.piece}</span>
            <p className="font-serif-quote italic text-ink/55 text-sm max-w-xs">
              No rating history yet. Add your Chess.com / Lichess username in Settings, then hit Sync.
            </p>
          </div>
        ) : (
        <div className="h-72 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 24, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                stroke="rgba(184, 146, 63, 0.15)"
                strokeDasharray="2 6"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
                stroke="rgba(184, 146, 63, 0.4)"
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
                stroke="rgba(184, 146, 63, 0.4)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FAF8F2",
                  border: "1px solid #E6C46A",
                  borderRadius: "2px",
                  fontFamily: "var(--font-inter)",
                  fontSize: "12px",
                  color: "#111111",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  fontFamily: "var(--font-playfair)",
                  fontWeight: 600,
                  color: "#0E5A3C",
                  marginBottom: 2,
                }}
                cursor={{ stroke: "#0E5A3C", strokeWidth: 1, strokeDasharray: "2 4" }}
              />
              {RATING_MILESTONES.map((m) =>
                m >= yDomain[0] && m <= yDomain[1] ? (
                  <ReferenceLine
                    key={m}
                    y={m}
                    stroke="#0E5A3C"
                    strokeDasharray="3 4"
                    strokeOpacity={0.45}
                    label={{
                      value: String(m),
                      position: "right",
                      fill: "#0E5A3C",
                      fontSize: 10,
                      fontFamily: "var(--font-inter)",
                      offset: 8,
                    }}
                  />
                ) : null,
              )}
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#E6C46A"
                strokeWidth={2.5}
                dot={{ fill: "#FAF8F2", stroke: "#0E5A3C", strokeWidth: 2, r: 4 }}
                activeDot={{
                  fill: "#0E5A3C",
                  stroke: "#E6C46A",
                  strokeWidth: 2.5,
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}

        <div className="mt-6 flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-ink/55">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="block w-5 h-[2px] bg-gold" />
              Your rating
            </span>
            <span className="flex items-center gap-2">
              <span className="block w-5 h-[2px] bg-emerald" style={{ borderTop: "1px dashed #0E5A3C", background: "transparent" }} />
              Milestones
            </span>
          </div>
          <Link
            href="/ratings"
            className="text-emerald hover:text-emerald-deep transition-colors"
          >
            View full history →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  RECENT GAMES
// ─────────────────────────────────────────────────────────────

type GameResult = "win" | "loss" | "draw";

// Relative "when" label from a YYYY-MM-DD date.
function relativeWhen(iso: string): string {
  const then = new Date(iso + "T00:00:00Z").getTime();
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const RESULT_STYLES: Record<GameResult, { card: string; label: string; chip: string }> = {
  win: {
    card: "bg-emerald/[0.06] border-emerald/40 hover:border-emerald",
    label: "text-emerald-deep",
    chip: "bg-emerald text-ivory",
  },
  loss: {
    card: "bg-gold-light/40 border-gold-deep/35 hover:border-gold-deep",
    label: "text-gold-deep",
    chip: "bg-gold-deep text-ivory",
  },
  draw: {
    card: "bg-ivory border-ink/15 hover:border-ink/40",
    label: "text-ink/70",
    chip: "bg-ink text-ivory",
  },
};

function RecentGames({ games }: { games: GameRow[] }) {
  const recent = games.slice(0, 3).map((g) => ({
    opponent: g.opponent,
    opening: g.opening,
    accuracy: g.accuracy,
    result: g.result,
    blunders: g.blunders,
    brilliant: g.brilliant,
    when: relativeWhen(g.played_at),
  }));

  return (
    <section>
      <SectionHeading
        eyebrow="Recent Games"
        title="The last few rounds"
        action={<Link href="/games" className="text-emerald hover:text-emerald-deep text-[11px] tracking-[0.22em] uppercase transition-colors">View Log →</Link>}
      />
      {recent.length === 0 ? (
        <div className="border border-dashed border-gold/40 rounded-sm p-8 text-center">
          <p className="font-serif-quote italic text-ink/55 text-sm">
            No games yet. Connect your Chess.com / Lichess account and Sync, or log one manually.
          </p>
        </div>
      ) : (
      <div className="space-y-4">
        {recent.map((g, i) => {
          const styles = RESULT_STYLES[g.result];
          return (
            <article
              key={i}
              className={`group relative border rounded-sm p-5 transition-all ${styles.card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className={`text-[10px] tracking-[0.28em] uppercase font-medium px-2 py-0.5 ${styles.chip}`}
                    >
                      {g.result}
                    </span>
                    <span className="font-serif-quote italic text-gold-deep text-[12px]">
                      {g.when}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-ink leading-tight">
                    vs. <span className="italic">{g.opponent}</span>
                  </h3>
                  <p className="mt-1 text-[13px] text-ink/65">
                    <span className="text-gold-deep">{g.opening}</span>
                    {" · "}
                    Accuracy{" "}
                    <span className={`font-display text-base ${styles.label}`}>
                      {g.accuracy ?? "—"}
                    </span>
                    {g.accuracy != null ? "%" : ""}
                  </p>
                </div>

                <div className="flex gap-4 text-center shrink-0">
                  <div>
                    <p className="font-display text-2xl text-ink leading-none">
                      {g.blunders}
                    </p>
                    <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 mt-1">
                      Blunders
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl text-emerald leading-none">
                      {g.brilliant}
                    </p>
                    <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 mt-1">
                      Brilliant
                    </p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  MONTHLY PROGRESS
// ─────────────────────────────────────────────────────────────

function MonthlyProgress({
  weeks,
  thisMonth,
  momPct,
}: {
  weeks: { label: string; games: number }[];
  thisMonth: number;
  momPct: number | null;
}) {
  const peak = Math.max(...weeks.map((w) => w.games), 1);

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <SectionHeading
        eyebrow="This Month"
        title="Games per week"
        compact
      />

      <div className="flex items-end gap-3 h-36 mt-2">
        {weeks.map((w, i) => {
          const h = (w.games / peak) * 100;
          const isLast = i === weeks.length - 1;
          return (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end">
                <div
                  className={`w-full rounded-sm transition-all ${
                    isLast ? "bg-emerald" : "bg-gold"
                  }`}
                  style={{ height: `${h}%` }}
                />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-display text-xs text-ink/65">
                  {w.games}
                </span>
              </div>
              <span className="text-[10px] tracking-[0.22em] uppercase text-ink/55">
                {w.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-ink/55 pt-4 border-t border-gold/25">
        <span>This month · <span className="text-emerald font-display normal-case tracking-normal text-base">{thisMonth}</span> games</span>
        {momPct === null ? (
          <span className="text-ink/45">— vs. last month</span>
        ) : (
          <span className={momPct >= 0 ? "text-emerald" : "text-destructive"}>
            {momPct >= 0 ? "+" : ""}{momPct}% vs. last month
          </span>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  GOALS
// ─────────────────────────────────────────────────────────────

function GoalsWidget({ goals }: { goals: GoalRow[] }) {
  const rows = goals.slice(0, 4).map((g) => ({
    name: g.title,
    target: g.target_value,
    current: g.current_value,
    complete: g.completed_at != null,
    progress: Math.min(
      100,
      Math.max(0, g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0),
    ),
  }));

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <SectionHeading
        eyebrow="Active Goals"
        title="Intentions in motion"
        action={
          <Link href="/goals" className="text-emerald hover:text-emerald-deep text-[11px] tracking-[0.22em] uppercase transition-colors">
            All →
          </Link>
        }
        compact
      />

      {rows.length === 0 ? (
        <div className="border border-dashed border-gold/40 rounded-sm p-6 text-center">
          <p className="font-serif-quote italic text-ink/55 text-sm">
            No goals yet. <Link href="/goals" className="text-emerald hover:underline">Set one →</Link>
          </p>
        </div>
      ) : (
      <ul className="space-y-5">
        {rows.map((g, i) => (
          <li
            key={i}
            className={`p-4 rounded-sm border ${
              g.complete
                ? "bg-gold-light/55 border-gold-deep/40"
                : "bg-ivory/60 border-gold/30"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="font-display text-base text-ink leading-tight flex items-center gap-2">
                {g.complete && (
                  <span className="text-gold-deep text-lg leading-none">✓</span>
                )}
                {g.name}
              </p>
              <p className="font-serif-quote italic text-gold-deep text-[12px] tracking-wide whitespace-nowrap">
                {g.current} / {g.target}
              </p>
            </div>
            <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  g.complete ? "bg-gold-deep" : "bg-emerald"
                }`}
                style={{ width: `${g.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  PUZZLE STREAK
// ─────────────────────────────────────────────────────────────

function PuzzleStreakWidget({ stats }: { stats: ChessStats }) {
  // 7 cols × 5 rows mini heatmap of REAL activity over the last 35 days.
  const pad = (n: number) => String(n).padStart(2, "0");
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const c = stats.activityByDate[iso] ?? 0;
    return c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4;
  });

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      {/* Knight engraving */}
      <span
        className="absolute -top-6 -right-4 font-display text-gold/15 leading-none select-none pointer-events-none"
        style={{ fontSize: "11rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>

      <SectionHeading eyebrow="Puzzles" title="Streak & Tactics" compact />

      <div className="relative grid grid-cols-2 gap-5">
        <div>
          <div className="space-y-3">
            <Stat label="Current Streak" value={String(stats.puzzleStreak)} suffix={stats.puzzleStreak === 1 ? "day" : "days"} />
            <Stat label="Puzzles Solved" value={stats.puzzlesSolved.toLocaleString()} />
            <Stat label="Puzzle Rating" value={stats.latestPuzzleRating != null ? stats.latestPuzzleRating.toLocaleString() : "—"} />
          </div>
        </div>
        <div>
          <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 mb-2">
            Last 5 weeks
          </p>
          <div className="grid grid-cols-7 gap-[3px]">
            {cells.map((s, i) => {
              const opacity = [0.1, 0.28, 0.5, 0.75, 1][s];
              return (
                <div
                  key={i}
                  className="aspect-square rounded-[1px]"
                  style={{ backgroundColor: `rgba(14, 90, 60, ${opacity})` }}
                />
              );
            })}
          </div>
          <Link
            href="/calendar"
            className="mt-4 inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-emerald hover:text-emerald-deep transition-colors"
          >
            Open Calendar <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55">{label}</p>
      <p className="font-display text-2xl text-emerald leading-none mt-1">
        {value}
        {suffix && (
          <span className="text-[12px] text-ink/55 font-sans ml-1.5">{suffix}</span>
        )}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────

function AchievementsWidget({ achievements }: { achievements: AchievementRow[] }) {
  const badges = achievements
    .slice(0, 4)
    .map((a) => BADGES.find((b) => b.key === a.key))
    .filter((b): b is (typeof BADGES)[number] => Boolean(b))
    .map((b) => ({ name: b.name, piece: b.piece, sub: b.description }));

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      {/* Crown watermark */}
      <Crown className="absolute -top-2 right-6 w-24 h-16 text-gold/30 pointer-events-none" />

      <SectionHeading
        eyebrow="Achievements"
        title="Recently unlocked"
        action={
          <Link
            href="/achievements"
            className="text-emerald hover:text-emerald-deep text-[11px] tracking-[0.22em] uppercase transition-colors"
          >
            Gallery →
          </Link>
        }
        compact
      />

      {badges.length === 0 ? (
        <div className="border border-dashed border-gold/40 rounded-sm p-6 text-center">
          <p className="font-serif-quote italic text-ink/55 text-sm">
            No badges yet — they unlock as you play, solve and log.
          </p>
        </div>
      ) : (
      <div className="relative grid grid-cols-2 gap-3">
        {badges.map((b, i) => (
          <article
            key={i}
            className="group relative bg-gold-light/40 border border-gold/50 rounded-sm p-4 hover:bg-gold-light/60 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="size-11 rounded-full bg-white border border-gold-deep/40 flex items-center justify-center shrink-0">
                <span
                  className="font-display text-2xl text-emerald leading-none"
                  aria-hidden="true"
                >
                  {b.piece}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-base text-ink leading-tight">
                  {b.name}
                </p>
                <p className="font-serif-quote italic text-[12px] text-ink/60 mt-1 leading-snug">
                  {b.sub}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  INSIGHTS
// ─────────────────────────────────────────────────────────────

function InsightsCard({ stats }: { stats: ChessStats }) {
  const items: { label: string; value: string; sub: string; piece: string }[] = [];
  if (stats.favouriteOpening)
    items.push({ label: "Favourite Opening", value: stats.favouriteOpening.name, sub: `${stats.favouriteOpening.games} games · ${stats.favouriteOpening.winPct}%`, piece: PIECES.bishop });
  if (stats.bestOpening)
    items.push({ label: "Strongest Opening", value: stats.bestOpening.name, sub: `${stats.bestOpening.winPct}% win rate`, piece: PIECES.queen });
  if (stats.worstOpening && stats.worstOpening.name !== stats.bestOpening?.name)
    items.push({ label: "Toughest Opening", value: stats.worstOpening.name, sub: `${stats.worstOpening.winPct}% · needs work`, piece: PIECES.rook });
  if (stats.mostProductiveDay)
    items.push({ label: "Most Productive Day", value: stats.mostProductiveDay.day, sub: `${stats.mostProductiveDay.games} games`, piece: PIECES.knight });
  if (stats.avgAccuracy != null)
    items.push({ label: "Average Accuracy", value: `${stats.avgAccuracy}%`, sub: `across ${stats.totalGames} games`, piece: PIECES.king });
  const shown = items.slice(0, 4);

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      {/* Queen watermark */}
      <span
        className="absolute -bottom-8 -right-4 font-display text-emerald/[0.07] leading-none select-none pointer-events-none"
        style={{ fontSize: "16rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <SectionHeading eyebrow="Insights" title="Patterns we noticed" compact />

      {shown.length === 0 ? (
        <div className="relative border border-dashed border-gold/40 rounded-sm p-6 text-center">
          <p className="font-serif-quote italic text-ink/55 text-sm">
            Insights appear once you have games logged. Connect an account and Sync.
          </p>
        </div>
      ) : (
      <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shown.map((it, i) => (
          <li
            key={i}
            className="group bg-ivory/60 border border-gold/35 rounded-sm p-4 hover:border-emerald hover:bg-emerald/[0.03] transition-colors"
          >
            <div className="flex items-start gap-3">
              <span
                className="font-display text-2xl text-gold-deep group-hover:text-emerald transition-colors leading-none shrink-0"
                aria-hidden="true"
              >
                {it.piece}
              </span>
              <div className="min-w-0">
                <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55">
                  {it.label}
                </p>
                <p className="font-display text-lg text-ink mt-1 leading-tight">
                  {it.value}
                </p>
                <p className="font-serif-quote italic text-[12px] text-gold-deep mt-1">
                  {it.sub}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shared section heading
// ─────────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
  action,
  compact,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-end justify-between gap-4 ${compact ? "mb-5" : "mb-6"}`}
    >
      <div>
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">
          {eyebrow}
        </p>
        <h2
          className={`font-display ${compact ? "text-xl" : "text-2xl"} text-ink leading-tight`}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Loading shell
// ─────────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-32 bg-gold/30 rounded" />
        <div className="h-10 w-80 bg-ink/10 rounded" />
        <div className="h-3 w-48 bg-ink/10 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white border border-gold/30 rounded-sm" />
        ))}
      </div>
      <div className="h-80 bg-white border border-gold/30 rounded-sm" />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-gold/30 rounded-sm" />
          ))}
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="h-40 bg-white border border-gold/30 rounded-sm" />
          <div className="h-40 bg-white border border-gold/30 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
