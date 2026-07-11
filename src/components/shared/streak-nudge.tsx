"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Feather, Flame } from "lucide-react";

import { getRatingEntries } from "@/features/ratings/actions";
import { getGames } from "@/features/games/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import { getStudySessions } from "@/features/study/actions";
import type { RatingEntryRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Streak Nudge — retention, reframed.
//
//  Instead of a guilt-inducing "don't lose your streak!" counter,
//  this frames continuous practice as an unfolding manuscript: each
//  active day is a line in the current "chapter". The copy adapts to
//  four states (writing / resting / new chapter / blank page) so the
//  nudge feels like encouragement, never a scold.
// ─────────────────────────────────────────────────────────────

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

function localISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Current consecutive-day streak counting back from today (or yesterday,
// so the streak is only "lost" after a full day of silence).
function currentStreak(dateSet: Set<string>): { streak: number; activeToday: boolean } {
  const activeToday = dateSet.has(localISO(0));
  const activeYesterday = dateSet.has(localISO(1));
  if (!activeToday && !activeYesterday) return { streak: 0, activeToday: false };
  let streak = 0;
  let offset = activeToday ? 0 : 1;
  while (dateSet.has(localISO(offset))) {
    streak += 1;
    offset += 1;
  }
  return { streak, activeToday };
}

function longestStreak(dates: string[]): number {
  const uniq = Array.from(new Set(dates)).sort();
  if (uniq.length === 0) return 0;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = new Date(uniq[i - 1] + "T00:00:00Z").getTime();
    const cur = new Date(uniq[i] + "T00:00:00Z").getTime();
    const diff = Math.round((cur - prev) / 86_400_000);
    if (diff === 1) run += 1;
    else if (diff > 1) run = 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

export function StreakNudge() {
  const [dates, setDates] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ratings, games, puzzles, journal, study] = await Promise.all([
          getRatingEntries() as Promise<RatingEntryRow[]>,
          getGames(),
          getPuzzles(),
          getJournalEntries(),
          getStudySessions(),
        ]);
        if (cancelled) return;
        const all = [
          ...ratings.map((r) => r.entry_date),
          ...games.map((g) => g.played_at),
          ...puzzles.map((p) => p.session_date),
          ...journal.map((j) => j.entry_date),
          ...study.map((s) => s.entry_date),
        ].filter(Boolean);
        setDates(all);
      } catch {
        if (!cancelled) setDates([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const view = useMemo(() => {
    if (!dates) return null;
    const set = new Set(dates);
    const { streak, activeToday } = currentStreak(set);
    const longest = longestStreak(dates);
    const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
    const toGo = nextMilestone ? nextMilestone - streak : 0;
    return { hasHistory: dates.length > 0, streak, activeToday, longest, nextMilestone, toGo };
  }, [dates]);

  if (!view) {
    return <div className="h-24 rounded-sm border border-gold/25 bg-white/40 animate-pulse" />;
  }

  // ── Copy by state ──
  let eyebrow: string;
  let headline: React.ReactNode;
  let sub: React.ReactNode;
  let cta: string | null = null;
  let tone: "writing" | "resting" | "blank" = "blank";

  if (view.streak > 0 && view.activeToday) {
    tone = "writing";
    eyebrow = "The chapter continues";
    headline = <>Day <span className="text-emerald">{view.streak}</span> of your current chapter.</>;
    sub = view.nextMilestone
      ? <>{view.toGo} {view.toGo === 1 ? "day" : "days"} until a {view.nextMilestone}-day chapter — and your longest yet is {view.longest}.</>
      : <>Your longest chapter is {view.longest} days. Keep writing.</>;
  } else if (view.streak > 0 && !view.activeToday) {
    tone = "resting";
    eyebrow = "Your chapter rests";
    headline = <>Day {view.streak} — <span className="text-gold-deep">unfinished</span>.</>;
    sub = <>A single entry today keeps the story going. Log anything — a game, a puzzle, a thought.</>;
    cta = "Add a line today";
  } else if (view.hasHistory) {
    tone = "blank";
    eyebrow = "A new chapter awaits";
    headline = <>Begin again.</>;
    sub = <>Your longest chapter reached {view.longest} days. Today is a fresh first page.</>;
    cta = "Start today's entry";
  } else {
    tone = "blank";
    eyebrow = "The first page";
    headline = <>Every master was once a pawn.</>;
    sub = <>Log your first game, rating or reflection to begin your manuscript.</>;
    cta = "Write your first line";
  }

  return (
    <div className="relative overflow-hidden rounded-sm border border-gold/40 bg-white p-6">
      <span className="pointer-events-none absolute -right-4 -bottom-6 font-display text-emerald/[0.06] leading-none select-none" style={{ fontSize: "9rem" }} aria-hidden="true">♛</span>
      <div className="relative flex items-start gap-4">
        <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ivory">
          {tone === "writing"
            ? <Flame className="h-5 w-5 text-emerald" />
            : <Feather className="h-5 w-5 text-gold-deep" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.28em] uppercase text-gold-deep font-medium">{eyebrow}</p>
          <p className="mt-1.5 font-display text-2xl text-ink leading-tight">{headline}</p>
          <p className="mt-2 font-serif-quote italic text-[15px] text-ink/65 leading-snug">{sub}</p>
          {cta && (
            <Link
              href="/journal"
              className="mt-4 inline-flex items-center gap-2 bg-emerald text-ivory px-4 py-2 text-[11px] tracking-[0.2em] uppercase hover:bg-emerald-deep transition-colors"
            >
              {cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
