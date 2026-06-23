"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
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

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("puzzles")
      .insert({
        user_id:       userId,
        session_date:  input.session_date,
        count:         input.count,
        accuracy:      input.accuracy ?? null,
        minutes:       input.minutes ?? null,
        puzzle_rating: input.puzzle_rating ?? null,
        notes:         input.notes ?? null,
      })
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    revalidatePath("/", "layout");
    return { success: true as const, data: data as unknown as PuzzleRow };
  } catch (err) {
    console.error("createPuzzle error:", err);
    return { success: false as const, error: "Could not save the session." };
  }
}

export async function getPuzzles(): Promise<PuzzleRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("puzzles")
      .select("*")
      .eq("user_id", userId)
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

    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (err) {
    console.error("deletePuzzle error:", err);
    return { success: false as const, error: "Could not delete the session." };
  }
}
