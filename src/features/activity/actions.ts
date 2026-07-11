"use server";

import { auth } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";

// ─────────────────────────────────────────────────────────────────
//  Activity aggregates — replaces "fetch all rows, aggregate in JS"
//  for the Calendar + Stats pages. Backed by the SQL function
//  get_user_daily_aggregates declared in migration 0004.
// ─────────────────────────────────────────────────────────────────

export interface DailyAggregate {
  day:           string; // YYYY-MM-DD
  games_count:   number;
  puzzles_count: number;
  study_minutes: number;
  journal_count: number;
  last_rating:   number | null;
}

export async function getDailyAggregates(
  startDate: string,
  endDate: string,
): Promise<DailyAggregate[]> {
  const { userId } = await auth();
  if (!userId) return [];

  // We tag by every resource the function touches. ANY write to those
  // tables busts this aggregate cache. Cache key includes the date
  // window so a year query and a week query don't share state.
  const supabase = createAdminClient();
  const fetcher = unstable_cache(
    async (uid: string, s: string, e: string) => {
      const { data, error } = await supabase.rpc("get_user_daily_aggregates", {
        p_user_id:    uid,
        p_start_date: s,
        p_end_date:   e,
      });
      if (error) {
        console.error("getDailyAggregates error:", error.message);
        return [];
      }
      return (data ?? []) as DailyAggregate[];
    },
    ["daily_aggregates", userId, startDate, endDate],
    {
      tags: [
        userTag(userId, "games"),
        userTag(userId, "puzzles"),
        userTag(userId, "study"),
        userTag(userId, "journal"),
        userTag(userId, "ratings"),
      ],
      revalidate: 60,
    },
  );
  return fetcher(userId, startDate, endDate);
}
