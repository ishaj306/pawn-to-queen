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

export function useChessData() {
  const [data, setData] = useState<ChessData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const d = await getChessData();
    setData(d);
  }, []);

  useEffect(() => {
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
  }, []);

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
