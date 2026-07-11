// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — SERVER-SIDE input validation.
//
//  The client modals validate with their own Zod schemas for UX,
//  but those run in the browser and are trivially bypassed. Every
//  server action is the real trust boundary, so it re-validates
//  here before touching Postgres. DB check-constraints are the last
//  line; these schemas give friendly errors and bound free text
//  (notes/titles) that the DB does not constrain.
// ─────────────────────────────────────────────────────────────

import * as z from "zod";

// A YYYY-MM-DD calendar date (matches our `date` columns).
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.");

// Enum literals — kept in sync with src/types/database.ts + DB checks.
const ratingFormat = z.enum(["Rapid", "Blitz", "Bullet", "Daily"]);
const gamePlatform = z.enum(["Chess.com", "Lichess", "OTB"]);
const gameResult = z.enum(["win", "loss", "draw"]);
const goalMetric = z.enum(["rating", "puzzles", "streak", "games", "study_minutes"]);
const journalKind = z.enum(["lesson", "mistake", "tournament", "thought", "daily"]);
const journalMood = z.enum(["focused", "tired", "excited", "frustrated", "calm", "curious"]);
const studyKind = z.enum(["video", "book", "opening", "endgame", "tactics", "game_review"]);

// Bounded optional free text — trims, coerces "" → undefined.
const shortText = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).optional().nullable();

// ─── rating_entries ──────────────────────────────────────────
export const ratingEntrySchema = z.object({
  rating: z.number().int("Whole numbers only.").min(100, "Rating must be at least 100.").max(3500, "That rating can't be right."),
  format: ratingFormat.optional(),
  entry_date: isoDate,
  notes: shortText(500),
  game_result: shortText(120),
  mistake_category: shortText(80),
  mindset: shortText(80),
  takeaway: shortText(500),
});

// ─── games ───────────────────────────────────────────────────
export const gameSchema = z.object({
  opponent: z.string().trim().min(1, "Opponent is required.").max(80, "Opponent name is too long."),
  played_at: isoDate,
  platform: gamePlatform,
  result: gameResult,
  opening: z.string().trim().min(1, "Opening is required.").max(120, "Opening name is too long."),
  format: ratingFormat,
  accuracy: z.number().min(0).max(100).optional().nullable(),
  time_control: shortText(40),
  blunders: z.number().int().min(0).max(1000).optional(),
  mistakes: z.number().int().min(0).max(1000).optional(),
  brilliant: z.number().int().min(0).max(1000).optional(),
  missed_wins: z.number().int().min(0).max(1000).optional(),
  notes: shortText(1000),
});

// ─── puzzles ─────────────────────────────────────────────────
export const puzzleSchema = z.object({
  session_date: isoDate,
  count: z.number().int("Whole numbers only.").min(1, "Log at least one puzzle.").max(10000, "That's a lot of puzzles."),
  accuracy: z.number().min(0).max(100).optional().nullable(),
  minutes: z.number().int().min(1).max(1440, "More than 24 hours?").optional().nullable(),
  puzzle_rating: z.number().int().min(100).max(4000).optional().nullable(),
  notes: shortText(1000),
});

// ─── goals ───────────────────────────────────────────────────
export const goalSchema = z.object({
  title: z.string().trim().min(1, "Give your goal a title.").max(120, "Title is too long."),
  metric: goalMetric,
  start_value: z.number().int().min(0).optional(),
  target_value: z.number().int("Whole numbers only.").positive("Target must be greater than zero.").max(1000000, "Target is unrealistically large."),
  due_date: isoDate.optional().nullable(),
});

// ─── journal ─────────────────────────────────────────────────
export const journalSchema = z.object({
  entry_date: isoDate,
  kind: journalKind,
  title: shortText(160),
  body: z.string().trim().min(1, "Write something first.").max(10000, "That entry is very long — split it up?"),
  mood: journalMood.optional().nullable(),
});

// ─── study_sessions ──────────────────────────────────────────
export const studySchema = z.object({
  entry_date: isoDate,
  kind: studyKind,
  minutes: z.number().int("Whole minutes only.").min(1, "Log at least a minute.").max(1440, "More than 24 hours?"),
  topic: shortText(120),
  notes: shortText(1000),
});

// ─── profiles ────────────────────────────────────────────────
export const profileSchema = z.object({
  full_name: shortText(80),
  primary_format: ratingFormat.optional(),
  username: z.string().trim().min(3, "At least 3 characters.").max(30, "At most 30 characters.").regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only.").optional().nullable(),
  target_rating: z.number().int().min(100).max(3500).optional(),
  chess_com_username: shortText(50),
  lichess_username: shortText(50),
  bio: shortText(500),
  notify_email: z.boolean().optional(),
  notify_push: z.boolean().optional(),
});

// ─── helper ──────────────────────────────────────────────────
// Turn a ZodError into the single friendliest message for our
// `{ success:false, error }` action return shape.
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
