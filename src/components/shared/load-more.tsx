"use client";

import { Plus } from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Load More button — drop-in for list virtualization.
//  Pages still fetch all rows for aggregations, but only render
//  the first `visible` rows in the list view to avoid huge DOMs.
// ─────────────────────────────────────────────────────────────

export function LoadMore({
  visible,
  total,
  step,
  onMore,
}: {
  visible: number;
  total: number;
  step: number;
  onMore: () => void;
}) {
  if (visible >= total) return null;
  const remaining = total - visible;
  const next = Math.min(step, remaining);

  return (
    <div className="pt-2 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onMore}
        className="group inline-flex items-center gap-2.5 bg-white border border-gold/45 rounded-sm px-6 py-3 text-[12px] tracking-[0.24em] uppercase text-ink/70 hover:text-emerald hover:border-emerald transition-colors"
      >
        <Plus className="w-4 h-4 text-gold-deep" />
        Show {next} more
        <span className="text-ink/40 group-hover:text-emerald transition-colors" aria-hidden="true">→</span>
      </button>
      <p className="font-serif-quote italic text-[11px] text-ink/50">
        Showing {visible} of {total.toLocaleString()}
      </p>
    </div>
  );
}
