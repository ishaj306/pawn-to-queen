// ────────────────────────────────────────────────────────────────
//  Pawn to Queen — hand-typed database schema (matches Supabase).
//  Source of truth: supabase/migrations/0001_initial_schema.sql
//  Swap for `supabase gen types typescript` output once the CLI is wired.
// ────────────────────────────────────────────────────────────────

// ─── Shared union types ─────────────────────────────────────────

export type RatingFormat = "Rapid" | "Blitz" | "Bullet" | "Daily";
export type GameResult   = "win" | "loss" | "draw";
export type GamePlatform = "Chess.com" | "Lichess" | "OTB";
export type GoalMetric   = "rating" | "puzzles" | "streak" | "games" | "study_minutes";
export type JournalKind  = "lesson" | "mistake" | "tournament" | "thought" | "daily";
export type JournalMood  = "focused" | "tired" | "excited" | "frustrated" | "calm" | "curious";
export type StudyKind    = "video" | "book" | "opening" | "endgame" | "tactics" | "game_review";

// ─── profiles ───────────────────────────────────────────────────

export interface ProfileRow {
  user_id:              string;
  full_name:            string | null;
  username:             string | null;
  current_rating:       number;
  peak_rating:          number;
  target_rating:        number;
  chess_com_username:   string | null;
  lichess_username:     string | null;
  bio:                  string | null;
  avatar_url:           string | null;
  notify_email:         boolean;
  notify_push:          boolean;
  created_at:           string;
  updated_at:           string;
}
export type ProfileInsert = Partial<ProfileRow> & Pick<ProfileRow, "user_id">;
export type ProfileUpdate = Partial<Omit<ProfileRow, "user_id" | "created_at">>;

// ─── rating_entries ─────────────────────────────────────────────

export interface RatingEntryRow {
  id:                string;
  user_id:           string;
  rating:            number;
  format:            RatingFormat;
  entry_date:        string;       // YYYY-MM-DD
  notes:             string | null;
  game_result:       string | null;
  mistake_category:  string | null;
  mindset:           string | null;
  takeaway:          string | null;
  is_starred:        boolean;
  created_at:        string;
}
export type RatingEntryInsert =
  Omit<RatingEntryRow, "id" | "created_at" | "is_starred"> &
  Partial<Pick<RatingEntryRow, "is_starred">>;
export type RatingEntryUpdate = Partial<Omit<RatingEntryRow, "id" | "user_id" | "created_at">>;

// ─── games ──────────────────────────────────────────────────────

export interface GameRow {
  id:            string;
  user_id:       string;
  opponent:      string;
  played_at:     string;        // YYYY-MM-DD
  platform:      GamePlatform;
  result:        GameResult;
  opening:       string;
  accuracy:      number | null;
  time_control:  string | null;
  format:        RatingFormat;
  blunders:      number;
  mistakes:      number;
  brilliant:     number;
  missed_wins:   number;
  notes:         string | null;
  created_at:    string;
}
export type GameInsert =
  Omit<GameRow, "id" | "created_at" | "blunders" | "mistakes" | "brilliant" | "missed_wins"> &
  Partial<Pick<GameRow, "blunders" | "mistakes" | "brilliant" | "missed_wins">>;
export type GameUpdate = Partial<Omit<GameRow, "id" | "user_id" | "created_at">>;

// ─── puzzles ────────────────────────────────────────────────────

export interface PuzzleRow {
  id:             string;
  user_id:        string;
  session_date:   string;        // YYYY-MM-DD
  count:          number;
  accuracy:       number | null;
  minutes:        number | null;
  puzzle_rating:  number | null;
  notes:          string | null;
  created_at:     string;
}
export type PuzzleInsert = Omit<PuzzleRow, "id" | "created_at">;
export type PuzzleUpdate = Partial<Omit<PuzzleRow, "id" | "user_id" | "created_at">>;

// ─── goals ──────────────────────────────────────────────────────

export interface GoalRow {
  id:             string;
  user_id:        string;
  title:          string;
  metric:         GoalMetric;
  start_value:    number;
  current_value:  number;
  target_value:   number;
  due_date:       string | null;
  completed_at:   string | null;
  created_at:     string;
}
export type GoalInsert =
  Omit<GoalRow, "id" | "created_at" | "current_value" | "completed_at"> &
  Partial<Pick<GoalRow, "current_value" | "completed_at">>;
export type GoalUpdate = Partial<Omit<GoalRow, "id" | "user_id" | "created_at">>;

// ─── journal ────────────────────────────────────────────────────

export interface JournalRow {
  id:          string;
  user_id:     string;
  entry_date:  string;          // YYYY-MM-DD
  kind:        JournalKind;
  title:       string | null;
  body:        string;
  mood:        JournalMood | null;
  created_at:  string;
}
export type JournalInsert = Omit<JournalRow, "id" | "created_at">;
export type JournalUpdate = Partial<Omit<JournalRow, "id" | "user_id" | "created_at">>;

// ─── study_sessions ─────────────────────────────────────────────

export interface StudySessionRow {
  id:          string;
  user_id:     string;
  entry_date:  string;          // YYYY-MM-DD
  kind:        StudyKind;
  minutes:     number;
  topic:       string | null;
  notes:       string | null;
  created_at:  string;
}
export type StudySessionInsert = Omit<StudySessionRow, "id" | "created_at">;
export type StudySessionUpdate = Partial<Omit<StudySessionRow, "id" | "user_id" | "created_at">>;

// ─── achievements ───────────────────────────────────────────────

export interface AchievementRow {
  id:           string;
  user_id:      string;
  key:          string;
  unlocked_at:  string;
}
export type AchievementInsert = Omit<AchievementRow, "id" | "unlocked_at"> &
  Partial<Pick<AchievementRow, "unlocked_at">>;

// ─── Convenience: discriminated union for activity-feed aggregation ──

export type ActivityRow =
  | { kind: "rating";   row: RatingEntryRow }
  | { kind: "game";     row: GameRow }
  | { kind: "puzzle";   row: PuzzleRow }
  | { kind: "journal";  row: JournalRow }
  | { kind: "study";    row: StudySessionRow };
