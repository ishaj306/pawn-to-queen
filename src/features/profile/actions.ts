"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import type { ProfileRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Profile updates — Clerk + service-role
// ─────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  full_name?:          string | null;
  username?:           string | null;
  target_rating?:      number;
  chess_com_username?: string | null;
  lichess_username?:   string | null;
  bio?:                string | null;
  notify_email?:       boolean;
  notify_push?:        boolean;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const fetcher = unstable_cache(
    async (uid: string) => {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      return (data ?? null) as ProfileRow | null;
    },
    ["profile", userId],
    { tags: [userTag(userId, "profile")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function updateProfile(input: UpdateProfileInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "profile"));
    revalidatePath("/", "layout");
    return { success: true as const, data: data as unknown as ProfileRow };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false as const, error: "Could not save profile." };
  }
}
