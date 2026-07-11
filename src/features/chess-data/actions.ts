"use server";

import { getGames } from "@/features/games/actions";
import { getRatingEntries } from "@/features/ratings/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import { getStudySessions } from "@/features/study/actions";
import { getGoals } from "@/features/goals/actions";
import { getAchievements } from "@/features/achievements/actions";
import { getProfile } from "@/features/profile/actions";
import type {
  GameRow,
  RatingEntryRow,
  PuzzleRow,
  JournalRow,
  StudySessionRow,
  GoalRow,
  AchievementRow,
  ProfileRow,
} from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  getChessData — the ONE fetch the whole app derives from.
//  Pulls every synchronized surface (from the connected Chess.com /
//  Lichess account + any manual logs) in parallel, through the same
//  per-user cached getters. Pair with computeChessStats() so every
//  page shows identical numbers.
// ─────────────────────────────────────────────────────────────

export interface ChessData {
  games: GameRow[];
  ratings: RatingEntryRow[];
  puzzles: PuzzleRow[];
  journal: JournalRow[];
  study: StudySessionRow[];
  goals: GoalRow[];
  achievements: AchievementRow[];
  profile: ProfileRow | null;
}

export async function getChessData(): Promise<ChessData> {
  const [games, ratings, puzzles, journal, study, goals, achievements, profile] =
    await Promise.all([
      getGames(),
      getRatingEntries() as Promise<RatingEntryRow[]>,
      getPuzzles(),
      getJournalEntries(),
      getStudySessions(),
      getGoals(),
      getAchievements(),
      getProfile(),
    ]);
  return { games, ratings, puzzles, journal, study, goals, achievements, profile };
}
