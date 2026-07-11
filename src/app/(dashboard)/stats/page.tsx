"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getRatingEntries } from "@/features/ratings/actions";
import { getGames } from "@/features/games/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import type {
  GameRow,
  JournalRow,
  JournalMood,
  PuzzleRow,
  RatingEntryRow,
} from "@/types/database";

const PIECES = { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" };

const MOOD_META: Record<JournalMood, { label: string; glyph: string; color: string }> = {
  focused:    { label: "Focused",    glyph: "◎", color: "var(--emerald)" },
  excited:    { label: "Excited",    glyph: "✦", color: "var(--gold-deep)" },
  calm:       { label: "Calm",       glyph: "❍", color: "var(--emerald-light)" },
  curious:    { label: "Curious",    glyph: "✧", color: "var(--gold-deep)" },
  tired:      { label: "Tired",      glyph: "☾", color: "var(--text-muted)" },
  frustrated: { label: "Frustrated", glyph: "▲", color: "var(--danger)" },
};

type Window = "weekly" | "monthly" | "yearly";

export default function StatsPage() {
  const [ratings, setRatings] = useState<RatingEntryRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowSel, setWindowSel] = useState<Window>("monthly");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, g, p, j] = await Promise.all([
          getRatingEntries(),
          getGames(),
          getPuzzles(),
          getJournalEntries(),
        ]);
        if (cancelled) return;
        setRatings(r as RatingEntryRow[]);
        setGames(g);
        setPuzzles(p);
        setJournal(j);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const cutoff = useMemo(() => {
    const d = new Date(now);
    if (windowSel === "weekly")  d.setDate(d.getDate() - 7);
    if (windowSel === "monthly") d.setDate(d.getDate() - 30);
    if (windowSel === "yearly")  d.setDate(d.getDate() - 365);
    return d;
  }, [now, windowSel]);

  const cutoffStr = isoDate(cutoff);

  const filt = useMemo(() => {
    const r = ratings.filter((x) => x.entry_date >= cutoffStr);
    const g = games.filter((x) => x.played_at >= cutoffStr);
    const p = puzzles.filter((x) => x.session_date >= cutoffStr);
    const j = journal.filter((x) => x.entry_date >= cutoffStr);
    return { r, g, p, j };
  }, [ratings, games, puzzles, journal, cutoffStr]);

  const overall = useMemo(() => computeOverall(filt), [filt]);
  const trend = useMemo(() => computeTrend(filt, windowSel), [filt, windowSel]);
  const openings = useMemo(() => topOpenings(filt.g), [filt.g]);
  const insights = useMemo(() => computeInsights(filt), [filt]);
  const moodPerf = useMemo(() => computeMoodPerformance(filt), [filt]);

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span className="pointer-events-none absolute top-32 -left-10 font-display text-gold/15 leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.bishop}</span>
      <span className="pointer-events-none absolute bottom-12 -right-12 font-display text-emerald/[0.05] leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.queen}</span>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-12">
        <FadeUp>
          <header className="relative pb-6 border-b border-gold/30 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Chapter Eight</p>
              <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                <span className="italic text-emerald">Statistics</span> & Insights
              </h1>
              <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
                &ldquo;What gets measured grows. What gets remembered transforms.&rdquo;
              </p>
            </div>
            <WindowToggle value={windowSel} onChange={setWindowSel} />
          </header>
        </FadeUp>

        {/* Overall stats */}
        <FadeUp>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Stat label="Games"     value={overall.games}     piece={PIECES.rook}   />
            <Stat label="Win Rate"  value={`${overall.winRate}%`} piece={PIECES.queen} tone="emerald" />
            <Stat label="Puzzles"   value={overall.puzzles}   piece={PIECES.knight} />
            <Stat label="Accuracy"  value={`${overall.accuracy}%`} piece={PIECES.bishop} />
          </section>
        </FadeUp>

        {/* Rating trend */}
        <FadeUp>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
            <CornerBrackets />
            <SectionHeading eyebrow="Trajectory" title={`Rating in the last ${labelOf(windowSel)}`} />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(184, 146, 63, 0.15)" strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }} stroke="rgba(184, 146, 63, 0.4)" tickLine={false} />
                  <YAxis tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }} stroke="rgba(184, 146, 63, 0.4)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#FAF8F2", border: "1px solid #E6C46A", borderRadius: "2px", fontFamily: "var(--font-inter)", fontSize: "12px" }} cursor={{ stroke: "#0E5A3C", strokeDasharray: "2 4" }} />
                  <Line type="monotone" dataKey="rating" stroke="#E6C46A" strokeWidth={2.5} dot={{ fill: "#FAF8F2", stroke: "#0E5A3C", strokeWidth: 2, r: 4 }} isAnimationActive animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </FadeUp>

        {/* Activity bar chart */}
        <div className="grid lg:grid-cols-2 gap-8">
          <FadeUp>
            <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden h-full">
              <CornerBrackets />
              <SectionHeading eyebrow="Activity" title="Games vs puzzles per period" compact />
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(184, 146, 63, 0.15)" strokeDasharray="2 6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#4A463F", fontSize: 10 }} stroke="rgba(184, 146, 63, 0.4)" tickLine={false} />
                    <YAxis tick={{ fill: "#4A463F", fontSize: 10 }} stroke="rgba(184, 146, 63, 0.4)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#FAF8F2", border: "1px solid #E6C46A", borderRadius: "2px", fontSize: "12px" }} cursor={{ fill: "rgba(14,90,60,0.05)" }} />
                    <Bar dataKey="games"   fill="#0E5A3C" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={900} />
                    <Bar dataKey="puzzles" fill="#E6C46A" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-ink/55">
                <span className="flex items-center gap-2"><span className="block size-2 bg-emerald rounded-sm" /> Games</span>
                <span className="flex items-center gap-2"><span className="block size-2 bg-gold rounded-sm" /> Puzzle sessions</span>
              </div>
            </section>
          </FadeUp>

          {/* Top openings */}
          <FadeUp delay={0.05}>
            <section className="relative bg-white border border-gold/45 rounded-sm p-7 overflow-hidden h-full">
              <CornerBrackets />
              <SectionHeading eyebrow="Repertoire" title="Most played openings" compact />
              {openings.length === 0 ? (
                <p className="font-serif-quote italic text-ink/55 text-sm">No games yet — log a few and your repertoire fills in.</p>
              ) : (
                <ul className="space-y-3">
                  {openings.map((o, i) => (
                    <li key={o.name}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-display text-base text-ink">{o.name}</span>
                        <span className="text-[11px] tracking-[0.22em] uppercase text-ink/55">{o.games} games · {o.winPct}% win</span>
                      </div>
                      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${o.winPct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className={o.winPct >= 50 ? "h-full bg-emerald" : "h-full bg-gold"}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </FadeUp>
        </div>

        {/* Insights */}
        <FadeUp>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
            <CornerBrackets />
            <span className="pointer-events-none absolute -bottom-10 -right-6 font-display text-gold/15 leading-none select-none" style={{ fontSize: "22rem" }} aria-hidden="true">{PIECES.queen}</span>

            <SectionHeading eyebrow="Insights" title="What the data whispers" />

            <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {insights.map((c, i) => (
                <motion.article
                  key={c.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="bg-ivory/60 border border-gold/35 rounded-sm p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 font-medium">{c.title}</p>
                    <span className="font-display text-xl text-gold-deep leading-none" aria-hidden="true">{c.piece}</span>
                  </div>
                  <p className="font-display text-lg text-ink leading-tight">{c.value}</p>
                  <p className="mt-1 font-serif-quote italic text-[12px] text-gold-deep">{c.sub}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </FadeUp>

        {/* Emotional analytics — mood vs result */}
        <FadeUp>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
            <CornerBrackets />
            <SectionHeading eyebrow="Emotional Analytics" title="How feeling shapes the result" />
            {!moodPerf.rows.some((r) => r.games > 0) ? (
              <p className="font-serif-quote italic text-ink/55 text-sm max-w-lg">
                Journal your mood on the days you play, and this reveals which states of mind win you games.
                Not enough overlapping days in this window yet.
              </p>
            ) : (
              <>
                {moodPerf.best && (
                  <p className="mb-7 font-serif-quote italic text-lg text-ink/75 max-w-2xl">
                    You win most when you feel{" "}
                    <span className="not-italic font-medium" style={{ color: moodPerf.best.color }}>
                      {moodPerf.best.label.toLowerCase()}
                    </span>{" "}
                    — {moodPerf.best.winRate}% across {moodPerf.best.games} games.
                    {moodPerf.tilt && moodPerf.tilt.mood !== moodPerf.best.mood && (
                      <>
                        {" "}Beware{" "}
                        <span className="not-italic font-medium" style={{ color: moodPerf.tilt.color }}>
                          {moodPerf.tilt.label.toLowerCase()}
                        </span>
                        : just {moodPerf.tilt.winRate}%.
                      </>
                    )}
                  </p>
                )}
                <ul className="space-y-4">
                  {moodPerf.rows.filter((r) => r.games > 0).map((r, i) => (
                    <li key={r.mood}>
                      <div className="flex items-baseline justify-between mb-1.5 gap-4">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-base leading-none" style={{ color: r.color }} aria-hidden="true">{r.glyph}</span>
                          <span className="font-display text-base text-ink">{r.label}</span>
                        </span>
                        <span className="text-[11px] tracking-[0.16em] uppercase text-ink/55 text-right shrink-0">
                          {r.winRate}% win · {r.games} games
                          {r.ratingDelta !== 0 && (
                            <span style={{ color: r.ratingDelta > 0 ? "var(--emerald)" : "var(--danger)" }}>
                              {" "}· {r.ratingDelta > 0 ? "+" : ""}{r.ratingDelta} rating
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${r.winRate}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className="h-full"
                          style={{ backgroundColor: r.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

interface MoodPerf {
  mood: JournalMood;
  label: string;
  glyph: string;
  color: string;
  games: number;
  wins: number;
  winRate: number;
  days: number;
  ratingDelta: number;
}

// Correlates journal mood with same-day game outcomes and rating change.
// A game/rating "inherits" the mood the player journaled that calendar day.
function computeMoodPerformance(f: Filtered): {
  rows: MoodPerf[];
  best: MoodPerf | null;
  tilt: MoodPerf | null;
} {
  const moodByDate = new Map<string, JournalMood>();
  for (const j of f.j) {
    if (j.mood && !moodByDate.has(j.entry_date)) moodByDate.set(j.entry_date, j.mood);
  }

  const agg = new Map<JournalMood, { games: number; wins: number; days: Set<string>; delta: number }>();
  const ensure = (m: JournalMood) => {
    let e = agg.get(m);
    if (!e) { e = { games: 0, wins: 0, days: new Set(), delta: 0 }; agg.set(m, e); }
    return e;
  };

  for (const g of f.g) {
    const m = moodByDate.get(g.played_at);
    if (!m) continue;
    const e = ensure(m);
    e.games += 1;
    if (g.result === "win") e.wins += 1;
    e.days.add(g.played_at);
  }

  const sortedR = [...f.r].sort((a, b) =>
    a.entry_date < b.entry_date ? -1 : a.entry_date > b.entry_date ? 1 : 0,
  );
  for (let i = 1; i < sortedR.length; i++) {
    const m = moodByDate.get(sortedR[i].entry_date);
    if (!m) continue;
    ensure(m).delta += sortedR[i].rating - sortedR[i - 1].rating;
  }

  const rows: MoodPerf[] = [];
  for (const [mood, e] of agg) {
    if (e.games === 0 && e.delta === 0) continue;
    const meta = MOOD_META[mood];
    rows.push({
      mood,
      label: meta.label,
      glyph: meta.glyph,
      color: meta.color,
      games: e.games,
      wins: e.wins,
      winRate: e.games ? Math.round((e.wins / e.games) * 100) : 0,
      days: e.days.size,
      ratingDelta: e.delta,
    });
  }
  rows.sort((a, b) => b.winRate - a.winRate || b.games - a.games);

  const withEnough = rows.filter((r) => r.games >= 2);
  const best = withEnough[0] ?? null;
  const tilt = withEnough.length > 1 ? withEnough[withEnough.length - 1] : null;
  return { rows, best, tilt };
}

interface Filtered {
  r: RatingEntryRow[];
  g: GameRow[];
  p: PuzzleRow[];
  j: JournalRow[];
}

function computeOverall(f: Filtered) {
  const games = f.g.length;
  const wins = f.g.filter((x) => x.result === "win").length;
  const winRate = games ? Math.round((wins / games) * 100) : 0;
  const puzzles = f.p.reduce((a, x) => a + (x.count ?? 0), 0);
  const accuracies = f.g.map((x) => x.accuracy).filter((a): a is number => a !== null);
  const accuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
  return { games, winRate, puzzles, accuracy };
}

function computeTrend(f: Filtered, w: Window) {
  // bucket sizes
  const buckets = w === "weekly" ? 7 : w === "monthly" ? 6 : 12;
  const days = w === "weekly" ? 1 : w === "monthly" ? 5 : 30;

  // Walk back from today, build buckets
  const arr: { label: string; games: number; puzzles: number; rating: number | null }[] = [];
  const today = new Date();
  for (let i = buckets - 1; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(today.getDate() - i * days);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    const startStr = isoDate(start);
    const endStr = isoDate(end);

    const gamesInBucket = f.g.filter((x) => x.played_at >= startStr && x.played_at <= endStr).length;
    const puzzlesInBucket = f.p.filter((x) => x.session_date >= startStr && x.session_date <= endStr).reduce((a, x) => a + x.count, 0);
    const ratingsInBucket = f.r.filter((x) => x.entry_date >= startStr && x.entry_date <= endStr);
    const lastRating = ratingsInBucket.length ? ratingsInBucket[ratingsInBucket.length - 1].rating : null;

    arr.push({
      label:
        w === "yearly"
          ? end.toLocaleDateString("en-US", { month: "short" })
          : end.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      games: gamesInBucket,
      puzzles: puzzlesInBucket,
      rating: lastRating,
    });
  }

  // Carry-forward last rating so the chart isn't full of holes.
  let last = arr.find((b) => b.rating !== null)?.rating ?? 800;
  for (const b of arr) {
    if (b.rating === null) b.rating = last;
    else last = b.rating;
  }
  return arr as { label: string; games: number; puzzles: number; rating: number }[];
}

function topOpenings(games: GameRow[]) {
  const map = new Map<string, { games: number; wins: number }>();
  for (const g of games) {
    const e = map.get(g.opening) ?? { games: 0, wins: 0 };
    e.games++;
    if (g.result === "win") e.wins++;
    map.set(g.opening, e);
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, games: v.games, winPct: Math.round((v.wins / v.games) * 100) }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);
}

function computeInsights(f: Filtered) {
  // Best opening
  const ops = topOpenings(f.g);
  const bestOpening = ops.filter((o) => o.games >= 2).sort((a, b) => b.winPct - a.winPct)[0];

  // Most journaled mood
  const moodCount = new Map<string, number>();
  for (const j of f.j) if (j.mood) moodCount.set(j.mood, (moodCount.get(j.mood) ?? 0) + 1);
  const topMood = Array.from(moodCount.entries()).sort((a, b) => b[1] - a[1])[0];

  // Highest accuracy game
  const acc = [...f.g].filter((g) => g.accuracy !== null).sort((a, b) => (b.accuracy as number) - (a.accuracy as number))[0];

  // Day-of-week breakdown for games
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowCount = new Map<number, number>();
  for (const g of f.g) {
    const d = new Date(g.played_at + "T00:00:00").getDay();
    dowCount.set(d, (dowCount.get(d) ?? 0) + 1);
  }
  const topDow = Array.from(dowCount.entries()).sort((a, b) => b[1] - a[1])[0];

  return [
    {
      title: "Best Opening",
      value: bestOpening?.name ?? "—",
      sub: bestOpening ? `${bestOpening.winPct}% in ${bestOpening.games} games` : "Need more games",
      piece: PIECES.queen,
    },
    {
      title: "Highest Accuracy",
      value: acc?.accuracy != null ? `${acc.accuracy}%` : "—",
      sub: acc ? `vs ${acc.opponent}` : "No data",
      piece: PIECES.bishop,
    },
    {
      title: "Mood at the Board",
      value: topMood ? topMood[0] : "—",
      sub: topMood ? `${topMood[1]} entries` : "Add journal entries",
      piece: PIECES.knight,
    },
    {
      title: "Favorite Day",
      value: topDow ? dows[topDow[0]] : "—",
      sub: topDow ? `${topDow[1]} games` : "No games yet",
      piece: PIECES.rook,
    },
  ];
}

function labelOf(w: Window) {
  return w === "weekly" ? "7 days" : w === "monthly" ? "30 days" : "year";
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Reusable atoms ───────────────────────────────────────────────

function WindowToggle({ value, onChange }: { value: Window; onChange: (v: Window) => void }) {
  const opts: { v: Window; label: string }[] = [
    { v: "weekly", label: "Week" },
    { v: "monthly", label: "Month" },
    { v: "yearly", label: "Year" },
  ];
  return (
    <div className="inline-flex p-1 bg-white border border-gold/45 rounded-sm self-start">
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} className="relative px-5 py-2 text-[11px] tracking-[0.24em] uppercase font-medium transition-colors z-10">
            {active && (
              <motion.span layoutId="stats-window" className="absolute inset-0 bg-emerald border border-gold rounded-sm -z-10" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
            )}
            <span className={active ? "text-ivory" : "text-ink/65 hover:text-emerald transition-colors"}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  piece,
  tone = "ink",
}: {
  label: string;
  value: number | string;
  piece: string;
  tone?: "ink" | "emerald";
}) {
  return (
    <article className="relative bg-white border border-gold/45 rounded-sm p-6 hover:-translate-y-0.5 hover:border-emerald hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.25)] transition-all group">
      <CornerBrackets small />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 font-medium">{label}</p>
        <span className="font-display text-2xl text-gold-deep group-hover:text-emerald transition-colors leading-none">{piece}</span>
      </div>
      <p className={`font-display text-4xl leading-none ${tone === "emerald" ? "text-emerald" : "text-ink"}`}>{value}</p>
    </article>
  );
}

function CornerBrackets({ small = false }: { small?: boolean }) {
  const c = small ? "size-2 border-gold-deep/45" : "size-2 border-gold-deep/50";
  return (
    <>
      <span className={`absolute top-2 left-2 border-t border-l ${c}`} />
      <span className={`absolute top-2 right-2 border-t border-r ${c}`} />
      <span className={`absolute bottom-2 left-2 border-b border-l ${c}`} />
      <span className={`absolute bottom-2 right-2 border-b border-r ${c}`} />
    </>
  );
}

function SectionHeading({ eyebrow, title, compact }: { eyebrow: string; title: string; compact?: boolean }) {
  return (
    <div className={compact ? "mb-4" : "mb-6"}>
      <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">{eyebrow}</p>
      <h2 className={`font-display ${compact ? "text-xl" : "text-2xl"} text-ink leading-tight`}>{title}</h2>
    </div>
  );
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}>
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-12 w-72 bg-ink/10 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-28 bg-white border border-gold/30 rounded-sm" />))}
      </div>
      <div className="h-72 bg-white border border-gold/30 rounded-sm" />
    </div>
  );
}

// Cell from recharts isn't used but importing to keep parity with other pages
void Cell;
