"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  getAchievements,
  unlockMany,
} from "@/features/achievements/actions";
import { getRatingEntries } from "@/features/ratings/actions";
import { getGames } from "@/features/games/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import { evaluate, BADGES, type BadgeStatus } from "@/lib/achievements";
import type {
  AchievementRow,
  GameRow,
  JournalRow,
  PuzzleRow,
  RatingEntryRow,
} from "@/types/database";

const PIECES = { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" };

const GROUP_TITLES: Record<string, string> = {
  rating:  "Rating Milestones",
  puzzles: "Puzzle Mastery",
  games:   "Battles Played",
  streak:  "Streaks",
  journal: "The Journal",
};

export default function AchievementsPage() {
  const [statuses, setStatuses] = useState<BadgeStatus[]>([]);
  const [persisted, setPersisted] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ratings, puzzles, games, journal, existing] = await Promise.all([
          getRatingEntries(),
          getPuzzles(),
          getGames(),
          getJournalEntries(),
          getAchievements(),
        ]);
        if (cancelled) return;

        const evals = evaluate({
          ratings: ratings as RatingEntryRow[],
          puzzles: puzzles as PuzzleRow[],
          games: games as GameRow[],
          journal: journal as JournalRow[],
        });

        setStatuses(evals);
        setPersisted(existing);

        // Only persist NEW unlocks — skip the write entirely if every earned
        // badge is already in the achievements table. Avoids a useless
        // INSERT round-trip on every page visit.
        const persistedKeys = new Set(existing.map((p) => p.key));
        const newlyEarned = evals
          .filter((e) => e.unlocked && !persistedKeys.has(e.badge.key))
          .map((e) => e.badge.key);
        if (newlyEarned.length > 0) await unlockMany(newlyEarned);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totals = useMemo(() => {
    const unlocked = statuses.filter((s) => s.unlocked).length;
    return { unlocked, total: statuses.length, percent: statuses.length ? Math.round((unlocked / statuses.length) * 100) : 0 };
  }, [statuses]);

  const grouped = useMemo(() => {
    const m: Record<string, BadgeStatus[]> = {};
    for (const s of statuses) {
      const g = s.badge.group;
      if (!m[g]) m[g] = [];
      m[g].push(s);
    }
    return m;
  }, [statuses]);

  const persistedByKey = useMemo(
    () => new Map(persisted.map((p) => [p.key, p])),
    [persisted],
  );

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span className="pointer-events-none absolute top-32 -right-12 font-display text-gold/15 leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.queen}</span>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        <FadeUp>
          <header className="relative pb-6 border-b border-gold/30 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Chapter Seven</p>
              <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                <span className="italic text-emerald">Achievements</span>
              </h1>
              <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
                &ldquo;Every badge is a moment you chose to keep playing.&rdquo;
              </p>
            </div>

            <div className="bg-white border border-gold/45 rounded-sm p-5 text-center min-w-[14rem] relative">
              <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
              <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
              <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
              <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />
              <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">Earned</p>
              <p className="font-display text-4xl text-emerald leading-none mt-1">
                {totals.unlocked}
                <span className="text-base text-ink/55 font-sans"> / {totals.total}</span>
              </p>
              <p className="font-serif-quote italic text-[12px] text-gold-deep mt-2">{totals.percent}% complete</p>
            </div>
          </header>
        </FadeUp>

        {/* Per-group sections */}
        {Object.entries(grouped).map(([group, items], idx) => (
          <FadeUp key={group} delay={idx * 0.05}>
            <section>
              <SectionHeading
                eyebrow={`${items.filter(i => i.unlocked).length} / ${items.length} earned`}
                title={GROUP_TITLES[group] ?? group}
              />
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s, i) => (
                  <motion.li
                    key={s.badge.key}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  >
                    <BadgeCard status={s} persisted={persistedByKey.get(s.badge.key)} />
                  </motion.li>
                ))}
              </ul>
            </section>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ status, persisted }: { status: BadgeStatus; persisted?: AchievementRow }) {
  const { badge, unlocked, progress, detail } = status;

  return (
    <article
      className={`relative p-5 rounded-sm border transition-colors ${
        unlocked
          ? "bg-gold-light/50 border-gold-deep/40"
          : "bg-white border-gold/30"
      }`}
    >
      <span className={`absolute top-2 left-2 size-2 border-t border-l ${unlocked ? "border-gold-deep/55" : "border-gold-deep/35"}`} />
      <span className={`absolute top-2 right-2 size-2 border-t border-r ${unlocked ? "border-gold-deep/55" : "border-gold-deep/35"}`} />
      <span className={`absolute bottom-2 left-2 size-2 border-b border-l ${unlocked ? "border-gold-deep/55" : "border-gold-deep/35"}`} />
      <span className={`absolute bottom-2 right-2 size-2 border-b border-r ${unlocked ? "border-gold-deep/55" : "border-gold-deep/35"}`} />

      {unlocked && (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(230, 196, 106, 0)",
              "0 0 0 10px rgba(230, 196, 106, 0.18)",
              "0 0 0 0 rgba(230, 196, 106, 0)",
            ],
          }}
          transition={{ duration: 2.6, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none rounded-sm"
        />
      )}

      <div className="relative flex items-start gap-4">
        <div className={`size-14 rounded-full flex items-center justify-center shrink-0 border ${unlocked ? "bg-white border-gold-deep/40" : "bg-ivory border-ink/15"}`}>
          <span className={`font-display text-3xl leading-none ${unlocked ? "text-emerald" : "text-ink/30"}`} aria-hidden="true">{badge.piece}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-display text-base leading-tight ${unlocked ? "text-ink" : "text-ink/60"}`}>
              {badge.name}
            </h3>
            {unlocked && (
              <span className="text-[8px] tracking-[0.22em] uppercase text-gold-deep shrink-0">★ Earned</span>
            )}
          </div>
          <p className="font-serif-quote italic text-[12.5px] text-ink/55 leading-snug">
            {badge.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={unlocked ? "h-full bg-gold-deep" : "h-full bg-emerald"}
              />
            </div>
            <span className="text-[10px] tracking-[0.22em] uppercase text-ink/55 whitespace-nowrap">{detail}</span>
          </div>
          {persisted?.unlocked_at && unlocked && (
            <p className="mt-1.5 text-[10px] tracking-[0.18em] uppercase text-gold-deep/70">
              {new Date(persisted.unlocked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">{eyebrow}</p>
      <h2 className="font-display text-2xl text-ink leading-tight">{title}</h2>
    </div>
  );
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}>
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-12 w-72 bg-ink/10 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="h-28 bg-white border border-gold/30 rounded-sm" />))}
      </div>
    </div>
  );
}

// Suppress unused warning — BADGES is exported by lib for catalog use.
void BADGES;
