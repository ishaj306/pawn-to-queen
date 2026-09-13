import { describe, it, expect } from "vitest";

import {
  gameSchema,
  ratingEntrySchema,
  puzzleSchema,
  goalSchema,
  firstIssue,
} from "./validation";

const validGame = {
  opponent: "Magnus",
  played_at: "2026-01-15",
  platform: "Chess.com" as const,
  result: "win" as const,
  opening: "Sicilian Defense",
  format: "Rapid" as const,
};

describe("gameSchema", () => {
  it("accepts a minimal valid game", () => {
    expect(gameSchema.safeParse(validGame).success).toBe(true);
  });

  it("rejects an empty opponent", () => {
    const r = gameSchema.safeParse({ ...validGame, opponent: "  " });
    expect(r.success).toBe(false);
  });

  it("rejects an out-of-range accuracy", () => {
    expect(gameSchema.safeParse({ ...validGame, accuracy: 150 }).success).toBe(false);
    expect(gameSchema.safeParse({ ...validGame, accuracy: -1 }).success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(gameSchema.safeParse({ ...validGame, played_at: "15/01/2026" }).success).toBe(false);
  });

  it("rejects an unknown platform or result", () => {
    expect(gameSchema.safeParse({ ...validGame, platform: "OverTheBoard" }).success).toBe(false);
    expect(gameSchema.safeParse({ ...validGame, result: "victory" }).success).toBe(false);
  });

  it("trims whitespace off text fields", () => {
    const r = gameSchema.safeParse({ ...validGame, opponent: "  Hikaru  " });
    expect(r.success && r.data.opponent).toBe("Hikaru");
  });
});

describe("ratingEntrySchema", () => {
  it("enforces the rating bounds", () => {
    const base = { entry_date: "2026-01-15" };
    expect(ratingEntrySchema.safeParse({ ...base, rating: 99 }).success).toBe(false);
    expect(ratingEntrySchema.safeParse({ ...base, rating: 3501 }).success).toBe(false);
    expect(ratingEntrySchema.safeParse({ ...base, rating: 1200 }).success).toBe(true);
  });

  it("rejects a non-integer rating", () => {
    expect(
      ratingEntrySchema.safeParse({ entry_date: "2026-01-15", rating: 1200.5 }).success,
    ).toBe(false);
  });
});

describe("puzzleSchema", () => {
  it("requires at least one puzzle", () => {
    expect(puzzleSchema.safeParse({ session_date: "2026-01-15", count: 0 }).success).toBe(false);
    expect(puzzleSchema.safeParse({ session_date: "2026-01-15", count: 20 }).success).toBe(true);
  });
});

describe("goalSchema", () => {
  it("requires a positive target", () => {
    const base = { title: "Reach 1500", metric: "rating" as const };
    expect(goalSchema.safeParse({ ...base, target_value: 0 }).success).toBe(false);
    expect(goalSchema.safeParse({ ...base, target_value: 1500 }).success).toBe(true);
  });
});

describe("firstIssue", () => {
  it("surfaces the first validation message", () => {
    const r = gameSchema.safeParse({ ...validGame, opponent: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(firstIssue(r.error)).toMatch(/opponent/i);
    }
  });
});
