"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getChessData, type ChessData } from "./actions";
import { computeChessStats, type ChessStats } from "@/lib/chess-stats";

// ─────────────────────────────────────────────────────────────
//  useChessData — every page's window onto the single source of
//  truth. Fetches the synchronized dataset once, derives ALL stats
//  through computeChessStats, and exposes refresh() (called after a
//  Sync) so the whole UI updates from one place. No page invents its
//  own numbers or falls back to sample data.
// ─────────────────────────────────────────────────────────────

export function useChessData(initialData?: ChessData) {
  // When a server component seeds initialData, we render with it on first
  // paint and skip the mount fetch — refresh() still re-pulls after a Sync.
  const [data, setData] = useState<ChessData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);

  const refresh = useCallback(async () => {
    const d = await getChessData();
    setData(d);
  }, []);

  useEffect(() => {
    if (initialData) return; // already seeded from the server
    let cancelled = false;
    (async () => {
      try {
        const d = await getChessData();
        if (!cancelled) setData(d);
      } catch (err) {
        console.error("useChessData: failed to load", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialData]);

  const stats: ChessStats = useMemo(
    () =>
      computeChessStats({
        games: data?.games ?? [],
        ratings: data?.ratings ?? [],
        puzzles: data?.puzzles ?? [],
        journal: data?.journal ?? [],
        study: data?.study ?? [],
        primaryFormat: data?.profile?.primary_format,
      }),
    [data],
  );

  return { data, stats, loading, refresh };
}
