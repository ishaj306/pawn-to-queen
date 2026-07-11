"use server";

import { auth } from "@clerk/nextjs/server";

import { getRatingEntries } from "@/features/ratings/actions";
import { getGames } from "@/features/games/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import { getStudySessions } from "@/features/study/actions";
import { titleFor } from "@/utils/stats";
import type {
  RatingEntryRow,
  GameRow,
  JournalMood,
} from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Chess Wrapped — a year of a player's journey, aggregated.
//
//  Reads the already-cached activity getters (per-user, tagged) and
//  folds them into a shareable annual recap. Pure aggregation — no
//  new DB round-trips beyond what the cached getters already do.
// ─────────────────────────────────────────────────────────────

export interface WrappedData {
  year: number;
  hasData: boolean;
  generatedAt: string;

  rating: {
    start: number | null;
    end: number | null;
    delta: number;
    peak: number | null;
    entries: number;
    title: string; // Pawn → Queen band for the end rating
  };

  games: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number; // 0..100
    brilliancies: number;
    bestOpening: { name: string; wins: number } | null;
    nemesis: { name: string; losses: number } | null; // most-lost-to opponent
  };

  puzzles: {
    sessions: number;
    solved: number;
    bestAccuracy: number | null;
  };

  study: {
    minutes: number;
    hours: number;
    topKind: string | null;
  };

  journal: {
    entries: number;
    topMood: JournalMood | null;
    moodArc: { month: number; mood: JournalMood }[]; // dominant mood per month
  };

  streak: {
    longest: number; // longest consecutive-day activity streak in the year
  };

  busiestMonth: { month: number; count: number } | null;
}

const inYear = (iso: string, year: number) => iso.slice(0, 4) === String(year);

// Longest run of consecutive calendar days present in a set of ISO dates.
function longestDayStreak(dates: string[]): number {
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

function topCount<T extends string>(values: T[]): { key: T; count: number } | null {
  if (values.length === 0) return null;
  const tally = new Map<T, number>();
  for (const v of values) tally.set(v, (tally.get(v) ?? 0) + 1);
  let best: { key: T; count: number } | null = null;
  for (const [key, count] of tally) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

export async function getWrapped(year?: number): Promise<WrappedData> {
  const targetYear = year ?? new Date().getFullYear();
  const { userId } = await auth();

  const empty: WrappedData = {
    year: targetYear,
    hasData: false,
    generatedAt: new Date().toISOString(),
    rating: { start: null, end: null, delta: 0, peak: null, entries: 0, title: "Pawn" },
    games: { total: 0, wins: 0, losses: 0, draws: 0, winRate: 0, brilliancies: 0, bestOpening: null, nemesis: null },
    puzzles: { sessions: 0, solved: 0, bestAccuracy: null },
    study: { minutes: 0, hours: 0, topKind: null },
    journal: { entries: 0, topMood: null, moodArc: [] },
    streak: { longest: 0 },
    busiestMonth: null,
  };
  if (!userId) return empty;

  const [ratings, games, puzzles, journal, study] = await Promise.all([
    getRatingEntries() as Promise<RatingEntryRow[]>,
    getGames(),
    getPuzzles(),
    getJournalEntries(),
    getStudySessions(),
  ]);

  const yr = <T extends { entry_date?: string; played_at?: string; session_date?: string }>(
    rows: T[],
    dateKey: keyof T,
  ) => rows.filter((r) => inYear(String(r[dateKey]), targetYear));

  const yRatings = yr(ratings, "entry_date");
  const yGames = yr(games, "played_at");
  const yPuzzles = yr(puzzles, "session_date");
  const yJournal = yr(journal, "entry_date");
  const yStudy = yr(study, "entry_date");

  const hasData =
    yRatings.length + yGames.length + yPuzzles.length + yJournal.length + yStudy.length > 0;
  if (!hasData) return empty;

  // ── Rating journey ──
  const sortedRatings = [...yRatings].sort((a, b) =>
    a.entry_date < b.entry_date ? -1 : a.entry_date > b.entry_date ? 1 : 0,
  );
  const start = sortedRatings.length ? sortedRatings[0].rating : null;
  const end = sortedRatings.length ? sortedRatings[sortedRatings.length - 1].rating : null;
  const peak = sortedRatings.length ? Math.max(...sortedRatings.map((r) => r.rating)) : null;

  // ── Games ──
  const wins = yGames.filter((g) => g.result === "win").length;
  const losses = yGames.filter((g) => g.result === "loss").length;
  const draws = yGames.filter((g) => g.result === "draw").length;
  const brilliancies = yGames.reduce((a, g) => a + (g.brilliant ?? 0), 0);
  const winRate = yGames.length ? Math.round((wins / yGames.length) * 100) : 0;

  const openingWins = topCount(
    yGames.filter((g) => g.result === "win").map((g) => g.opening).filter(Boolean) as string[],
  );
  const bestOpening = openingWins ? { name: openingWins.key, wins: openingWins.count } : null;

  const oppLosses = topCount(
    yGames.filter((g) => g.result === "loss").map((g) => g.opponent).filter(Boolean) as string[],
  );
  const nemesis = oppLosses && oppLosses.count > 1 ? { name: oppLosses.key, losses: oppLosses.count } : null;

  // ── Puzzles ──
  const solved = yPuzzles.reduce((a, p) => a + (p.count ?? 0), 0);
  const bestAccuracy = yPuzzles.length
    ? Math.max(...yPuzzles.map((p) => p.accuracy ?? 0))
    : null;

  // ── Study ──
  const studyMinutes = yStudy.reduce((a, s) => a + (s.minutes ?? 0), 0);
  const topKind = topCount(yStudy.map((s) => s.kind))?.key ?? null;

  // ── Journal + mood arc ──
  const topMood = topCount(yJournal.map((j) => j.mood).filter(Boolean) as JournalMood[])?.key ?? null;
  const moodByMonth = new Map<number, JournalMood[]>();
  for (const j of yJournal) {
    if (!j.mood) continue;
    const m = Number(j.entry_date.slice(5, 7)) - 1;
    const arr = moodByMonth.get(m) ?? [];
    arr.push(j.mood);
    moodByMonth.set(m, arr);
  }
  const moodArc = Array.from(moodByMonth.entries())
    .map(([month, moods]) => ({ month, mood: topCount(moods)!.key }))
    .sort((a, b) => a.month - b.month);

  // ── Longest activity streak across every logged surface ──
  const allDates = [
    ...yRatings.map((r) => r.entry_date),
    ...yGames.map((g) => g.played_at),
    ...yPuzzles.map((p) => p.session_date),
    ...yJournal.map((j) => j.entry_date),
    ...yStudy.map((s) => s.entry_date),
  ];
  const longest = longestDayStreak(allDates);

  // ── Busiest month (all activity) ──
  const monthTally = new Map<number, number>();
  for (const d of allDates) {
    const m = Number(d.slice(5, 7)) - 1;
    monthTally.set(m, (monthTally.get(m) ?? 0) + 1);
  }
  let busiestMonth: { month: number; count: number } | null = null;
  for (const [month, count] of monthTally) {
    if (!busiestMonth || count > busiestMonth.count) busiestMonth = { month, count };
  }

  return {
    year: targetYear,
    hasData: true,
    generatedAt: new Date().toISOString(),
    rating: {
      start,
      end,
      delta: start !== null && end !== null ? end - start : 0,
      peak,
      entries: yRatings.length,
      title: titleFor(end ?? start ?? 0).name,
    },
    games: {
      total: yGames.length,
      wins,
      losses,
      draws,
      winRate,
      brilliancies,
      bestOpening,
      nemesis,
    },
    puzzles: { sessions: yPuzzles.length, solved, bestAccuracy },
    study: { minutes: studyMinutes, hours: Math.round((studyMinutes / 60) * 10) / 10, topKind },
    journal: { entries: yJournal.length, topMood, moodArc },
    streak: { longest },
    busiestMonth,
  };
}

// Which years the user actually has data for — powers the year switcher.
export async function getWrappedYears(): Promise<number[]> {
  const { userId } = await auth();
  if (!userId) return [new Date().getFullYear()];

  const [ratings, games, puzzles, journal, study] = await Promise.all([
    getRatingEntries() as Promise<RatingEntryRow[]>,
    getGames(),
    getPuzzles(),
    getJournalEntries(),
    getStudySessions(),
  ]);

  const years = new Set<number>();
  const push = (iso?: string) => {
    if (iso) years.add(Number(iso.slice(0, 4)));
  };
  ratings.forEach((r) => push(r.entry_date));
  games.forEach((g: GameRow) => push(g.played_at));
  puzzles.forEach((p) => push(p.session_date));
  journal.forEach((j) => push(j.entry_date));
  study.forEach((s) => push(s.entry_date));

  const current = new Date().getFullYear();
  years.add(current);
  return Array.from(years).sort((a, b) => b - a);
}
