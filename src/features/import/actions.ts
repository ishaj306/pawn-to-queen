"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import { recomputeGoals } from "@/features/goals/actions";
import { recomputeFormatRatings } from "@/features/ratings/actions";
import type { RatingFormat, GameResult } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Chess.com + Lichess import — on-demand sync.
//
//  Reads the usernames saved on the profile, pulls recent games and
//  current ratings from each platform's PUBLIC API (no keys required),
//  and upserts them. A partial unique index (user_id, source,
//  external_id) makes re-syncing idempotent — already-imported games
//  are skipped, manually-logged games are untouched.
//
//  All fetching happens server-side, so there are no CORS issues and
//  no secrets in the browser.
// ─────────────────────────────────────────────────────────────

const MAX_GAMES_PER_SOURCE = 50;

// Chess.com blocks requests without a descriptive User-Agent.
const CHESS_HEADERS = {
  "User-Agent": "PawnToQueen/1.0 (chess growth journal; +https://pawn-to-queen.vercel.app)",
  Accept: "application/json",
};

interface ImportedGame {
  external_id: string;
  source: "chess.com" | "lichess";
  opponent: string;
  played_at: string; // YYYY-MM-DD
  platform: "Chess.com" | "Lichess";
  result: GameResult;
  opening: string;
  accuracy: number | null;
  time_control: string | null;
  format: RatingFormat;
}

interface SourceResult {
  games: ImportedGame[];
  ratings: Partial<Record<RatingFormat, number>>;
  puzzle?: { rating?: number; count?: number };
  error?: string;
}

export interface SyncSummary {
  success: boolean;
  ranAny: boolean;
  chesscom: { newGames: number; error?: string } | null;
  lichess: { newGames: number; error?: string } | null;
  ratingsLogged: number;
  puzzlesLogged: number;
  error?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const today = () => ymd(Date.now());

function pgnTag(pgn: string | undefined, tag: string): string | null {
  if (!pgn) return null;
  const m = pgn.match(new RegExp(`\\[${tag}\\s+"([^"]*)"\\]`));
  return m ? m[1] : null;
}

// Human-readable opening name from a Chess.com ECOUrl slug.
function openingFromEcoUrl(url: string | null): string | null {
  if (!url) return null;
  const slug = url.split("/").pop() ?? "";
  const name = decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\d+(\.\.\.)?.*$/, "") // drop trailing move notation
    .trim();
  return name || null;
}

const CHESS_DRAW = new Set([
  "agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient",
]);

function chessResult(sideResult: string): GameResult {
  if (sideResult === "win") return "win";
  if (CHESS_DRAW.has(sideResult)) return "draw";
  return "loss";
}

function chessFormat(timeClass: string): RatingFormat | null {
  switch (timeClass) {
    case "rapid":  return "Rapid";
    case "blitz":  return "Blitz";
    case "bullet": return "Bullet";
    case "daily":  return "Daily";
    default:       return null;
  }
}

// ─── Chess.com ───────────────────────────────────────────────
async function fetchChessCom(username: string): Promise<SourceResult> {
  const u = username.trim().toLowerCase();
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(u)}`;
  const ratings: Partial<Record<RatingFormat, number>> = {};
  let puzzle: { rating?: number; count?: number } | undefined;

  try {
    const statsRes = await fetch(`${base}/stats`, { headers: CHESS_HEADERS, cache: "no-store" });
    if (statsRes.status === 404) return { games: [], ratings, error: `Chess.com user "${username}" not found.` };
    if (statsRes.ok) {
      const s = await statsRes.json();
      const r = (k: string) => s?.[k]?.last?.rating as number | undefined;
      if (r("chess_rapid"))  ratings.Rapid  = r("chess_rapid");
      if (r("chess_blitz"))  ratings.Blitz  = r("chess_blitz");
      if (r("chess_bullet")) ratings.Bullet = r("chess_bullet");
      if (r("chess_daily"))  ratings.Daily  = r("chess_daily");
      const tacticsRating = s?.tactics?.highest?.rating as number | undefined;
      if (tacticsRating) puzzle = { rating: tacticsRating };
    }

    // Pull the two most recent monthly archives (covers month boundaries).
    const archRes = await fetch(`${base}/games/archives`, { headers: CHESS_HEADERS, cache: "no-store" });
    if (!archRes.ok) return { games: [], ratings, error: "Chess.com is unavailable right now." };
    const archives: string[] = (await archRes.json())?.archives ?? [];

    const raw: Record<string, unknown>[] = [];
    for (const url of archives.slice(-2)) {
      const res = await fetch(url, { headers: CHESS_HEADERS, cache: "no-store" });
      if (res.ok) raw.push(...(((await res.json())?.games ?? []) as Record<string, unknown>[]));
    }

    const games: ImportedGame[] = [];
    for (const g of raw) {
      if (g.rules !== "chess") continue;
      const format = chessFormat(String(g.time_class));
      if (!format) continue;

      const white = g.white as { username: string; result: string; accuracy?: number } | undefined;
      const black = g.black as { username: string; result: string; accuracy?: number } | undefined;
      if (!white || !black) continue;
      const mineWhite = white.username?.toLowerCase() === u;
      const me = mineWhite ? white : black;
      const opp = mineWhite ? black : white;

      const accuracies = g.accuracies as { white?: number; black?: number } | undefined;
      const accuracy = mineWhite ? accuracies?.white : accuracies?.black;
      const pgn = g.pgn as string | undefined;

      games.push({
        external_id: String(g.url ?? g.uuid ?? `${me.username}-${g.end_time}`),
        source: "chess.com",
        opponent: opp.username ?? "Unknown",
        played_at: g.end_time ? ymd(Number(g.end_time) * 1000) : today(),
        platform: "Chess.com",
        result: chessResult(me.result),
        opening:
          openingFromEcoUrl(pgnTag(pgn, "ECOUrl")) ??
          pgnTag(pgn, "Opening") ??
          pgnTag(pgn, "ECO") ??
          "Unknown",
        accuracy: typeof accuracy === "number" ? Math.round(accuracy) : null,
        time_control: (g.time_control as string) ?? null,
        format,
      });
    }

    games.sort((a, b) => (a.played_at < b.played_at ? 1 : -1));
    return { games: games.slice(0, MAX_GAMES_PER_SOURCE), ratings, puzzle };
  } catch (err) {
    console.error("fetchChessCom error:", err);
    return { games: [], ratings, error: "Could not reach Chess.com." };
  }
}

// ─── Lichess ─────────────────────────────────────────────────
function lichessFormat(speed: string): RatingFormat | null {
  switch (speed) {
    case "bullet":         return "Bullet";
    case "blitz":          return "Blitz";
    case "rapid":          return "Rapid";
    case "classical":      return "Rapid";
    case "correspondence": return "Daily";
    default:               return null;
  }
}

async function fetchLichess(username: string): Promise<SourceResult> {
  const u = username.trim();
  const ratings: Partial<Record<RatingFormat, number>> = {};
  let puzzle: { rating?: number; count?: number } | undefined;

  try {
    const userRes = await fetch(`https://lichess.org/api/user/${encodeURIComponent(u)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (userRes.status === 404) return { games: [], ratings, error: `Lichess user "${username}" not found.` };
    if (userRes.ok) {
      const perfs = (await userRes.json())?.perfs ?? {};
      const r = (k: string) => perfs?.[k]?.rating as number | undefined;
      if (r("bullet"))         ratings.Bullet = r("bullet");
      if (r("blitz"))          ratings.Blitz  = r("blitz");
      if (r("rapid"))          ratings.Rapid  = r("rapid");
      if (r("correspondence")) ratings.Daily  = r("correspondence");
      if (!ratings.Rapid && r("classical")) ratings.Rapid = r("classical");
      const pRating = perfs?.puzzle?.rating as number | undefined;
      const pCount = perfs?.puzzle?.games as number | undefined;
      if (pRating || pCount) puzzle = { rating: pRating, count: pCount };
    }

    const gamesRes = await fetch(
      `https://lichess.org/api/games/user/${encodeURIComponent(u)}?max=${MAX_GAMES_PER_SOURCE}&opening=true&sort=dateDesc`,
      { headers: { Accept: "application/x-ndjson" }, cache: "no-store" },
    );
    if (!gamesRes.ok) return { games: [], ratings, error: "Lichess is unavailable right now." };

    const text = await gamesRes.text();
    const lines = text.split("\n").filter((l) => l.trim());
    const lower = u.toLowerCase();
    const games: ImportedGame[] = [];

    for (const line of lines) {
      let g: Record<string, unknown>;
      try { g = JSON.parse(line); } catch { continue; }
      if (g.variant && g.variant !== "standard") continue;
      const format = lichessFormat(String(g.speed));
      if (!format) continue;

      const players = g.players as {
        white?: { user?: { name?: string }; rating?: number };
        black?: { user?: { name?: string }; rating?: number };
      };
      const whiteName = players?.white?.user?.name?.toLowerCase();
      const mineWhite = whiteName === lower;
      const oppName = mineWhite ? players?.black?.user?.name : players?.white?.user?.name;

      const winner = g.winner as "white" | "black" | undefined;
      const mySide = mineWhite ? "white" : "black";
      const result: GameResult = !winner ? "draw" : winner === mySide ? "win" : "loss";

      const opening = g.opening as { name?: string } | undefined;
      const clock = g.clock as { initial?: number; increment?: number } | undefined;

      games.push({
        external_id: String(g.id),
        source: "lichess",
        opponent: oppName ?? "Anonymous",
        played_at: g.createdAt ? ymd(Number(g.createdAt)) : today(),
        platform: "Lichess",
        result,
        opening: opening?.name ?? "Unknown",
        accuracy: null, // lichess accuracy needs a separate authed request
        time_control: clock?.initial != null ? `${clock.initial}+${clock.increment ?? 0}` : null,
        format,
      });
    }

    return { games, ratings, puzzle };
  } catch (err) {
    console.error("fetchLichess error:", err);
    return { games: [], ratings, error: "Could not reach Lichess." };
  }
}

// ─── Orchestrator ────────────────────────────────────────────
export async function syncExternalGames(): Promise<SyncSummary> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, ranAny: false, chesscom: null, lichess: null, ratingsLogged: 0, puzzlesLogged: 0, error: "Not signed in." };
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("chess_com_username, lichess_username")
    .eq("user_id", userId)
    .maybeSingle();

  const ccUser = (profile?.chess_com_username as string | null)?.trim() || null;
  const liUser = (profile?.lichess_username as string | null)?.trim() || null;

  if (!ccUser && !liUser) {
    return {
      success: false,
      ranAny: false,
      chesscom: null,
      lichess: null,
      ratingsLogged: 0,
      puzzlesLogged: 0,
      error: "Add your Chess.com or Lichess username in Settings first.",
    };
  }

  const [cc, li] = await Promise.all([
    ccUser ? fetchChessCom(ccUser) : Promise.resolve(null),
    liUser ? fetchLichess(liUser) : Promise.resolve(null),
  ]);

  // Insert games, de-duplicated in app code: fetch the external ids we
  // already have and insert only the new ones. This avoids relying on an
  // ON CONFLICT arbiter, so it works as long as migration 0007 added the
  // source / external_id columns.
  const allGames = [...(cc?.games ?? []), ...(li?.games ?? [])];
  let ccNew = 0;
  let liNew = 0;
  if (allGames.length > 0) {
    const { data: existing, error: exErr } = await supabase
      .from("games")
      .select("external_id")
      .eq("user_id", userId)
      .not("external_id", "is", null);
    if (exErr) {
      console.error("import dedup read error:", exErr.message);
      return {
        success: false, ranAny: true, chesscom: null, lichess: null,
        ratingsLogged: 0, puzzlesLogged: 0,
        error: `Games table isn't ready (${exErr.message}). Apply Supabase migration 0007 and try again.`,
      };
    }
    const have = new Set((existing ?? []).map((r) => (r as { external_id: string }).external_id));
    const fresh = allGames.filter((g) => !have.has(g.external_id));
    if (fresh.length > 0) {
      const rows = fresh.map((g) => ({
        user_id: userId,
        opponent: g.opponent,
        played_at: g.played_at,
        platform: g.platform,
        result: g.result,
        opening: g.opening,
        accuracy: g.accuracy,
        time_control: g.time_control,
        format: g.format,
        source: g.source,
        external_id: g.external_id,
      }));
      const { data: inserted, error } = await supabase.from("games").insert(rows).select("source");
      if (error) {
        console.error("import insert error:", error.message);
        return {
          success: false, ranAny: true, chesscom: null, lichess: null,
          ratingsLogged: 0, puzzlesLogged: 0, error: error.message,
        };
      }
      const insertedRows = (inserted ?? []) as { source: string }[];
      ccNew = insertedRows.filter((r) => r.source === "chess.com").length;
      liNew = insertedRows.filter((r) => r.source === "lichess").length;
    }
  }

  // Log one rating snapshot per format for today (chess.com takes priority),
  // skipping formats already recorded today so re-syncing doesn't spam.
  const merged: Partial<Record<RatingFormat, number>> = { ...(li?.ratings ?? {}), ...(cc?.ratings ?? {}) };
  let ratingsLogged = 0;
  const formats = Object.keys(merged) as RatingFormat[];
  if (formats.length > 0) {
    const { data: todays } = await supabase
      .from("rating_entries")
      .select("format")
      .eq("user_id", userId)
      .eq("entry_date", today());
    const already = new Set((todays ?? []).map((r) => (r as { format: string }).format));
    const source = ccUser ? "Chess.com" : "Lichess";
    const ratingRows = formats
      .filter((f) => !already.has(f) && typeof merged[f] === "number")
      .map((f) => ({
        user_id: userId,
        rating: merged[f]!,
        format: f,
        entry_date: today(),
        notes: `Imported from ${source}`,
      }));
    if (ratingRows.length > 0) {
      const { error } = await supabase.from("rating_entries").insert(ratingRows);
      if (!error) ratingsLogged = ratingRows.length;
    }
  }

  // ── Puzzles — record the platform puzzle rating + cumulative count as a
  //    dated session, tracking the delta so re-syncs never double-count. ──
  let puzzlesLogged = 0;
  const puzzleRating = cc?.puzzle?.rating ?? li?.puzzle?.rating ?? null;
  const puzzleCumulative = li?.puzzle?.count ?? null; // only Lichess exposes a count
  if (puzzleRating != null || puzzleCumulative != null) {
    const { data: existingPz } = await supabase
      .from("puzzles")
      .select("count, notes, session_date")
      .eq("user_id", userId);
    const pzRows = (existingPz ?? []) as { count: number; notes: string | null; session_date: string }[];
    const importedSoFar = pzRows
      .filter((p) => typeof p.notes === "string" && p.notes.includes("Imported"))
      .reduce((a, p) => a + (p.count ?? 0), 0);
    const todayHasImport = pzRows.some(
      (p) => p.session_date === today() && typeof p.notes === "string" && p.notes.includes("Imported"),
    );

    let count = 0;
    if (puzzleCumulative != null) count = Math.max(0, puzzleCumulative - importedSoFar);
    else count = 1; // rating-only source (Chess.com) — one dated marker per day

    if (count > 0 && !todayHasImport) {
      const src = li?.puzzle ? "Lichess" : "Chess.com";
      const { error } = await supabase.from("puzzles").insert({
        user_id: userId,
        session_date: today(),
        count,
        accuracy: null,
        minutes: null,
        puzzle_rating: puzzleRating,
        notes: `Imported from ${src}`,
      });
      if (!error) puzzlesLogged = count;
    }
  }

  // Refresh derived state + caches.
  await recomputeFormatRatings();
  updateTag(userTag(userId, "games"));
  updateTag(userTag(userId, "ratings"));
  updateTag(userTag(userId, "puzzles"));
  updateTag(userTag(userId, "profile"));
  recomputeGoals().catch((e) => console.error("recomputeGoals (import):", e));

  return {
    success: true,
    ranAny: true,
    chesscom: ccUser ? { newGames: ccNew, error: cc?.error } : null,
    lichess: liUser ? { newGames: liNew, error: li?.error } : null,
    ratingsLogged,
    puzzlesLogged,
  };
}

// ─── Diagnostic ──────────────────────────────────────────────
// Hit /api/sync-debug (while signed in) to see exactly what the sync sees:
// saved usernames, whether the games columns exist, and how many games each
// platform actually returns. Delete once sync is confirmed working.
export async function debugSync() {
  const { userId } = await auth();
  if (!userId) return { ok: false, reason: "Not signed in — open this while logged in." };

  const supabase = createAdminClient();
  const out: Record<string, unknown> = { userId };

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("chess_com_username, lichess_username")
    .eq("user_id", userId)
    .maybeSingle();
  out.profileError = profErr?.message ?? null;
  const ccUser = (profile?.chess_com_username as string | null)?.trim() || null;
  const liUser = (profile?.lichess_username as string | null)?.trim() || null;
  out.chessComUsername = ccUser;
  out.lichessUsername = liUser;

  // Does the games table have the source / external_id columns (migration 0007)?
  const colCheck = await supabase.from("games").select("id, source, external_id").limit(1);
  out.gamesColumnsOk = !colCheck.error;
  out.gamesColumnsError = colCheck.error?.message ?? null;

  const gameCount = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  out.currentGameCount = gameCount.count ?? 0;

  if (ccUser) {
    const cc = await fetchChessCom(ccUser);
    out.chesscom = {
      fetchedGames: cc.games.length,
      ratings: cc.ratings,
      puzzle: cc.puzzle ?? null,
      error: cc.error ?? null,
      sample: cc.games[0] ?? null,
    };
  }
  if (liUser) {
    const li = await fetchLichess(liUser);
    out.lichess = {
      fetchedGames: li.games.length,
      ratings: li.ratings,
      puzzle: li.puzzle ?? null,
      error: li.error ?? null,
      sample: li.games[0] ?? null,
    };
  }

  out.hint =
    !ccUser && !liUser
      ? "No usernames saved — enter them in Settings → Connected Platforms and hit Save/Sync."
      : !out.gamesColumnsOk
        ? "The games table is missing the source/external_id columns — apply Supabase migration 0007."
        : "Usernames + columns look OK. If fetchedGames > 0 but currentGameCount doesn't grow after Sync, the insert is failing — check server logs.";

  return out;
}
