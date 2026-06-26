"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2 } from "lucide-react";

import { NewJournalModal } from "@/components/journal/new-entry-modal";
import {
  deleteJournalEntry,
  getJournalEntries,
} from "@/features/journal/actions";
import { LoadMore } from "@/components/shared/load-more";
import type { JournalKind, JournalRow } from "@/types/database";

const PIECES = {
  king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙",
};

const KIND_PIECE: Record<JournalKind, string> = {
  lesson: "♘", mistake: "♙", tournament: "♕", thought: "♗", daily: "♖",
};

const KIND_FILTERS: { value: "all" | JournalKind; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "lesson",     label: "Lessons" },
  { value: "mistake",    label: "Mistakes" },
  { value: "tournament", label: "Tournaments" },
  { value: "thought",    label: "Thoughts" },
  { value: "daily",      label: "Daily" },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | JournalKind>("all");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(20);

  const refresh = async () => {
    const rows = await getJournalEntries();
    setEntries(rows);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getJournalEntries();
        if (!cancelled) setEntries(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter !== "all" && e.kind !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.title ?? ""} ${e.body}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filter, search]);

  const stats = useMemo(() => {
    const total = entries.length;
    const byKind = entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});
    // Streak: consecutive days with entries
    const dates = Array.from(new Set(entries.map((e) => e.entry_date))).sort().reverse();
    let streak = 0;
    const today = isoDate(new Date());
    for (let i = 0; i < 365; i++) {
      const d = isoDate(daysAgo(i));
      if (dates.includes(d)) streak++;
      else if (i === 0 && d === today) continue;
      else break;
    }
    return { total, byKind, streak };
  }, [entries]);

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const res = await deleteJournalEntry(id);
    if (!res.success) refresh();
  };

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span className="pointer-events-none absolute top-32 -right-12 font-display text-gold/15 leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.bishop}</span>
      <span className="pointer-events-none absolute bottom-20 -left-10 font-display text-emerald/[0.05] leading-none select-none hidden lg:block" style={{ fontSize: "22rem" }} aria-hidden="true">{PIECES.knight}</span>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        {/* Header */}
        <FadeUp>
          <header className="relative pb-6 border-b border-gold/30">
            <span className="pointer-events-none absolute -top-10 left-0 font-display text-gold/15 leading-none select-none hidden md:block" style={{ fontSize: "13rem" }} aria-hidden="true">{PIECES.bishop}</span>
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Chapter Six</p>
                <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                  The <span className="italic text-emerald">Journal</span>
                </h1>
                <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
                  &ldquo;The pen remembers what the board forgets.&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]"
              >
                <Plus className="w-4 h-4 text-gold" />
                New Entry
                <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </button>
            </div>
          </header>
        </FadeUp>

        {/* Stats */}
        <FadeUp>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total Entries"  value={stats.total}                        piece={PIECES.pawn} />
            <StatCard label="Journal Streak" value={`${stats.streak} ${stats.streak === 1 ? "day" : "days"}`} piece={PIECES.knight} />
            <StatCard label="Lessons"        value={stats.byKind.lesson ?? 0}           piece={PIECES.bishop} />
            <StatCard label="Tournaments"    value={stats.byKind.tournament ?? 0}       piece={PIECES.queen} />
          </section>
        </FadeUp>

        {/* Filters */}
        <FadeUp>
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex flex-wrap gap-1 p-1 bg-white border border-gold/45 rounded-sm">
              {KIND_FILTERS.map((k) => {
                const active = filter === k.value;
                return (
                  <button
                    key={k.value}
                    onClick={() => setFilter(k.value)}
                    className="relative px-4 py-2 text-[11px] tracking-[0.22em] uppercase font-medium transition-colors z-10"
                  >
                    {active && (
                      <motion.span layoutId="journal-tab" className="absolute inset-0 bg-emerald border border-gold rounded-sm -z-10" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                    )}
                    <span className={active ? "text-ivory" : "text-ink/65 hover:text-emerald transition-colors"}>{k.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-ink/40" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search journal…"
                className="pl-10 pr-3 py-2 bg-white border border-gold/40 rounded-sm text-[13px] focus:outline-none focus:border-emerald transition-colors w-full md:w-72"
              />
            </div>
          </div>
        </FadeUp>

        {/* Entries */}
        {filtered.length === 0 ? (
          <FadeUp>
            <EmptyJournal onAdd={() => setModalOpen(true)} />
          </FadeUp>
        ) : (
          <div>
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {filtered.slice(0, visible).map((e, i) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                >
                  <EntryCard entry={e} onDelete={() => handleDelete(e.id)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-5">
            <LoadMore
              visible={Math.min(visible, filtered.length)}
              total={filtered.length}
              step={20}
              onMore={() => setVisible((v) => v + 20)}
            />
          </div>
          </div>
        )}
      </div>

      <NewJournalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={(row) => setEntries((prev) => [row, ...prev])}
      />
    </div>
  );
}

function EntryCard({ entry, onDelete }: { entry: JournalRow; onDelete: () => void }) {
  const dateLabel = new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const piece = KIND_PIECE[entry.kind];

  return (
    <article className="relative bg-white border border-gold/40 rounded-sm overflow-hidden hover:border-emerald transition-colors group">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <div className="flex items-stretch">
        <div className="w-16 shrink-0 bg-ivory/60 border-r border-gold/35 flex flex-col items-center justify-center py-5 gap-1">
          <span className="font-display text-3xl text-gold-deep leading-none" aria-hidden="true">{piece}</span>
          <span className="text-[9px] tracking-[0.22em] uppercase text-ink/50">{entry.kind}</span>
        </div>

        <div className="flex-1 px-5 py-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="font-serif-quote italic text-gold-deep text-[12px] tracking-[0.18em] uppercase">
                {dateLabel}
                {entry.mood && (
                  <>
                    {" · "}
                    <span className="text-emerald">{entry.mood}</span>
                  </>
                )}
              </p>
              {entry.title && (
                <h3 className="font-display text-xl text-ink leading-tight mt-1">
                  {entry.title}
                </h3>
              )}
            </div>
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink/40 hover:text-destructive"
              aria-label="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <p className="font-serif-quote text-[14.5px] text-ink/80 leading-relaxed whitespace-pre-wrap">
            {entry.body}
          </p>
        </div>
      </div>
    </article>
  );
}

function StatCard({ label, value, piece }: { label: string; value: number | string; piece: string }) {
  return (
    <article className="group relative bg-white border border-gold/45 rounded-sm p-6 hover:-translate-y-0.5 hover:border-emerald hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.25)] transition-all">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 font-medium">{label}</p>
        <span className="font-display text-2xl text-gold-deep group-hover:text-emerald transition-colors leading-none">{piece}</span>
      </div>
      <p className="font-display text-3xl text-emerald leading-none">{value}</p>
    </article>
  );
}

function EmptyJournal({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative bg-white border border-dashed border-gold/45 rounded-sm p-12 text-center">
      <span className="font-display text-5xl text-gold-deep/40 leading-none" aria-hidden="true">{PIECES.bishop}</span>
      <p className="mt-4 font-display text-xl text-ink">The journal awaits</p>
      <p className="mt-2 font-serif-quote italic text-ink/60 text-sm max-w-sm mx-auto">
        Lessons. Mistakes. The line you almost found. The tournament you almost won. Write it down.
      </p>
      <button onClick={onAdd} className="mt-6 inline-flex items-center gap-2 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors">
        <Plus className="w-4 h-4 text-gold" />
        New Entry
      </button>
    </div>
  );
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-12 w-72 bg-ink/10 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-28 bg-white border border-gold/30 rounded-sm" />))}
      </div>
      <div className="h-10 bg-white border border-gold/30 rounded-sm w-1/2" />
      <div className="h-64 bg-white border border-gold/30 rounded-sm" />
    </div>
  );
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
