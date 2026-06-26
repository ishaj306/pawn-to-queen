"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import type { JournalRow, JournalKind, JournalMood } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Journal — Clerk + service-role
// ─────────────────────────────────────────────────────────────

export interface CreateJournalInput {
  entry_date: string; // YYYY-MM-DD
  kind:       JournalKind;
  title?:     string | null;
  body:       string;
  mood?:      JournalMood | null;
}

export async function createJournalEntry(input: CreateJournalInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("journal")
      .insert({
        user_id:    userId,
        entry_date: input.entry_date,
        kind:       input.kind,
        title:      input.title ?? null,
        body:       input.body,
        mood:       input.mood ?? null,
      })
      .select()
      .single();
    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "journal"));
    revalidatePath("/", "layout");
    return { success: true as const, data: data as unknown as JournalRow };
  } catch (err) {
    console.error("createJournalEntry error:", err);
    return { success: false as const, error: "Could not save entry." };
  }
}

export async function getJournalEntries(): Promise<JournalRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const fetcher = unstable_cache(
    async (uid: string) => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("journal")
        .select("*")
        .eq("user_id", uid)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) {
        console.error("getJournalEntries error:", error.message);
        return [];
      }
      return (data ?? []) as unknown as JournalRow[];
    },
    ["journal", userId],
    { tags: [userTag(userId, "journal")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function deleteJournalEntry(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("journal")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { success: false as const, error: error.message };

  updateTag(userTag(userId, "journal"));
  revalidatePath("/", "layout");
  return { success: true as const };
}
