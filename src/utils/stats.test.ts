import { describe, it, expect } from "vitest";

import {
  calculateStreak,
  getNextMilestone,
  titleFor,
  nextTitle,
  TITLE_JOURNEY,
} from "./stats";
import type { RatingEntryRow } from "@/types/database";

// Build a local YYYY-MM-DD string N days before today, matching the
// local-timezone logic inside stats.ts so the streak tests are TZ-safe.
function localDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function entry(entry_date: string): RatingEntryRow {
  return {
    id: entry_date,
    user_id: "u1",
    rating: 1000,
    format: "Rapid",
    entry_date,
    notes: null,
    game_result: null,
    mistake_category: null,
    mindset: null,
    takeaway: null,
    is_starred: false,
    created_at: `${entry_date}T00:00:00Z`,
  };
}

describe("calculateStreak", () => {
  it("returns 0 for no entries", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("counts a run ending today", () => {
    const entries = [0, 1, 2].map((n) => entry(localDaysAgo(n)));
    expect(calculateStreak(entries)).toBe(3);
  });

  it("keeps the streak alive when the latest entry is yesterday", () => {
    const entries = [1, 2].map((n) => entry(localDaysAgo(n)));
    expect(calculateStreak(entries)).toBe(2);
  });

  it("breaks when neither today nor yesterday has an entry", () => {
    const entries = [3, 4, 5].map((n) => entry(localDaysAgo(n)));
    expect(calculateStreak(entries)).toBe(0);
  });

  it("deduplicates multiple entries on the same day", () => {
    const today = localDaysAgo(0);
    expect(calculateStreak([entry(today), entry(today)])).toBe(1);
  });

  it("stops at the first gap", () => {
    // today, yesterday, then a gap at day 2 — run is 2.
    const entries = [0, 1, 3, 4].map((n) => entry(localDaysAgo(n)));
    expect(calculateStreak(entries)).toBe(2);
  });
});

describe("getNextMilestone", () => {
  it.each([
    [850, 900],
    [900, 1000],
    [999, 1000],
    [1050, 1100],
    [1200, 1200],
    [1500, 1200],
  ])("maps %i → %i", (rating, expected) => {
    expect(getNextMilestone(rating)).toBe(expected);
  });
});

describe("titleFor / nextTitle", () => {
  it("returns Pawn at the bottom", () => {
    expect(titleFor(0).name).toBe("Pawn");
    expect(titleFor(499).name).toBe("Pawn");
  });

  it("crosses into higher bands at their thresholds", () => {
    expect(titleFor(500).name).toBe("Knight");
    expect(titleFor(1000).name).toBe("Bishop");
    expect(titleFor(2000).name).toBe("Rook");
    expect(titleFor(5000).name).toBe("Queen");
  });

  it("nextTitle points at the next band, null at the top", () => {
    expect(nextTitle(0)?.name).toBe("Knight");
    expect(nextTitle(1500)?.name).toBe("Rook");
    expect(nextTitle(5000)).toBeNull();
    expect(nextTitle(9000)).toBeNull();
  });

  it("journey is ordered by ascending threshold", () => {
    const thresholds = TITLE_JOURNEY.map((b) => b.threshold);
    expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds);
  });
});
