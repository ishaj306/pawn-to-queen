"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag, unstable_cache } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import { goalSchema, firstIssue } from "@/lib/validation";
import type { GoalRow, GoalMetric } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Goals — Clerk + service-role
// ─────────────────────────────────────────────────────────────

export interface CreateGoalInput {
  title:         string;
  metric:        GoalMetric;
  start_value?:  number;
  target_value:  number;
  due_date?:     string | null;
}

export async function createGoal(input: CreateGoalInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: firstIssue(parsed.error) };
  const v = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id:       userId,
        title:         v.title,
        metric:        v.metric,
        start_value:   v.start_value ?? 0,
        current_value: v.start_value ?? 0,
        target_value:  v.target_value,
        due_date:      v.due_date ?? null,
      })
      .select()
      .single();
    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "goals"));
    return { success: true as const, data: data as unknown as GoalRow };
  } catch (err) {
    console.error("createGoal error:", err);
    return { success: false as const, error: "Could not create goal." };
  }
}

export async function getGoals(): Promise<GoalRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAdminClient();
  const fetcher = unstable_cache(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", uid)
        .order("completed_at", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: false });
      if (error) {
        console.error("getGoals error:", error.message);
        return [];
      }
      return (data ?? []) as unknown as GoalRow[];
    },
    ["goals", userId],
    { tags: [userTag(userId, "goals")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function updateGoalProgress(id: string, current_value: number) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const supabase = createAdminClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (!goal) return { success: false as const, error: "Goal not found." };

  const goalRow = goal as unknown as GoalRow;
  const completed_at =
    current_value >= goalRow.target_value && !goalRow.completed_at
      ? new Date().toISOString()
      : goalRow.completed_at;

  const { error } = await supabase
    .from("goals")
    .update({ current_value, completed_at })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { success: false as const, error: error.message };

  updateTag(userTag(userId, "goals"));
  return { success: true as const };
}

export async function deleteGoal(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { success: false as const, error: error.message };

  updateTag(userTag(userId, "goals"));
  return { success: true as const };
}

// Recompute progress on every goal by querying the underlying activity
// tables. Cheap enough to call after every relevant insert.
export async function recomputeGoals() {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const supabase = createAdminClient();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .is("completed_at", null);
  if (!goals || goals.length === 0) {
    return { success: true as const, updated: 0 };
  }

  // Latest rating
  const { data: latestRating } = await supabase
    .from("rating_entries")
    .select("rating, entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Puzzles total
  const { data: puzzleAgg } = await supabase
    .from("puzzles")
    .select("count")
    .eq("user_id", userId);

  // Games total
  const { data: gamesAgg } = await supabase
    .from("games")
    .select("id")
    .eq("user_id", userId);

  // Study minutes total
  const { data: studyAgg } = await supabase
    .from("study_sessions")
    .select("minutes")
    .eq("user_id", userId);

  const puzzleTotal =
    (puzzleAgg ?? []).reduce(
      (a, r) => a + ((r as unknown as { count: number }).count ?? 0),
      0,
    ) ?? 0;
  const gamesTotal = gamesAgg?.length ?? 0;
  const studyTotal =
    (studyAgg ?? []).reduce(
      (a, r) => a + ((r as unknown as { minutes: number }).minutes ?? 0),
      0,
    ) ?? 0;
  const currentRating =
    (latestRating as unknown as { rating?: number } | null)?.rating ?? null;

  let updated = 0;
  for (const g of goals as unknown as GoalRow[]) {
    let next = g.current_value;
    if (g.metric === "rating" && currentRating !== null) next = currentRating;
    else if (g.metric === "puzzles") next = puzzleTotal;
    else if (g.metric === "games") next = gamesTotal;
    else if (g.metric === "study_minutes") next = studyTotal;
    // 'streak' goals are computed on the page

    if (next !== g.current_value) {
      const completed_at =
        next >= g.target_value ? new Date().toISOString() : null;
      await supabase
        .from("goals")
        .update({ current_value: next, completed_at })
        .eq("id", g.id)
        .eq("user_id", userId);
      updated++;
    }
  }

  if (updated > 0) {
    updateTag(userTag(userId, "goals"));
  }
  return { success: true as const, updated };
}
