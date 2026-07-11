// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — CENTRAL computed-statistics service.
//
//  The single source of truth for every derived number in the app.
//  Every page feeds the SAME synchronized dataset (from the cached
//  getters / the connected Chess.com·Lichess account) through THESE
//  functions, so the current rating, win rate, best opening, streak,
//  activity, etc. are identical everywhere — no page invents its own
//  math, and nothing is ever hardcoded or sampled.
//
//  Pure & deterministic: same input → same output.
// ─────────────────────────────────────────────────────────────

import type {
  GameRow,
  RatingEntryRow,
  PuzzleRow,
  JournalRow,
  StudySessionRow,
  RatingFormat,
  FormatRatings,
} from "@/types/database";

export interface ChessDataset {
  games: GameRow[];
  ratings: RatingEntryRow[];
  puzzles: PuzzleRow[];
  journal: JournalRow[];
  study: StudySessionRow[];
  primaryFormat?: RatingFormat;
}

export interface OpeningStat {
  name: string;
  games: number;
  wins: number;
  winPct: number;
}

export interface ChessStats {
  hasGames: boolean;
  hasRatings: boolean;
  hasAnyData: boolean;

  // ── Ratings (one current rating, everywhere) ──
  currentRating: number;
  peakRating: number;
  startRating: number;
  ratingGrowth: number;
  ratingByFormat: FormatRatings;
  ratingSeries: { date: string; rating: number }[]; // chronological, primary format

  // ── Games ──
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  brilliancies: number;
  blunders: number;
  avgAccuracy: number | null;
  topOpenings: OpeningStat[];
  favouriteOpening: OpeningStat | null; // most played
  bestOpening: OpeningStat | null; // best win% (min 2 games)
  worstOpening: OpeningStat | null; // worst win% (min 2 games)
  recentGames: GameRow[]; // most recent first
  gamesPerWeek: { label: string; games: number }[]; // last 5 weeks incl. current
  gamesThisMonth: number;
  gamesLastMonth: number;
  monthOverMonthPct: number | null;
  mostProductiveDay: { day: string; games: number } | null;

  // ── Activity ──
  activityByDate: Record<string, number>;
  currentStreak: number;
  longestStreak: number;

  // ── Puzzles ──
  puzzlesSolved: number;
  puzzleSessions: number;
  bestPuzzleAccuracy: number | null;
  latestPuzzleRating: number | null;
  puzzleStreak: number;

  // ── Study & Journal ──
  studyMinutes: number;
  journalEntries: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (n: number) => String(n).padStart(2, "0");
function localISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Longest run of consecutive calendar days present in a set of ISO dates.
function longestRun(dates: string[]): number {
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

// Current consecutive-day streak counting back from today (or yesterday).
function currentRun(dateSet: Set<string>): number {
  const today = dateSet.has(localISO(0));
  const yesterday = dateSet.has(localISO(1));
  if (!today && !yesterday) return 0;
  let streak = 0;
  let offset = today ? 0 : 1;
  while (dateSet.has(localISO(offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}

function openingStats(games: GameRow[]): OpeningStat[] {
  const map = new Map<string, { games: number; wins: number }>();
  for (const g of games) {
    const name = (g.opening || "Unknown").trim();
    const e = map.get(name) ?? { games: 0, wins: 0 };
    e.games += 1;
    if (g.result === "win") e.wins += 1;
    map.set(name, e);
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      games: v.games,
      wins: v.wins,
      winPct: v.games ? Math.round((v.wins / v.games) * 100) : 0,
    }))
    .sort((a, b) => b.games - a.games);
}

export function computeChessStats(data: ChessDataset): ChessStats {
  const { games, ratings, puzzles, journal, study } = data;
  const primaryFormat = data.primaryFormat ?? "Rapid";

  // ── Ratings ──
  const sortedRatings = [...ratings].sort((a, b) =>
    a.entry_date < b.entry_date ? -1 :
    a.entry_date > b.entry_date ? 1 :
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
  );

  const byFormat: FormatRatings = {};
  for (const r of sortedRatings) {
    const slot = byFormat[r.format];
    if (!slot) byFormat[r.format] = { current: r.rating, peak: r.rating };
    else {
      slot.current = r.rating;
      slot.peak = Math.max(slot.peak, r.rating);
    }
  }

  // ONE current rating: the primary format's latest, else latest overall.
  const primarySlot = byFormat[primaryFormat];
  const latestOverall = sortedRatings.length ? sortedRatings[sortedRatings.length - 1].rating : null;
  const currentRating = primarySlot?.current ?? latestOverall ?? 800;
  const peakRating = sortedRatings.length ? Math.max(...sortedRatings.map((r) => r.rating)) : currentRating;

  // Chart series follows the primary format when present, else all entries.
  const seriesSource = sortedRatings.some((r) => r.format === primaryFormat)
    ? sortedRatings.filter((r) => r.format === primaryFormat)
    : sortedRatings;
  const ratingSeries = seriesSource.map((r) => ({ date: r.entry_date, rating: r.rating }));
  const startRating = seriesSource.length ? seriesSource[0].rating : currentRating;

  // ── Games ──
  const sortedGames = [...games].sort((a, b) =>
    a.played_at < b.played_at ? 1 :
    a.played_at > b.played_at ? -1 :
    a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0,
  ); // most recent first

  const wins = games.filter((g) => g.result === "win").length;
  const losses = games.filter((g) => g.result === "loss").length;
  const draws = games.filter((g) => g.result === "draw").length;
  const totalGames = games.length;
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;
  const brilliancies = games.reduce((a, g) => a + (g.brilliant ?? 0), 0);
  const blunders = games.reduce((a, g) => a + (g.blunders ?? 0), 0);
  const accs = games.map((g) => g.accuracy).filter((a): a is number => a !== null && a !== undefined);
  const avgAccuracy = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;

  const openings = openingStats(games);
  const favouriteOpening = openings[0] ?? null;
  const rated = openings.filter((o) => o.games >= 2);
  const bestOpening = rated.length ? [...rated].sort((a, b) => b.winPct - a.winPct)[0] : null;
  const worstOpening = rated.length ? [...rated].sort((a, b) => a.winPct - b.winPct)[0] : null;

  // Games per week — last 5 weeks (oldest→newest).
  const gamesPerWeek: { label: string; games: number }[] = [];
  for (let w = 4; w >= 0; w--) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const s = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const e = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
    const count = games.filter((g) => g.played_at >= s && g.played_at <= e).length;
    gamesPerWeek.push({ label: `W${5 - w}`, games: count });
  }

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}`;
  const gamesThisMonth = games.filter((g) => g.played_at.startsWith(thisMonthPrefix)).length;
  const gamesLastMonth = games.filter((g) => g.played_at.startsWith(lastMonthPrefix)).length;
  const monthOverMonthPct = gamesLastMonth > 0
    ? Math.round(((gamesThisMonth - gamesLastMonth) / gamesLastMonth) * 100)
    : null;

  // Most productive weekday.
  const dowCount = new Map<number, number>();
  for (const g of games) {
    const d = new Date(g.played_at + "T00:00:00Z").getUTCDay();
    dowCount.set(d, (dowCount.get(d) ?? 0) + 1);
  }
  let mostProductiveDay: { day: string; games: number } | null = null;
  for (const [d, c] of dowCount) {
    if (!mostProductiveDay || c > mostProductiveDay.games) mostProductiveDay = { day: WEEKDAYS[d], games: c };
  }

  // ── Activity (all surfaces) ──
  const activityByDate: Record<string, number> = {};
  const bump = (iso?: string) => { if (iso) activityByDate[iso] = (activityByDate[iso] ?? 0) + 1; };
  ratings.forEach((r) => bump(r.entry_date));
  games.forEach((g) => bump(g.played_at));
  puzzles.forEach((p) => bump(p.session_date));
  journal.forEach((j) => bump(j.entry_date));
  study.forEach((s) => bump(s.entry_date));

  const allDates = Object.keys(activityByDate);
  const currentStreak = currentRun(new Set(allDates));
  const longestStreak = longestRun(allDates);

  // ── Puzzles ──
  const puzzlesSolved = puzzles.reduce((a, p) => a + (p.count ?? 0), 0);
  const puzzleSessions = puzzles.length;
  const bestPuzzleAccuracy = puzzles.length ? Math.max(...puzzles.map((p) => p.accuracy ?? 0)) : null;
  const puzzleDatesSorted = [...puzzles].sort((a, b) => (a.session_date < b.session_date ? 1 : -1));
  const latestPuzzleRating = puzzleDatesSorted.find((p) => p.puzzle_rating != null)?.puzzle_rating ?? null;
  const puzzleStreak = currentRun(new Set(puzzles.map((p) => p.session_date)));

  return {
    hasGames: totalGames > 0,
    hasRatings: ratings.length > 0,
    hasAnyData: totalGames + ratings.length + puzzles.length + journal.length + study.length > 0,

    currentRating,
    peakRating,
    startRating,
    ratingGrowth: currentRating - startRating,
    ratingByFormat: byFormat,
    ratingSeries,

    totalGames,
    wins,
    losses,
    draws,
    winRate,
    brilliancies,
    blunders,
    avgAccuracy,
    topOpenings: openings.slice(0, 5),
    favouriteOpening,
    bestOpening,
    worstOpening,
    recentGames: sortedGames,
    gamesPerWeek,
    gamesThisMonth,
    gamesLastMonth,
    monthOverMonthPct,
    mostProductiveDay,

    activityByDate,
    currentStreak,
    longestStreak,

    puzzlesSolved,
    puzzleSessions,
    bestPuzzleAccuracy,
    latestPuzzleRating,
    puzzleStreak,

    studyMinutes: study.reduce((a, s) => a + (s.minutes ?? 0), 0),
    journalEntries: journal.length,
  };
}
