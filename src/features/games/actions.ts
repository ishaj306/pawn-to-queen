"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag, unstable_cache } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { createReadClient } from "@/supabase/read";
import { userTag } from "@/lib/cache-tags";
import { gameSchema, firstIssue } from "@/lib/validation";
import { recomputeGoals } from "@/features/goals/actions";
import type {
  GameRow,
  GamePlatform,
  GameResult,
  RatingFormat,
} from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Games — server actions (Clerk + service-role)
// ─────────────────────────────────────────────────────────────

export interface CreateGameInput {
  opponent:     string;
  played_at:    string; // YYYY-MM-DD
  platform:     GamePlatform;
  result:       GameResult;
  opening:      string;
  format:       RatingFormat;
  accuracy?:    number | null;
  time_control?: string | null;
  blunders?:    number;
  mistakes?:    number;
  brilliant?:   number;
  missed_wins?: number;
  notes?:       string | null;
}

export async function createGame(input: CreateGameInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const parsed = gameSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: firstIssue(parsed.error) };
  const v = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("games")
      .insert({
        user_id:      userId,
        opponent:     v.opponent,
        played_at:    v.played_at,
        platform:     v.platform,
        result:       v.result,
        opening:      v.opening,
        format:       v.format,
        accuracy:     v.accuracy ?? null,
        time_control: v.time_control ?? null,
        blunders:     v.blunders ?? 0,
        mistakes:     v.mistakes ?? 0,
        brilliant:    v.brilliant ?? 0,
        missed_wins:  v.missed_wins ?? 0,
        notes:        v.notes ?? null,
      })
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "games"));
    recomputeGoals().catch((e) => console.error("recomputeGoals (game):", e));
    return { success: true as const, data };
  } catch (err) {
    console.error("createGame error:", err);
    return { success: false as const, error: "Could not save the game." };
  }
}

export async function getGames(): Promise<GameRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createReadClient();
  const fetcher = unstable_cache(
    async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("user_id", uid)
          .order("played_at", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) {
          console.error("getGames error:", error.message);
          return [];
        }
        return data ?? [];
      } catch (err) {
        console.error("getGames exception:", err);
        return [];
      }
    },
    ["games", userId],
    { tags: [userTag(userId, "games")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function deleteGame(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "games"));
    return { success: true as const };
  } catch (err) {
    console.error("deleteGame error:", err);
    return { success: false as const, error: "Could not delete the game." };
  }
}
