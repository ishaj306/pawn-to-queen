import { describe, it, expect } from "vitest";

import { computeChessStats, type ChessDataset } from "./chess-stats";
import type { GameRow, RatingEntryRow, PuzzleRow } from "@/types/database";

// ── Fixture factories ────────────────────────────────────────────
let seq = 0;
function game(p: Partial<GameRow> = {}): GameRow {
  seq += 1;
  return {
    id: `g${seq}`,
    user_id: "u1",
    opponent: "Opp",
    played_at: "2026-01-10",
    platform: "Chess.com",
    result: "win",
    opening: "Sicilian Defense",
    accuracy: null,
    time_control: null,
    format: "Rapid",
    blunders: 0,
    mistakes: 0,
    brilliant: 0,
    missed_wins: 0,
    notes: null,
    source: null,
    external_id: null,
    created_at: "2026-01-10T00:00:00Z",
    ...p,
  };
}
function rating(p: Partial<RatingEntryRow> = {}): RatingEntryRow {
  seq += 1;
  return {
    id: `r${seq}`,
    user_id: "u1",
    rating: 1000,
    format: "Rapid",
    entry_date: "2026-01-10",
    notes: null,
    game_result: null,
    mistake_category: null,
    mindset: null,
    takeaway: null,
    is_starred: false,
    created_at: "2026-01-10T00:00:00Z",
    ...p,
  };
}
function puzzle(p: Partial<PuzzleRow> = {}): PuzzleRow {
  seq += 1;
  return {
    id: `p${seq}`,
    user_id: "u1",
    session_date: "2026-01-10",
    count: 10,
    accuracy: null,
    minutes: null,
    puzzle_rating: null,
    notes: null,
    created_at: "2026-01-10T00:00:00Z",
    ...p,
  };
}
function dataset(p: Partial<ChessDataset> = {}): ChessDataset {
  return { games: [], ratings: [], puzzles: [], journal: [], study: [], ...p };
}

// Local YYYY-MM-DD offset helper, matching chess-stats' timezone logic.
function localDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

describe("computeChessStats — empty", () => {
  const s = computeChessStats(dataset());

  it("reports no data", () => {
    expect(s.hasAnyData).toBe(false);
    expect(s.hasGames).toBe(false);
    expect(s.hasRatings).toBe(false);
  });

  it("falls back to a default rating of 800 and zeroed games", () => {
    expect(s.currentRating).toBe(800);
    expect(s.totalGames).toBe(0);
    expect(s.winRate).toBe(0);
    expect(s.avgAccuracy).toBeNull();
    expect(s.favouriteOpening).toBeNull();
  });
});

describe("computeChessStats — games", () => {
  const games = [
    game({ result: "win" }),
    game({ result: "win" }),
    game({ result: "loss" }),
    game({ result: "draw" }),
  ];
  const s = computeChessStats(dataset({ games }));

  it("counts results and rounds win rate", () => {
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(1);
    expect(s.draws).toBe(1);
    expect(s.totalGames).toBe(4);
    expect(s.winRate).toBe(50); // 2/4
  });

  it("sums brilliancies and blunders", () => {
    const withMoves = computeChessStats(
      dataset({ games: [game({ brilliant: 2, blunders: 1 }), game({ brilliant: 1, blunders: 3 })] }),
    );
    expect(withMoves.brilliancies).toBe(3);
    expect(withMoves.blunders).toBe(4);
  });

  it("averages accuracy, ignoring null entries", () => {
    const s2 = computeChessStats(
      dataset({ games: [game({ accuracy: 80 }), game({ accuracy: 90 }), game({ accuracy: null })] }),
    );
    expect(s2.avgAccuracy).toBe(85);
  });
});

describe("computeChessStats — openings", () => {
  const games = [
    game({ opening: "Sicilian Defense", result: "win" }),
    game({ opening: "Sicilian Defense", result: "win" }),
    game({ opening: "Sicilian Defense", result: "loss" }),
    game({ opening: "French Defense", result: "loss" }),
    game({ opening: "French Defense", result: "loss" }),
  ];
  const s = computeChessStats(dataset({ games }));

  it("picks the most-played as favourite", () => {
    expect(s.favouriteOpening?.name).toBe("Sicilian Defense");
    expect(s.favouriteOpening?.games).toBe(3);
    expect(s.favouriteOpening?.winPct).toBe(67); // 2/3 rounded
  });

  it("picks best/worst by win% among openings with >=2 games", () => {
    expect(s.bestOpening?.name).toBe("Sicilian Defense");
    expect(s.worstOpening?.name).toBe("French Defense");
    expect(s.worstOpening?.winPct).toBe(0);
  });

  it("excludes single-game openings from best/worst", () => {
    const s2 = computeChessStats(
      dataset({ games: [game({ opening: "Rare Line", result: "win" }), game({ opening: "Main", result: "loss" }), game({ opening: "Main", result: "loss" })] }),
    );
    expect(s2.bestOpening?.name).toBe("Main"); // "Rare Line" (1 game) excluded
  });
});

describe("computeChessStats — ratings", () => {
  const ratings = [
    rating({ rating: 1000, format: "Rapid", entry_date: "2026-01-01" }),
    rating({ rating: 1100, format: "Rapid", entry_date: "2026-01-05" }),
    rating({ rating: 1050, format: "Rapid", entry_date: "2026-01-10" }),
    rating({ rating: 1300, format: "Blitz", entry_date: "2026-01-11" }),
  ];
  const s = computeChessStats(dataset({ ratings, primaryFormat: "Rapid" }));

  it("uses the primary format's latest as current rating", () => {
    expect(s.currentRating).toBe(1050); // latest Rapid, not the 1300 Blitz
  });

  it("tracks peak across all entries and growth from start of the series", () => {
    expect(s.peakRating).toBe(1300);
    expect(s.startRating).toBe(1000);
    expect(s.ratingGrowth).toBe(50); // 1050 - 1000
  });

  it("builds a chronological series filtered to the primary format", () => {
    expect(s.ratingSeries.map((p) => p.rating)).toEqual([1000, 1100, 1050]);
  });

  it("records per-format current/peak", () => {
    expect(s.ratingByFormat.Rapid).toEqual({ current: 1050, peak: 1100 });
    expect(s.ratingByFormat.Blitz).toEqual({ current: 1300, peak: 1300 });
  });
});

describe("computeChessStats — activity & puzzles", () => {
  it("computes a current streak that includes today", () => {
    const games = [0, 1, 2].map((n) => game({ played_at: localDaysAgo(n) }));
    const s = computeChessStats(dataset({ games }));
    expect(s.currentStreak).toBe(3);
  });

  it("aggregates puzzle totals and best accuracy", () => {
    const puzzles = [
      puzzle({ count: 10, accuracy: 80, puzzle_rating: 1500, session_date: "2026-01-09" }),
      puzzle({ count: 15, accuracy: 92, puzzle_rating: 1520, session_date: "2026-01-10" }),
    ];
    const s = computeChessStats(dataset({ puzzles }));
    expect(s.puzzlesSolved).toBe(25);
    expect(s.puzzleSessions).toBe(2);
    expect(s.bestPuzzleAccuracy).toBe(92);
    expect(s.latestPuzzleRating).toBe(1520); // most recent session
  });
});
