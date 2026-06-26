"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import { recomputeGoals } from "@/features/goals/actions";
import type { StudySessionRow, StudyKind } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Study sessions — Clerk + service-role
// ─────────────────────────────────────────────────────────────

export interface CreateStudyInput {
  entry_date: string; // YYYY-MM-DD
  kind:       StudyKind;
  minutes:    number;
  topic?:     string | null;
  notes?:     string | null;
}

export async function createStudySession(input: CreateStudyInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id:    userId,
        entry_date: input.entry_date,
        kind:       input.kind,
        minutes:    input.minutes,
        topic:      input.topic ?? null,
        notes:      input.notes ?? null,
      })
      .select()
      .single();
    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "study"));
    recomputeGoals().catch((e) => console.error("recomputeGoals (study):", e));
    revalidatePath("/", "layout");
    return { success: true as const, data: data as unknown as StudySessionRow };
  } catch (err) {
    console.error("createStudySession error:", err);
    return { success: false as const, error: "Could not save study session." };
  }
}

export async function getStudySessions(): Promise<StudySessionRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const fetcher = unstable_cache(
    async (uid: string) => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", uid)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) {
        console.error("getStudySessions error:", error.message);
        return [];
      }
      return (data ?? []) as unknown as StudySessionRow[];
    },
    ["study_sessions", userId],
    { tags: [userTag(userId, "study")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function deleteStudySession(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("study_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { success: false as const, error: error.message };

  updateTag(userTag(userId, "study"));
  revalidatePath("/", "layout");
  return { success: true as const };
}
