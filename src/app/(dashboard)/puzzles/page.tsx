"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Flame, Minus, Plus } from "lucide-react";

import {
  LogPuzzlesModal,
  type PuzzleSession,
} from "@/components/puzzles/log-puzzles-modal";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Puzzle Tracker + Heatmap (Page 6)
//  A beautiful habit journal
// ─────────────────────────────────────────────────────────────

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

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

// ─── Date helpers ───
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ─── Seed sample puzzle sessions (≈ last 35 days, not every day) ───
function seedSessions(): PuzzleSession[] {
  const today = new Date();
  // Pseudo-random but stable pattern
  const sessions: PuzzleSession[] = [];
  let rating = 980;
  for (let i = 60; i >= 0; i--) {
    // Skip ~30% of days
    if ((i * 13 + 7) % 10 < 3) continue;
    const date = isoDate(addDays(today, -i));
    const count = 5 + ((i * 7) % 14);
    const accuracy = 70 + ((i * 11) % 25);
    const minutes = 8 + ((i * 5) % 22);
    rating += Math.round(((i * 3) % 7) - 2);
    sessions.push({
      id: `seed-${i}`,
      date,
      count,
      accuracy,
      minutes,
      rating,
      notes:
        i === 0
          ? "Drilled pin and fork motifs — felt sharper than usual."
          : i === 3
            ? "Discovered attacks today. Slow but eye-opening."
            : "",
    });
  }
  return sessions;
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function PuzzlesPage() {
  const [sessions, setSessions] = useState<PuzzleSession[]>(() => seedSessions());
  const [modalOpen, setModalOpen] = useState(false);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => a.date.localeCompare(b.date)),
    [sessions],
  );

  const stats = useMemo(() => computeStats(sorted), [sorted]);
  const motivational = useMemo(() => motivationalLine(stats.currentStreak), [stats.currentStreak]);

  return (
    <div className="relative bg-ivory">
      {/* Background engravings */}
      <span
        className="pointer-events-none absolute top-28 -left-12 font-display text-emerald/[0.04] leading-none select-none hidden lg:block"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>
      <span
        className="pointer-events-none absolute top-[55%] -right-10 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "22rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>
      <span
        className="pointer-events-none absolute bottom-40 -left-10 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "18rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </span>
      <GoldStar className="absolute top-32 right-[14%] size-3 text-gold opacity-50 hidden md:block" />
      <GoldStar className="absolute top-[45%] left-[6%] size-2 text-gold opacity-50 hidden md:block" />
      <Crown className="absolute top-20 right-[32%] w-7 h-5 text-gold-deep opacity-30 hidden lg:block" />

      <VerticalPieceRail />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-12">
        <PageHeader onAdd={() => setModalOpen(true)} />

        <FadeUp>
          <StatCardsRow stats={stats} />
        </FadeUp>

        <FadeUp delay={0.05}>
          <CurrentStreakSection
            streak={stats.currentStreak}
            longest={stats.longestStreak}
            today={stats.todayCount}
            motivational={motivational}
          />
        </FadeUp>

        <FadeUp>
          <PuzzleHistorySection
            sessions={sessions}
            onAdd={() => setModalOpen(true)}
          />
        </FadeUp>

        <FadeUp delay={0.05}>
          <ActivityHeatmap sessions={sessions} />
        </FadeUp>

        <FadeUp>
          <PerformanceChart sessions={sorted} />
        </FadeUp>

        <div className="grid lg:grid-cols-12 gap-8">
          <FadeUp className="lg:col-span-7">
            <DailyConsistency sessions={sorted} stats={stats} />
          </FadeUp>
          <FadeUp delay={0.05} className="lg:col-span-5">
            <AchievementPreview stats={stats} />
          </FadeUp>
        </div>

        <FadeUp>
          <InsightsSection sessions={sorted} stats={stats} />
        </FadeUp>

        <FadeUp>
          <QuoteSection />
        </FadeUp>
      </div>

      <LogPuzzlesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultRating={stats.currentRating}
        onSaved={(s) => setSessions((prev) => [s, ...prev])}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STATS COMPUTATION
// ─────────────────────────────────────────────────────────────

interface PuzzleStats {
  currentRating: number;
  todayCount: number;
  avgAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  totalSessions: number;
  totalMinutes: number;
  bestDayCount: number;
  bestDayDate: string | null;
  perfectAccuracyDays: number;
  bestMonthLabel: string;
  bestMonthCount: number;
}

function computeStats(sorted: PuzzleSession[]): PuzzleStats {
  if (sorted.length === 0) {
    return {
      currentRating: 1100,
      todayCount: 0,
      avgAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalSolved: 0,
      totalSessions: 0,
      totalMinutes: 0,
      bestDayCount: 0,
      bestDayDate: null,
      perfectAccuracyDays: 0,
      bestMonthLabel: "—",
      bestMonthCount: 0,
    };
  }

  const currentRating = sorted[sorted.length - 1].rating;
  const todayStr = isoDate(new Date());
  const todayCount = sorted
    .filter((s) => s.date === todayStr)
    .reduce((a, s) => a + s.count, 0);

  // Aggregate per day
  const byDay = new Map<string, { count: number; acc: number[] }>();
  for (const s of sorted) {
    const e = byDay.get(s.date) ?? { count: 0, acc: [] };
    e.count += s.count;
    e.acc.push(s.accuracy);
    byDay.set(s.date, e);
  }

  const dayDates = Array.from(byDay.keys()).sort();
  const totalSolved = sorted.reduce((a, s) => a + s.count, 0);
  const totalMinutes = sorted.reduce((a, s) => a + s.minutes, 0);
  const avgAccuracy = Math.round(
    sorted.reduce((a, s) => a + s.accuracy, 0) / sorted.length,
  );
  const perfectAccuracyDays = Array.from(byDay.values()).filter((d) => {
    const avg = d.acc.reduce((a, b) => a + b, 0) / d.acc.length;
    return avg >= 99;
  }).length;

  // Streak — based on day dates, counting back from today/yesterday
  let currentStreak = 0;
  const todayD = new Date();
  for (let i = 0; i < 365; i++) {
    const d = addDays(todayD, -i);
    if (byDay.has(isoDate(d))) {
      currentStreak++;
    } else if (i === 0) {
      // today missing — try yesterday to keep streak alive
      continue;
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const d of dayDates) {
    const dd = new Date(d + "T00:00:00");
    if (prev && (dd.getTime() - prev.getTime()) / 86400000 === 1) cur++;
    else cur = 1;
    longestStreak = Math.max(longestStreak, cur);
    prev = dd;
  }

  // Best day
  let bestDayCount = 0;
  let bestDayDate: string | null = null;
  for (const [date, v] of byDay) {
    if (v.count > bestDayCount) {
      bestDayCount = v.count;
      bestDayDate = date;
    }
  }

  // Best month
  const byMonth = new Map<string, number>();
  for (const [date, v] of byDay) {
    const m = date.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + v.count);
  }
  let bestMonthLabel = "—";
  let bestMonthCount = 0;
  for (const [k, v] of byMonth) {
    if (v > bestMonthCount) {
      bestMonthCount = v;
      bestMonthLabel = new Date(k + "-01").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  }

  return {
    currentRating,
    todayCount,
    avgAccuracy,
    currentStreak,
    longestStreak,
    totalSolved,
    totalSessions: sorted.length,
    totalMinutes,
    bestDayCount,
    bestDayDate,
    perfectAccuracyDays,
    bestMonthLabel,
    bestMonthCount,
  };
}

function motivationalLine(streak: number) {
  if (streak === 0) return "One puzzle today is the start of a streak tomorrow.";
  if (streak < 3) return "A small flame still warms the room.";
  if (streak < 7) return "Consistency beats intensity.";
  if (streak < 14) return "One puzzle a day keeps blunders away.";
  if (streak < 30) return "You are quietly compounding skill.";
  return "Few players ever build a habit this long. Keep it.";
}

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="relative pb-6 border-b border-gold/30">
      <span
        className="pointer-events-none absolute -top-10 left-0 font-display text-gold/15 leading-none select-none hidden md:block"
        style={{ fontSize: "13rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
            Chapter Four
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
            <span className="italic text-emerald">Puzzle</span> Tracker
          </h1>
          <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
            &ldquo;Small combinations create great victories.&rdquo;
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Log Puzzles Today
          <span
            className="text-gold transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
//  STAT CARDS
// ─────────────────────────────────────────────────────────────

function StatCardsRow({ stats }: { stats: PuzzleStats }) {
  const cards = [
    { label: "Puzzle Rating",   value: stats.currentRating.toLocaleString(), sub: "Current",                    piece: PIECES.queen },
    { label: "Today's Puzzles", value: stats.todayCount,                     sub: stats.todayCount > 0 ? "Logged today" : "None yet today", piece: PIECES.pawn },
    { label: "Accuracy",        value: `${stats.avgAccuracy}%`,              sub: "All-time average",           piece: PIECES.bishop },
    { label: "Current Streak",  value: `${stats.currentStreak}`,             sub: stats.currentStreak === 1 ? "day" : "days", piece: PIECES.knight, valueSuffix: stats.currentStreak === 1 ? "day" : "days" },
    { label: "Longest Streak",  value: `${stats.longestStreak}`,             sub: "Personal best",              piece: PIECES.rook,   valueSuffix: stats.longestStreak === 1 ? "day" : "days" },
    { label: "Total Solved",    value: stats.totalSolved.toLocaleString(),   sub: `${stats.totalSessions} sessions`, piece: PIECES.king },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
      {cards.map((c, i) => (
        <motion.article
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 0.85, 0.36, 1] }}
          className="group relative bg-white border border-gold/45 rounded-sm p-5 hover:-translate-y-0.5 hover:border-emerald hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.25)] transition-all"
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
        </motion.article>
      ))}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  CURRENT STREAK — large centerpiece
// ─────────────────────────────────────────────────────────────

function CurrentStreakSection({
  streak,
  longest,
  today,
  motivational,
}: {
  streak: number;
  longest: number;
  today: number;
  motivational: string;
}) {
  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-8 lg:p-12 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/50" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/50" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/50" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/50" />

      {/* Bishop watermark */}
      <span
        className="pointer-events-none absolute -bottom-14 -right-6 font-display text-gold/15 leading-none select-none"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </span>

      <div className="relative grid lg:grid-cols-12 items-center gap-8">
        <div className="lg:col-span-7">
          <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-3 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5" /> Current Streak
          </p>
          <div className="flex items-baseline gap-5 flex-wrap">
            <motion.p
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 0.85, 0.36, 1] }}
              className="font-display text-7xl lg:text-8xl text-emerald leading-none"
            >
              {streak}
            </motion.p>
            <span className="font-serif-quote italic text-2xl text-ink/65">
              consecutive {streak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="mt-6 font-serif-quote italic text-xl md:text-2xl text-ink/75 leading-snug max-w-xl">
            &ldquo;{motivational}&rdquo;
          </p>

          <div className="mt-7 pt-5 border-t border-gold/30 grid grid-cols-2 gap-6 max-w-md">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">
                Longest Streak
              </p>
              <p className="font-display text-2xl text-ink mt-1 leading-none">
                {longest}{" "}
                <span className="text-sm text-ink/55 font-sans">
                  {longest === 1 ? "day" : "days"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">
                Today
              </p>
              <p className="font-display text-2xl text-ink mt-1 leading-none">
                {today}{" "}
                <span className="text-sm text-ink/55 font-sans">
                  {today === 1 ? "puzzle" : "puzzles"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(230, 196, 106, 0)",
                  "0 0 0 24px rgba(230, 196, 106, 0.15)",
                  "0 0 0 0 rgba(230, 196, 106, 0)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
            />
            <div className="relative size-44 lg:size-52 rounded-full bg-emerald border-2 border-gold flex items-center justify-center">
              <Flame className="w-16 h-16 lg:w-20 lg:h-20 text-gold" strokeWidth={1.5} />
            </div>
            <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-8 text-gold-deep" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  PUZZLE HISTORY — journal cards
// ─────────────────────────────────────────────────────────────

function PuzzleHistorySection({
  sessions,
  onAdd,
}: {
  sessions: PuzzleSession[];
  onAdd: () => void;
}) {
  const recent = useMemo(
    () =>
      [...sessions]
        .sort((a, b) =>
          b.date === a.date
            ? b.id.localeCompare(a.id)
            : b.date.localeCompare(a.date),
        )
        .slice(0, 8),
    [sessions],
  );

  return (
    <section>
      <SectionHeading
        eyebrow="The Notebook"
        title="Recent sessions"
        action={
          <span className="text-[11px] tracking-[0.22em] uppercase text-ink/50">
            {sessions.length} total
          </span>
        }
      />

      {recent.length === 0 ? (
        <EmptySessions onAdd={onAdd} />
      ) : (
        <ul className="space-y-3">
          {recent.map((s, i) => {
            const prev = recent[i + 1];
            const delta = prev ? s.rating - prev.rating : 0;
            return (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <SessionCard session={s} delta={delta} />
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SessionCard({
  session,
  delta,
}: {
  session: PuzzleSession;
  delta: number;
}) {
  const tone =
    delta > 0 ? "gain" : delta < 0 ? "loss" : "flat";
  const toneStyles = {
    gain: { bar: "bg-emerald", chip: "text-emerald", Icon: ArrowUpRight,   chipBg: "border-emerald/30 bg-emerald/[0.06]" },
    loss: { bar: "bg-gold-deep", chip: "text-gold-deep", Icon: ArrowDownRight, chipBg: "border-gold-deep/30 bg-gold-light/40" },
    flat: { bar: "bg-ink/30", chip: "text-ink/55", Icon: Minus,             chipBg: "border-ink/15 bg-ivory" },
  }[tone];
  const Icon = toneStyles.Icon;

  const dateLabel = new Date(session.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <article className="flex items-stretch bg-white border border-gold/40 rounded-sm overflow-hidden hover:border-emerald transition-colors">
      <div className={`w-[3px] ${toneStyles.bar}`} aria-hidden="true" />
      <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-serif-quote italic text-gold-deep text-[12px] tracking-[0.18em] uppercase">
              {dateLabel}
            </span>
            <span className="text-[10px] tracking-[0.22em] uppercase text-ink/45 px-2 py-0.5 bg-ivory border border-gold/30 rounded-sm">
              {session.minutes} min
            </span>
          </div>
          {session.notes && (
            <p className="font-serif-quote italic text-[13.5px] text-ink/70 leading-snug line-clamp-2">
              &ldquo;{session.notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="text-center">
            <p className="font-display text-2xl text-ink leading-none">
              {session.count}
            </p>
            <p className="text-[9px] tracking-[0.22em] uppercase text-ink/50 mt-1">
              Puzzles
            </p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-ink leading-none">
              {session.accuracy}%
            </p>
            <p className="text-[9px] tracking-[0.22em] uppercase text-ink/50 mt-1">
              Accuracy
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-emerald leading-none">
              {session.rating}
            </p>
            <p className="text-[9px] tracking-[0.22em] uppercase text-ink/50 mt-1">
              Rating
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-sm ${toneStyles.chipBg} ${toneStyles.chip}`}
          >
            <Icon className="w-3 h-3" />
            <span className="font-display text-sm leading-none">
              {delta > 0 ? `+${delta}` : delta}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptySessions({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative bg-white border border-dashed border-gold/45 rounded-sm p-12 text-center">
      <span
        className="font-display text-5xl text-gold-deep/40 leading-none"
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>
      <p className="mt-4 font-display text-xl text-ink">
        No puzzle sessions yet
      </p>
      <p className="mt-2 font-serif-quote italic text-ink/60 text-sm max-w-sm mx-auto">
        Start small — ten puzzles a day adds up faster than you think.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors"
      >
        <Plus className="w-4 h-4 text-gold" />
        Log Today&apos;s Puzzles
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  GITHUB-STYLE HEATMAP — 12 weeks
// ─────────────────────────────────────────────────────────────

interface HeatmapDay {
  date: string;
  intensity: number;
  games: number;
  puzzles: number;
  studyMin: number;
  journal: number;
}

function buildHeatmap(sessions: PuzzleSession[]): HeatmapDay[][] {
  const today = new Date();
  // Last day = today; total 12 weeks = 84 days, aligned to weeks (Sun-Sat)
  // First find the most recent Saturday on/after today
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
  // 12 weeks = 84 days back from endOfWeek
  const start = new Date(endOfWeek);
  start.setDate(endOfWeek.getDate() - 83);

  // Puzzle counts per day (real data)
  const puzzleByDay = new Map<string, number>();
  for (const s of sessions) {
    puzzleByDay.set(s.date, (puzzleByDay.get(s.date) ?? 0) + s.count);
  }

  // Seeded sample for games/study/journal (not stored elsewhere yet)
  const sampledFor = (date: string, kind: "games" | "study" | "journal") => {
    const hash = [...date].reduce((a, c) => a + c.charCodeAt(0), 0);
    const mod =
      kind === "games" ? 4 : kind === "study" ? 30 : 3;
    const offset =
      kind === "games" ? 0 : kind === "study" ? 5 : 1;
    const r = (hash * (kind === "games" ? 7 : kind === "study" ? 11 : 13)) % 10;
    if (r < 3) return 0;
    return ((hash + offset) % mod) + (kind === "study" ? 5 : 0);
  };

  const days: HeatmapDay[] = [];
  for (let i = 0; i < 84; i++) {
    const d = addDays(start, i);
    const iso = isoDate(d);
    const puzzles = puzzleByDay.get(iso) ?? 0;
    const games = sampledFor(iso, "games");
    const studyMin = sampledFor(iso, "study");
    const journal = sampledFor(iso, "journal");
    const intensity =
      games + Math.min(8, puzzles / 3) + studyMin / 10 + journal;
    days.push({
      date: iso,
      intensity,
      games,
      puzzles,
      studyMin,
      journal,
    });
  }

  // Arrange into 12 weeks × 7 days (columns × rows)
  const weeks: HeatmapDay[][] = [];
  for (let w = 0; w < 12; w++) {
    const col: HeatmapDay[] = [];
    for (let r = 0; r < 7; r++) {
      col.push(days[w * 7 + r]);
    }
    weeks.push(col);
  }
  return weeks;
}

function ActivityHeatmap({ sessions }: { sessions: PuzzleSession[] }) {
  const weeks = useMemo(() => buildHeatmap(sessions), [sessions]);
  const [hover, setHover] = useState<HeatmapDay | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Month labels along the top — show only when month changes between weeks
  const monthLabels = useMemo(() => {
    return weeks.map((wk, i) => {
      const first = wk[0];
      const d = new Date(first.date + "T00:00:00");
      const monthIdx = d.getMonth();
      if (i === 0) return d.toLocaleDateString("en-US", { month: "short" });
      const prev = new Date(weeks[i - 1][0].date + "T00:00:00").getMonth();
      return monthIdx !== prev
        ? d.toLocaleDateString("en-US", { month: "short" })
        : "";
    });
  }, [weeks]);

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-10 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/50" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/50" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/50" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/50" />

      {/* Queen watermark */}
      <span
        className="pointer-events-none absolute -bottom-12 -right-6 font-display text-gold/12 leading-none select-none"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
        <div>
          <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
            Habit Map
          </p>
          <h2 className="font-display text-3xl text-ink leading-tight">
            Twelve weeks of <span className="italic text-emerald">consistency</span>
          </h2>
          <p className="mt-2 font-serif-quote italic text-ink/60 text-sm">
            Games, puzzles, study and journal entries — all in one tapestry.
          </p>
        </div>
        <Link
          href="/calendar"
          className="self-start md:self-auto inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-emerald hover:text-emerald-deep transition-colors"
        >
          View Full Calendar →
        </Link>
      </div>

      <div className="relative">
        {/* Month labels */}
        <div className="ml-8 flex gap-[6px] mb-2">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="w-4 text-[10px] tracking-[0.18em] uppercase text-ink/55"
              style={{ minWidth: "calc(theme(spacing.4))" }}
            >
              {m}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Day-of-week labels */}
          <div className="flex flex-col justify-between text-[10px] tracking-[0.18em] uppercase text-ink/45 pt-0.5 pb-0.5 w-6 shrink-0">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          {/* Grid */}
          <div className="flex gap-[6px]">
            {weeks.map((wk, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[6px]">
                {wk.map((day, dIdx) => (
                  <HeatmapCell
                    key={dIdx}
                    day={day}
                    onHover={(d, e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                      setHover(d);
                    }}
                    onLeave={() => {
                      setHover(null);
                      setPos(null);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gold/25 flex items-center justify-between gap-4 text-[10px] tracking-[0.22em] uppercase text-ink/55">
          <span>Last 12 weeks</span>
          <div className="flex items-center gap-2">
            <span>Less</span>
            <span className="size-3 rounded-sm bg-ivory border border-gold/40" />
            <span className="size-3 rounded-sm" style={{ backgroundColor: "#F2E4B0" }} />
            <span className="size-3 rounded-sm" style={{ backgroundColor: "#E6C46A" }} />
            <span className="size-3 rounded-sm" style={{ backgroundColor: "#2D7A56" }} />
            <span className="size-3 rounded-sm" style={{ backgroundColor: "#073A26" }} />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip — fixed positioning */}
      {hover && pos && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y - 12,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-ivory border border-gold/55 shadow-[0_20px_40px_-20px_rgba(17,17,17,0.4)] rounded-sm px-3 py-2 min-w-[12rem]">
            <p className="font-serif-quote italic text-gold-deep text-[11px] tracking-[0.2em] uppercase mb-1.5">
              {new Date(hover.date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <ul className="space-y-1 text-[12px] text-ink/80 font-sans">
              <li className="flex justify-between gap-4">
                <span className="text-ink/55">Games</span>
                <span className="font-display text-ink">{hover.games}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-ink/55">Puzzles</span>
                <span className="font-display text-emerald">{hover.puzzles}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-ink/55">Study</span>
                <span className="font-display text-ink">{hover.studyMin} min</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-ink/55">Journal</span>
                <span className="font-display text-ink">{hover.journal}</span>
              </li>
            </ul>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-2 h-2 bg-ivory border-r border-b border-gold/55 rotate-45 -translate-y-1" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HeatmapCell({
  day,
  onHover,
  onLeave,
}: {
  day: HeatmapDay;
  onHover: (d: HeatmapDay, e: React.MouseEvent<HTMLDivElement>) => void;
  onLeave: () => void;
}) {
  const color = intensityColor(day.intensity);
  const today = isoDate(new Date());
  const isToday = day.date === today;

  return (
    <motion.div
      whileHover={{ scale: 1.25 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      onMouseEnter={(e) => onHover(day, e)}
      onMouseLeave={onLeave}
      className={`size-4 rounded-sm cursor-pointer ${isToday ? "ring-1 ring-gold-deep" : ""}`}
      style={{
        backgroundColor: color,
        border: day.intensity === 0 ? "1px solid rgba(184,146,63,0.25)" : undefined,
      }}
      aria-label={`${day.date}: ${day.puzzles} puzzles, ${day.games} games`}
    />
  );
}

function intensityColor(v: number): string {
  if (v <= 0) return "#FAF8F2";
  if (v < 3) return "#F2E4B0";
  if (v < 6) return "#E6C46A";
  if (v < 10) return "#2D7A56";
  return "#073A26";
}

// ─────────────────────────────────────────────────────────────
//  PERFORMANCE CHART — puzzle rating + accuracy line
// ─────────────────────────────────────────────────────────────

function PerformanceChart({ sessions }: { sessions: PuzzleSession[] }) {
  const data = useMemo(() => {
    // Last 20 sessions
    const slice = sessions.slice(-20);
    return slice.map((s) => ({
      date: new Date(s.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      rating: s.rating,
      accuracy: s.accuracy,
    }));
  }, [sessions]);

  const minR = Math.min(...data.map((d) => d.rating));
  const maxR = Math.max(...data.map((d) => d.rating));

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <SectionHeading
        eyebrow="Performance"
        title="Rating × accuracy, week by week"
        compact
      />

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="rgba(184, 146, 63, 0.15)" strokeDasharray="2 6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
              stroke="rgba(184, 146, 63, 0.4)"
              tickLine={false}
            />
            <YAxis
              yAxisId="rating"
              domain={[Math.max(0, minR - 40), maxR + 40]}
              tick={{ fill: "#B8923F", fontSize: 11, fontFamily: "var(--font-inter)" }}
              stroke="rgba(184, 146, 63, 0.4)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="acc"
              orientation="right"
              domain={[40, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#0E5A3C", fontSize: 11, fontFamily: "var(--font-inter)" }}
              stroke="rgba(14, 90, 60, 0.4)"
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
                padding: "8px 12px",
              }}
              labelStyle={{
                fontFamily: "var(--font-playfair)",
                fontWeight: 600,
                color: "#0E5A3C",
              }}
              cursor={{ stroke: "#0E5A3C", strokeWidth: 1, strokeDasharray: "2 4" }}
            />
            <Line
              yAxisId="rating"
              type="monotone"
              dataKey="rating"
              stroke="#E6C46A"
              strokeWidth={2.5}
              dot={{ fill: "#FAF8F2", stroke: "#B8923F", strokeWidth: 2, r: 4 }}
              activeDot={{ fill: "#0E5A3C", stroke: "#E6C46A", strokeWidth: 2.5, r: 6 }}
              name="Puzzle Rating"
              isAnimationActive
              animationDuration={1100}
            />
            <Line
              yAxisId="acc"
              type="monotone"
              dataKey="accuracy"
              stroke="#0E5A3C"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: "#FAF8F2", stroke: "#0E5A3C", strokeWidth: 2, r: 3 }}
              name="Accuracy %"
              isAnimationActive
              animationDuration={1100}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 pt-4 border-t border-gold/25 flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-ink/55 flex-wrap gap-3">
        <span className="flex items-center gap-2">
          <span className="block w-5 h-[2px] bg-gold" /> Puzzle Rating
        </span>
        <span className="flex items-center gap-2">
          <span
            className="block w-5 h-[2px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #0E5A3C 0 4px, transparent 4px 8px)",
            }}
          />
          Accuracy %
        </span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  DAILY CONSISTENCY
// ─────────────────────────────────────────────────────────────

function DailyConsistency({
  sessions,
  stats,
}: {
  sessions: PuzzleSession[];
  stats: PuzzleStats;
}) {
  // Per-day totals
  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(s.date, (m.get(s.date) ?? 0) + s.count);
    return m;
  }, [sessions]);

  const totalDays = byDay.size;
  const avgDaily = totalDays
    ? Math.round(Array.from(byDay.values()).reduce((a, b) => a + b, 0) / totalDays)
    : 0;
  const weeklyAvg = avgDaily * 7;
  const monthlyAvg = avgDaily * 30;

  const items = [
    {
      label: "Most Active Day",
      value: stats.bestDayDate
        ? new Date(stats.bestDayDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        : "—",
      sub: `${stats.bestDayCount} puzzles solved`,
      piece: PIECES.queen,
    },
    {
      label: "Average Daily Puzzles",
      value: `${avgDaily}`,
      sub: "Across active days",
      piece: PIECES.pawn,
    },
    {
      label: "Weekly Average",
      value: `${weeklyAvg}`,
      sub: "Estimated",
      piece: PIECES.knight,
    },
    {
      label: "Monthly Average",
      value: `${monthlyAvg}`,
      sub: "Estimated",
      piece: PIECES.bishop,
    },
    {
      label: "Best Month",
      value: stats.bestMonthLabel,
      sub: `${stats.bestMonthCount} puzzles`,
      piece: PIECES.rook,
    },
  ];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      {/* Rook ornament */}
      <span
        className="pointer-events-none absolute -top-4 -right-4 font-display text-gold/15 leading-none select-none"
        style={{ fontSize: "14rem" }}
        aria-hidden="true"
      >
        {PIECES.rook}
      </span>

      <SectionHeading
        eyebrow="Consistency"
        title="A long view of your habit"
        compact
      />

      <ol className="relative space-y-3">
        {items.map((it, i) => (
          <motion.li
            key={it.label}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-center gap-4 bg-ivory/60 border border-gold/30 rounded-sm px-4 py-3"
          >
            <div className="size-10 rounded-full bg-emerald flex items-center justify-center shrink-0">
              <span
                className="font-display text-lg text-gold leading-none"
                aria-hidden="true"
              >
                {it.piece}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">
                {it.label}
              </p>
              <p className="font-display text-lg text-ink leading-tight mt-0.5 truncate">
                {it.value}
              </p>
            </div>
            <p className="font-serif-quote italic text-[12px] text-gold-deep whitespace-nowrap">
              {it.sub}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  ACHIEVEMENT PREVIEW
// ─────────────────────────────────────────────────────────────

function AchievementPreview({ stats }: { stats: PuzzleStats }) {
  const badges = [
    {
      name: "10 Puzzle Streak",
      sub: "Solve puzzles for 10 days in a row",
      piece: PIECES.knight,
      unlocked: stats.longestStreak >= 10,
      progress: Math.min(100, (stats.longestStreak / 10) * 100),
      progressLabel: `${stats.longestStreak} / 10`,
    },
    {
      name: "100 Puzzles Solved",
      sub: "Reach 100 total puzzles",
      piece: PIECES.pawn,
      unlocked: stats.totalSolved >= 100,
      progress: Math.min(100, (stats.totalSolved / 100) * 100),
      progressLabel: `${stats.totalSolved} / 100`,
    },
    {
      name: "500 Puzzles Solved",
      sub: "Five hundred deliberate moves",
      piece: PIECES.rook,
      unlocked: stats.totalSolved >= 500,
      progress: Math.min(100, (stats.totalSolved / 500) * 100),
      progressLabel: `${stats.totalSolved} / 500`,
    },
    {
      name: "Perfect Accuracy Day",
      sub: "A flawless session of puzzles",
      piece: PIECES.queen,
      unlocked: stats.perfectAccuracyDays > 0,
      progress: stats.perfectAccuracyDays > 0 ? 100 : 0,
      progressLabel: stats.perfectAccuracyDays > 0 ? "Earned" : "—",
    },
  ];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <Crown className="absolute -top-2 right-6 w-20 h-12 text-gold-deep/25" aria-hidden="true" />

      <SectionHeading
        eyebrow="Achievements"
        title="Badges in reach"
        compact
      />

      <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
        {badges.map((b, i) => (
          <motion.li
            key={b.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className={`relative p-4 rounded-sm border ${
              b.unlocked
                ? "bg-gold-light/55 border-gold-deep/40"
                : "bg-ivory/60 border-gold/30"
            }`}
          >
            {b.unlocked && (
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(230, 196, 106, 0)",
                    "0 0 0 8px rgba(230, 196, 106, 0.18)",
                    "0 0 0 0 rgba(230, 196, 106, 0)",
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="absolute inset-0 pointer-events-none rounded-sm"
              />
            )}
            <div className="relative flex items-start gap-3">
              <div className={`size-11 rounded-full flex items-center justify-center shrink-0 border ${
                b.unlocked
                  ? "bg-white border-gold-deep/40"
                  : "bg-ivory border-ink/15"
              }`}>
                <span
                  className={`font-display text-2xl leading-none ${b.unlocked ? "text-emerald" : "text-ink/30"}`}
                  aria-hidden="true"
                >
                  {b.piece}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-display text-base leading-tight ${b.unlocked ? "text-ink" : "text-ink/60"}`}>
                    {b.name}
                  </p>
                  {b.unlocked && (
                    <span className="text-[8px] tracking-[0.22em] uppercase text-gold-deep">
                      ★ Earned
                    </span>
                  )}
                </div>
                <p className="font-serif-quote italic text-[12px] text-ink/55 mt-0.5 leading-snug">
                  {b.sub}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${b.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={b.unlocked ? "h-full bg-gold-deep" : "h-full bg-emerald"}
                    />
                  </div>
                  <span className="text-[10px] tracking-[0.22em] uppercase text-ink/55 whitespace-nowrap">
                    {b.progressLabel}
                  </span>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  INSIGHTS
// ─────────────────────────────────────────────────────────────

function InsightsSection({
  sessions,
  stats,
}: {
  sessions: PuzzleSession[];
  stats: PuzzleStats;
}) {
  const fastestImprovement = useMemo(() => {
    if (sessions.length < 2) return 0;
    let best = 0;
    for (let i = 1; i < sessions.length; i++) {
      best = Math.max(best, sessions[i].rating - sessions[i - 1].rating);
    }
    return best;
  }, [sessions]);

  const biggestGain = useMemo(() => {
    if (sessions.length < 2) return 0;
    return sessions[sessions.length - 1].rating - sessions[0].rating;
  }, [sessions]);

  const cards = [
    {
      title: "Best Puzzle Day",
      label: stats.bestDayDate
        ? new Date(stats.bestDayDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
          })
        : "—",
      sub: `${stats.bestDayCount} puzzles`,
      piece: PIECES.queen,
    },
    {
      title: "Most Productive Time",
      label: "Evenings",
      sub: "Inferred · 7 – 9 pm",
      piece: PIECES.knight,
    },
    {
      title: "Average Accuracy",
      label: `${stats.avgAccuracy}%`,
      sub: "All-time",
      piece: PIECES.bishop,
    },
    {
      title: "Fastest Improvement",
      label: fastestImprovement > 0 ? `+${fastestImprovement}` : "—",
      sub: "Best single jump",
      piece: PIECES.rook,
    },
    {
      title: "Biggest Rating Gain",
      label: biggestGain >= 0 ? `+${biggestGain}` : `${biggestGain}`,
      sub: "Since you started",
      piece: PIECES.king,
    },
  ];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-10 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <span
        className="pointer-events-none absolute -bottom-12 -right-6 font-display text-emerald/[0.07] leading-none select-none"
        style={{ fontSize: "24rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <SectionHeading eyebrow="Insights" title="Patterns the puzzles reveal" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="bg-ivory/60 border border-gold/35 rounded-sm p-5 hover:border-emerald hover:bg-emerald/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 font-medium">
                {c.title}
              </p>
              <span
                className="font-display text-xl text-gold-deep leading-none"
                aria-hidden="true"
              >
                {c.piece}
              </span>
            </div>
            <p className="font-display text-lg text-ink leading-tight">
              {c.label}
            </p>
            <p className="mt-1 font-serif-quote italic text-[12px] text-gold-deep">
              {c.sub}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  QUOTE
// ─────────────────────────────────────────────────────────────

function QuoteSection() {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-7">
          <GoldStar className="size-3 text-gold" />
          <span className="h-px w-12 bg-gold-deep/55" />
          <Fleur className="size-4 text-gold-deep" />
          <span className="h-px w-12 bg-gold-deep/55" />
          <GoldStar className="size-3 text-gold" />
        </div>
        <blockquote className="font-serif-quote italic text-2xl md:text-[2rem] leading-snug text-ink/85">
          &ldquo;Chess is 99 percent tactics.&rdquo;
        </blockquote>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold-deep/45" />
          <cite className="not-italic font-display tracking-[0.28em] uppercase text-[11px] text-gold-deep">
            Richard Teichmann
          </cite>
          <span className="h-px w-10 bg-gold-deep/45" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  VERTICAL PIECE RAIL
// ─────────────────────────────────────────────────────────────

function VerticalPieceRail() {
  const pieces = [
    { glyph: PIECES.pawn,   tone: "text-gold-deep" },
    { glyph: PIECES.knight, tone: "text-emerald"   },
    { glyph: PIECES.bishop, tone: "text-gold-deep" },
    { glyph: PIECES.rook,   tone: "text-emerald"   },
    { glyph: PIECES.queen,  tone: "text-gold-deep" },
  ];
  return (
    <aside
      className="hidden xl:flex fixed top-1/2 right-4 -translate-y-1/2 flex-col items-center gap-5 z-10 pointer-events-none opacity-80"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <React.Fragment key={i}>
          <span className={`font-display text-3xl leading-none ${p.tone}`}>
            {p.glyph}
          </span>
          {i < pieces.length - 1 && (
            <span className="block h-5 w-px bg-gold/45" />
          )}
        </React.Fragment>
      ))}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shared atoms
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
    <div className={`flex items-end justify-between gap-4 ${compact ? "mb-5" : "mb-6"}`}>
      <div>
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">
          {eyebrow}
        </p>
        <h2 className={`font-display ${compact ? "text-xl" : "text-2xl"} text-ink leading-tight`}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
