"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
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

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("games")
      .insert({
        user_id:      userId,
        opponent:     input.opponent,
        played_at:    input.played_at,
        platform:     input.platform,
        result:       input.result,
        opening:      input.opening,
        format:       input.format,
        accuracy:     input.accuracy ?? null,
        time_control: input.time_control ?? null,
        blunders:     input.blunders ?? 0,
        mistakes:     input.mistakes ?? 0,
        brilliant:    input.brilliant ?? 0,
        missed_wins:  input.missed_wins ?? 0,
        notes:        input.notes ?? null,
      })
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "games"));
    recomputeGoals().catch((e) => console.error("recomputeGoals (game):", e));
    revalidatePath("/", "layout");
    return { success: true as const, data: data as unknown as GameRow };
  } catch (err) {
    console.error("createGame error:", err);
    return { success: false as const, error: "Could not save the game." };
  }
}

export async function getGames(): Promise<GameRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const fetcher = unstable_cache(
    async (uid: string) => {
      try {
        const supabase = createAdminClient();
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
        return (data ?? []) as unknown as GameRow[];
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
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (err) {
    console.error("deleteGame error:", err);
    return { success: false as const, error: "Could not delete the game." };
  }
}
