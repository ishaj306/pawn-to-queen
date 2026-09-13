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

// Per-format current/peak snapshot, stored in profiles.format_ratings.
export type FormatRatings = Partial<
  Record<RatingFormat, { current: number; peak: number }>
>;

// ─── Insert-shape helper ────────────────────────────────────────
//  Derives a table's Insert type from its Row, mirroring how
//  `supabase gen types` treats columns:
//   - `Generated` columns (id, created_at, …) are dropped entirely.
//   - `Defaulted` columns (DB DEFAULT, e.g. counters) are optional.
//   - Any nullable column (`… | null`) is optional.
//   - Everything else is required.

type NullableKeys<T> = {
  [K in keyof T]-?: null extends T[K] ? K : never;
}[keyof T];

type Insertable<
  Row,
  Generated extends keyof Row = never,
  Defaulted extends keyof Row = never,
> = Omit<Row, Generated | Defaulted | NullableKeys<Row>> &
  Partial<Pick<Row, Exclude<Defaulted | NullableKeys<Row>, Generated>>>;

// ─── profiles ───────────────────────────────────────────────────

export type ProfileRow = {
  user_id:              string;
  full_name:            string | null;
  username:             string | null;
  current_rating:       number;
  peak_rating:          number;
  target_rating:        number;
  primary_format:       RatingFormat;
  format_ratings:       FormatRatings;
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

export type RatingEntryRow = {
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
  Insertable<RatingEntryRow, "id" | "created_at", "is_starred">;
export type RatingEntryUpdate = Partial<Omit<RatingEntryRow, "id" | "user_id" | "created_at">>;

// ─── games ──────────────────────────────────────────────────────

export type GameRow = {
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
  source:        string | null;       // 'chess.com' | 'lichess' | null (manual)
  external_id:   string | null;       // platform game id/url, for dedup
  created_at:    string;
}
export type GameInsert =
  Insertable<GameRow, "id" | "created_at", "blunders" | "mistakes" | "brilliant" | "missed_wins">;
export type GameUpdate = Partial<Omit<GameRow, "id" | "user_id" | "created_at">>;

// ─── puzzles ────────────────────────────────────────────────────

export type PuzzleRow = {
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
export type PuzzleInsert = Insertable<PuzzleRow, "id" | "created_at">;
export type PuzzleUpdate = Partial<Omit<PuzzleRow, "id" | "user_id" | "created_at">>;

// ─── goals ──────────────────────────────────────────────────────

export type GoalRow = {
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
  Insertable<GoalRow, "id" | "created_at", "current_value">;
export type GoalUpdate = Partial<Omit<GoalRow, "id" | "user_id" | "created_at">>;

// ─── journal ────────────────────────────────────────────────────

export type JournalRow = {
  id:          string;
  user_id:     string;
  entry_date:  string;          // YYYY-MM-DD
  kind:        JournalKind;
  title:       string | null;
  body:        string;
  mood:        JournalMood | null;
  created_at:  string;
}
export type JournalInsert = Insertable<JournalRow, "id" | "created_at">;
export type JournalUpdate = Partial<Omit<JournalRow, "id" | "user_id" | "created_at">>;

// ─── study_sessions ─────────────────────────────────────────────

export type StudySessionRow = {
  id:          string;
  user_id:     string;
  entry_date:  string;          // YYYY-MM-DD
  kind:        StudyKind;
  minutes:     number;
  topic:       string | null;
  notes:       string | null;
  created_at:  string;
}
export type StudySessionInsert = Insertable<StudySessionRow, "id" | "created_at">;
export type StudySessionUpdate = Partial<Omit<StudySessionRow, "id" | "user_id" | "created_at">>;

// ─── achievements ───────────────────────────────────────────────

export type AchievementRow = {
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

// ─── Database wrapper — shape Supabase expects from createClient<T> ─────
// Matches the structure `supabase gen types typescript` outputs. The
// `[_ in never]: never` pattern is how the generator declares "no rows
// in this section" — needed because Supabase's GenericSchema constraint
// requires Views/Functions to exist on the schema.

export type Database = {
  public: {
    Tables: {
      profiles:        { Row: ProfileRow;        Insert: ProfileInsert;        Update: ProfileUpdate;        Relationships: [] };
      rating_entries:  { Row: RatingEntryRow;    Insert: RatingEntryInsert;    Update: RatingEntryUpdate;    Relationships: [] };
      games:           { Row: GameRow;           Insert: GameInsert;           Update: GameUpdate;           Relationships: [] };
      puzzles:         { Row: PuzzleRow;         Insert: PuzzleInsert;         Update: PuzzleUpdate;         Relationships: [] };
      goals:           { Row: GoalRow;           Insert: GoalInsert;           Update: GoalUpdate;           Relationships: [] };
      journal:         { Row: JournalRow;        Insert: JournalInsert;        Update: JournalUpdate;        Relationships: [] };
      study_sessions:  { Row: StudySessionRow;   Insert: StudySessionInsert;   Update: StudySessionUpdate;   Relationships: [] };
      achievements:    { Row: AchievementRow;    Insert: AchievementInsert;    Update: Partial<AchievementRow>; Relationships: [] };
    };
    Views: { [_ in never]: never };
    Functions: {
      // Declared in supabase/migrations/0004_daily_aggregates.sql.
      get_user_daily_aggregates: {
        Args: { p_user_id: string; p_start_date: string; p_end_date: string };
        Returns: {
          day:           string;
          games_count:   number;
          puzzles_count: number;
          study_minutes: number;
          journal_count: number;
          last_rating:   number | null;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
