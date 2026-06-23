// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — achievement catalog & unlock derivation.
//  Pure logic. Pages call evaluate() to see which badges are unlocked.
// ─────────────────────────────────────────────────────────────

import type {
  GameRow,
  JournalRow,
  PuzzleRow,
  RatingEntryRow,
} from "@/types/database";

export interface Badge {
  key:         string;
  name:        string;
  description: string;
  piece:       string; // chess glyph
  group:       "rating" | "puzzles" | "games" | "streak" | "journal";
  threshold:   number; // contextual — see check()
}

export const BADGES: Badge[] = [
  // ─── Rating milestones ───
  { key: "rating_500",   name: "Knight Initiated",  description: "Reach a 500 rating.",    piece: "♘", group: "rating",   threshold: 500   },
  { key: "rating_800",   name: "Steady Footing",    description: "Reach an 800 rating.",   piece: "♘", group: "rating",   threshold: 800   },
  { key: "rating_1000",  name: "Bishop's Welcome",  description: "Reach a 1000 rating.",   piece: "♗", group: "rating",   threshold: 1000  },
  { key: "rating_1500",  name: "Tactical Sight",    description: "Reach a 1500 rating.",   piece: "♗", group: "rating",   threshold: 1500  },
  { key: "rating_2000",  name: "Rook on the Seventh", description: "Reach a 2000 rating.", piece: "♖", group: "rating",   threshold: 2000  },

  // ─── Puzzles ───
  { key: "puzzles_first",   name: "First Solution",     description: "Solve your first puzzle.",        piece: "♙", group: "puzzles",  threshold: 1   },
  { key: "puzzles_100",     name: "Pattern Hunter",     description: "Solve 100 puzzles.",              piece: "♘", group: "puzzles",  threshold: 100 },
  { key: "puzzles_500",     name: "Sharp Eye",          description: "Solve 500 puzzles.",              piece: "♗", group: "puzzles",  threshold: 500 },
  { key: "puzzles_1000",    name: "Tactical Architect", description: "Solve 1,000 puzzles.",            piece: "♖", group: "puzzles",  threshold: 1000 },
  { key: "puzzle_perfect",  name: "Flawless Session",   description: "Hit 100% accuracy on a day.",     piece: "♕", group: "puzzles",  threshold: 100 },

  // ─── Games ───
  { key: "games_first", name: "First Move",      description: "Log your first game.",       piece: "♙", group: "games",  threshold: 1  },
  { key: "games_first_win", name: "First Victory",   description: "Win a logged game.",     piece: "♘", group: "games",  threshold: 1  },
  { key: "games_10",    name: "Tournament Director", description: "Log 10 games.",          piece: "♗", group: "games",  threshold: 10 },
  { key: "games_50",    name: "Match-Hardened",  description: "Log 50 games.",              piece: "♖", group: "games",  threshold: 50 },
  { key: "brilliant_5", name: "Brilliancy Prize", description: "Earn 5 brilliant moves.",   piece: "♕", group: "games",  threshold: 5  },

  // ─── Streaks ───
  { key: "streak_3",   name: "First Three",      description: "Three day puzzle streak.",   piece: "♙", group: "streak",  threshold: 3  },
  { key: "streak_7",   name: "Weekly Discipline", description: "A week-long streak.",        piece: "♘", group: "streak",  threshold: 7  },
  { key: "streak_30",  name: "A Habit Forms",    description: "Thirty days unbroken.",      piece: "♗", group: "streak",  threshold: 30 },
  { key: "streak_100", name: "Centurion",        description: "One hundred days in a row.", piece: "♕", group: "streak",  threshold: 100 },

  // ─── Journal ───
  { key: "journal_first", name: "Pen and Board",    description: "Write your first journal entry.", piece: "♙", group: "journal", threshold: 1  },
  { key: "journal_10",    name: "Reflective Player", description: "Ten journal entries.",            piece: "♗", group: "journal", threshold: 10 },
  { key: "journal_50",    name: "The Annotator",    description: "Fifty journal entries.",          piece: "♕", group: "journal", threshold: 50 },
];

export interface EvalInput {
  ratings: RatingEntryRow[];
  puzzles: PuzzleRow[];
  games:   GameRow[];
  journal: JournalRow[];
}

export interface BadgeStatus {
  badge:    Badge;
  unlocked: boolean;
  progress: number; // 0..100
  detail:   string; // human label like "12/100"
}

export function evaluate(input: EvalInput): BadgeStatus[] {
  const { ratings, puzzles, games, journal } = input;

  // Aggregate metrics once
  const peakRating = ratings.length
    ? Math.max(...ratings.map((r) => r.rating))
    : 0;
  const puzzleTotal = puzzles.reduce((a, p) => a + (p.count ?? 0), 0);
  const perfectDays = puzzles.filter((p) => (p.accuracy ?? 0) >= 100).length;
  const gamesTotal = games.length;
  const wins = games.filter((g) => g.result === "win").length;
  const brilliantTotal = games.reduce((a, g) => a + (g.brilliant ?? 0), 0);
  const longestPuzzleStreak = longestStreak(puzzles.map((p) => p.session_date));
  const journalTotal = journal.length;

  return BADGES.map((b) => {
    let current = 0;
    let target = b.threshold;

    switch (b.group) {
      case "rating":
        current = peakRating;
        break;
      case "puzzles":
        if (b.key === "puzzle_perfect") {
          current = perfectDays > 0 ? 100 : 0;
          target = 100;
        } else if (b.key === "puzzles_first") {
          current = puzzleTotal > 0 ? 1 : 0;
        } else {
          current = puzzleTotal;
        }
        break;
      case "games":
        if (b.key === "games_first_win") current = wins > 0 ? 1 : 0;
        else if (b.key === "brilliant_5") current = brilliantTotal;
        else if (b.key === "games_first") current = gamesTotal > 0 ? 1 : 0;
        else current = gamesTotal;
        break;
      case "streak":
        current = longestPuzzleStreak;
        break;
      case "journal":
        if (b.key === "journal_first") current = journalTotal > 0 ? 1 : 0;
        else current = journalTotal;
        break;
    }

    const unlocked = current >= target;
    const progress = Math.min(100, Math.max(0, (current / target) * 100));
    const detail =
      target === 1
        ? unlocked ? "Earned" : "Not yet"
        : `${current.toLocaleString()} / ${target.toLocaleString()}`;

    return { badge: b, unlocked, progress, detail };
  });
}

// Longest run of consecutive ISO dates from any array of YYYY-MM-DD strings.
function longestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = Array.from(new Set(dates)).sort();
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1] + "T00:00:00Z").getTime();
    const b = new Date(sorted[i] + "T00:00:00Z").getTime();
    const diffDays = Math.round((b - a) / 86400000);
    if (diffDays === 1) {
      cur++;
      longest = Math.max(longest, cur);
    } else if (diffDays > 1) {
      cur = 1;
    }
  }
  return longest;
}
