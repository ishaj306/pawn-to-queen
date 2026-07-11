"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag, unstable_cache } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import { puzzleSchema, firstIssue } from "@/lib/validation";
import { recomputeGoals } from "@/features/goals/actions";
import type { PuzzleRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Puzzles — server actions (Clerk + service-role)
// ─────────────────────────────────────────────────────────────

export interface CreatePuzzleInput {
  session_date:  string; // YYYY-MM-DD
  count:         number;
  accuracy?:     number | null;
  minutes?:      number | null;
  puzzle_rating?: number | null;
  notes?:        string | null;
}

export async function createPuzzle(input: CreatePuzzleInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const parsed = puzzleSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: firstIssue(parsed.error) };
  const v = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("puzzles")
      .insert({
        user_id:       userId,
        session_date:  v.session_date,
        count:         v.count,
        accuracy:      v.accuracy ?? null,
        minutes:       v.minutes ?? null,
        puzzle_rating: v.puzzle_rating ?? null,
        notes:         v.notes ?? null,
      })
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "puzzles"));
    recomputeGoals().catch((e) => console.error("recomputeGoals (puzzle):", e));
    return { success: true as const, data: data as unknown as PuzzleRow };
  } catch (err) {
    console.error("createPuzzle error:", err);
    return { success: false as const, error: "Could not save the session." };
  }
}

export async function getPuzzles(): Promise<PuzzleRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAdminClient();
  const fetcher = unstable_cache(
    async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from("puzzles")
          .select("*")
          .eq("user_id", uid)
          .order("session_date", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) {
          console.error("getPuzzles error:", error.message);
          return [];
        }
        return (data ?? []) as unknown as PuzzleRow[];
      } catch (err) {
        console.error("getPuzzles exception:", err);
        return [];
      }
    },
    ["puzzles", userId],
    { tags: [userTag(userId, "puzzles")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function deletePuzzle(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("puzzles")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "puzzles"));
    return { success: true as const };
  } catch (err) {
    console.error("deletePuzzle error:", err);
    return { success: false as const, error: "Could not delete the session." };
  }
}
