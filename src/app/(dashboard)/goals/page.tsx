"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

import { NewGoalModal } from "@/components/goals/new-goal-modal";
import {
  deleteGoal,
  getGoals,
  recomputeGoals,
} from "@/features/goals/actions";
import type { GoalMetric, GoalRow } from "@/types/database";

const PIECES = {
  king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙",
};

const METRIC_PIECE: Record<GoalMetric, string> = {
  rating: PIECES.queen,
  puzzles: PIECES.knight,
  games: PIECES.rook,
  streak: PIECES.bishop,
  study_minutes: PIECES.pawn,
};

const METRIC_LABEL: Record<GoalMetric, string> = {
  rating: "rating",
  puzzles: "puzzles",
  games: "games",
  streak: "days",
  study_minutes: "minutes",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await recomputeGoals();
        const rows = await getGoals();
        if (!cancelled) setGoals(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await deleteGoal(id);
  };

  const active = goals.filter((g) => !g.completed_at);
  const done = goals.filter((g) => g.completed_at);

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span className="pointer-events-none absolute top-32 -left-12 font-display text-emerald/[0.05] leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.queen}</span>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        {/* Header */}
        <FadeUp>
          <header className="relative pb-6 border-b border-gold/30">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Chapter Five</p>
                <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                  Your <span className="italic text-emerald">Goals</span>
                </h1>
                <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
                  &ldquo;A goal is a dream with a deadline.&rdquo;
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]"
              >
                <Plus className="w-4 h-4 text-gold" />
                New Goal
                <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </button>
            </div>
          </header>
        </FadeUp>

        {/* Active */}
        <FadeUp>
          <section>
            <SectionHeading
              eyebrow="In Progress"
              title={active.length === 0 ? "No active goals yet" : `${active.length} pursued`}
            />
            {active.length === 0 ? (
              <EmptyGoals onAdd={() => setModalOpen(true)} />
            ) : (
              <ul className="grid md:grid-cols-2 gap-5">
                <AnimatePresence>
                  {active.map((g, i) => (
                    <motion.li
                      key={g.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                    >
                      <GoalCard goal={g} onDelete={() => handleDelete(g.id)} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </FadeUp>

        {/* Completed */}
        {done.length > 0 && (
          <FadeUp delay={0.05}>
            <section>
              <SectionHeading eyebrow="Achieved" title="Goals you've claimed" />
              <ul className="grid md:grid-cols-2 gap-5">
                {done.map((g, i) => (
                  <motion.li
                    key={g.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <CompletedGoalCard goal={g} onDelete={() => handleDelete(g.id)} />
                  </motion.li>
                ))}
              </ul>
            </section>
          </FadeUp>
        )}
      </div>

      <NewGoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={(row) => setGoals((prev) => [row, ...prev])}
      />
    </div>
  );
}

function GoalCard({ goal, onDelete }: { goal: GoalRow; onDelete: () => void }) {
  const progress = Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100));
  const piece = METRIC_PIECE[goal.metric];
  const unit = METRIC_LABEL[goal.metric];

  return (
    <article className="relative bg-white border border-gold/45 rounded-sm p-6 hover:border-emerald transition-colors group">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <p className="font-serif-quote italic text-gold-deep tracking-[0.22em] uppercase text-[10px] mb-1">
            {goal.metric.replace("_", " ")}
          </p>
          <h3 className="font-display text-xl text-ink leading-tight">{goal.title}</h3>
        </div>
        <span className="font-display text-3xl text-gold-deep leading-none" aria-hidden="true">{piece}</span>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <p className="font-display text-3xl text-emerald leading-none">
          {goal.current_value.toLocaleString()}
        </p>
        <p className="text-[12px] tracking-[0.22em] uppercase text-ink/55">
          of {goal.target_value.toLocaleString()} {unit}
        </p>
      </div>

      <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full bg-emerald"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] tracking-[0.18em] uppercase">
        <span className="text-gold-deep">{Math.round(progress)}%</span>
        {goal.due_date && (
          <span className="text-ink/50">
            Due {new Date(goal.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <button
        onClick={onDelete}
        className="absolute top-3 right-9 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-ink/40 hover:text-destructive"
        aria-label="Delete goal"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </article>
  );
}

function CompletedGoalCard({ goal, onDelete }: { goal: GoalRow; onDelete: () => void }) {
  const piece = METRIC_PIECE[goal.metric];

  return (
    <article className="relative bg-gold-light/45 border border-gold-deep/40 rounded-sm p-6 group">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/55" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/55" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/55" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/55" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-serif-quote italic text-emerald tracking-[0.22em] uppercase text-[10px] mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </p>
          <h3 className="font-display text-xl text-ink leading-tight">{goal.title}</h3>
        </div>
        <span className="font-display text-3xl text-emerald leading-none" aria-hidden="true">{piece}</span>
      </div>

      <p className="mt-3 font-serif-quote italic text-[13px] text-ink/65">
        {goal.target_value.toLocaleString()} {METRIC_LABEL[goal.metric]} ·
        {" "}
        {goal.completed_at
          ? new Date(goal.completed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : ""}
      </p>

      <button
        onClick={onDelete}
        className="absolute top-3 right-9 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-ink/40 hover:text-destructive"
        aria-label="Delete goal"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </article>
  );
}

function EmptyGoals({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative bg-white border border-dashed border-gold/45 rounded-sm p-12 text-center">
      <span className="font-display text-5xl text-gold-deep/40 leading-none" aria-hidden="true">{PIECES.queen}</span>
      <p className="mt-4 font-display text-xl text-ink">No goals set yet</p>
      <p className="mt-2 font-serif-quote italic text-ink/60 text-sm max-w-md mx-auto">
        Reach 1500 rating. Play 20 games this month. Solve 100 puzzles. The progress bars fill themselves as you record your work.
      </p>
      <button onClick={onAdd} className="mt-6 inline-flex items-center gap-2 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors">
        <Plus className="w-4 h-4 text-gold" />
        New Goal
      </button>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">{eyebrow}</p>
      <h2 className="font-display text-2xl text-ink leading-tight">{title}</h2>
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
      <div className="grid md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-40 bg-white border border-gold/30 rounded-sm" />))}
      </div>
    </div>
  );
}
