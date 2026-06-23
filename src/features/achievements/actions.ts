"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import type { AchievementRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Achievements — Clerk + service-role
//
//  Unlock logic lives in src/lib/achievements.ts so the page can
//  derive UNLOCKED badges from the live activity tables and the
//  unlockAchievement action just records the persistence.
// ─────────────────────────────────────────────────────────────

export async function getAchievements(): Promise<AchievementRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    console.error("getAchievements error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as AchievementRow[];
}

export async function unlockAchievement(key: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const supabase = createAdminClient();
  // unique (user_id, key) — collisions are ignored.
  const { error } = await supabase
    .from("achievements")
    .insert({ user_id: userId, key });

  if (error && !/duplicate|unique/i.test(error.message)) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function unlockMany(keys: string[]) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };
  if (keys.length === 0) return { success: true as const, unlocked: 0 };

  const supabase = createAdminClient();
  // Find the ones the user already has
  const { data: existing } = await supabase
    .from("achievements")
    .select("key")
    .eq("user_id", userId)
    .in("key", keys);
  const have = new Set(
    (existing ?? []).map((r) => (r as unknown as { key: string }).key),
  );
  const fresh = keys.filter((k) => !have.has(k));
  if (fresh.length === 0) return { success: true as const, unlocked: 0 };

  const rows = fresh.map((key) => ({ user_id: userId, key }));
  const { error } = await supabase.from("achievements").insert(rows);
  if (error) return { success: false as const, error: error.message };

  revalidatePath("/", "layout");
  return { success: true as const, unlocked: fresh.length };
}
