"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

import { LogStudyModal } from "@/components/study/log-study-modal";
import {
  deleteStudySession,
  getStudySessions,
} from "@/features/study/actions";
import { getGames } from "@/features/games/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import type {
  GameRow,
  JournalRow,
  PuzzleRow,
  StudyKind,
  StudySessionRow,
} from "@/types/database";

const PIECES = { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" };

const KIND_LABEL: Record<StudyKind, string> = {
  opening: "Openings",
  endgame: "Endgames",
  tactics: "Tactics",
  video: "Video",
  book: "Book",
  game_review: "Game Review",
};

const KIND_PIECE: Record<StudyKind, string> = {
  opening: "♔",
  endgame: "♚",
  tactics: "♘",
  video: "♗",
  book: "♖",
  game_review: "♕",
};

interface ChecklistItem {
  key:     string;
  label:   string;
  done:    boolean;
  detail:  string;
  piece:   string;
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StudyPlannerPage() {
  const today = isoDate(new Date());
  const [sessions, setSessions] = useState<StudySessionRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, g, p, j] = await Promise.all([
          getStudySessions(),
          getGames(),
          getPuzzles(),
          getJournalEntries(),
        ]);
        if (cancelled) return;
        setSessions(s);
        setGames(g);
        setPuzzles(p);
        setJournal(j);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const checklist: ChecklistItem[] = useMemo(() => {
    const gamesToday = games.filter((g) => g.played_at === today).length;
    const puzzlesToday = puzzles.filter((p) => p.session_date === today).reduce((a, p) => a + p.count, 0);
    const openingsToday = sessions.filter((s) => s.entry_date === today && s.kind === "opening").reduce((a, s) => a + s.minutes, 0);
    const endgamesToday = sessions.filter((s) => s.entry_date === today && s.kind === "endgame").reduce((a, s) => a + s.minutes, 0);
    const videosToday   = sessions.filter((s) => s.entry_date === today && s.kind === "video").reduce((a, s) => a + s.minutes, 0);
    const booksToday    = sessions.filter((s) => s.entry_date === today && s.kind === "book").reduce((a, s) => a + s.minutes, 0);
    const journalToday  = journal.filter((j) => j.entry_date === today).length;

    return [
      { key: "play",     label: "Play a game",         done: gamesToday >= 1,    detail: gamesToday    ? `${gamesToday} logged`     : "Not yet",     piece: PIECES.rook   },
      { key: "puzzles",  label: "Solve puzzles",       done: puzzlesToday >= 10, detail: puzzlesToday  ? `${puzzlesToday} solved`   : "Not yet",     piece: PIECES.knight },
      { key: "openings", label: "Study an opening",    done: openingsToday >= 10, detail: openingsToday ? `${openingsToday} min`    : "Not yet",     piece: PIECES.king   },
      { key: "endgames", label: "Endgame practice",    done: endgamesToday >= 10, detail: endgamesToday ? `${endgamesToday} min`    : "Not yet",     piece: PIECES.bishop },
      { key: "videos",   label: "Watch a video",       done: videosToday >= 5,    detail: videosToday   ? `${videosToday} min`      : "Not yet",     piece: PIECES.bishop },
      { key: "books",    label: "Read from a book",    done: booksToday >= 10,    detail: booksToday    ? `${booksToday} min`       : "Not yet",     piece: PIECES.rook   },
      { key: "journal",  label: "Write in the journal", done: journalToday >= 1,  detail: journalToday  ? `${journalToday} entry`    : "Not yet",     piece: PIECES.pawn   },
    ];
  }, [games, puzzles, sessions, journal, today]);

  const completedToday = checklist.filter((c) => c.done).length;
  const totalToday = checklist.length;
  const dailyPercent = Math.round((completedToday / totalToday) * 100);

  const stats = useMemo(() => {
    const totalMin = sessions.reduce((a, s) => a + s.minutes, 0);
    const byKind: Record<string, number> = {};
    for (const s of sessions) byKind[s.kind] = (byKind[s.kind] ?? 0) + s.minutes;
    return { totalMin, byKind };
  }, [sessions]);

  const handleDelete = async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await deleteStudySession(id);
  };

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span className="pointer-events-none absolute top-32 -left-12 font-display text-emerald/[0.05] leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.bishop}</span>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        {/* Header */}
        <FadeUp>
          <header className="relative pb-6 border-b border-gold/30 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Chapter Nine</p>
              <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                The <span className="italic text-emerald">Study Planner</span>
              </h1>
              <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
                &ldquo;Deliberate practice. Every day.&rdquo;
              </p>
            </div>
            <button onClick={() => setModalOpen(true)} className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]">
              <Plus className="w-4 h-4 text-gold" />
              Log Study Session
              <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
          </header>
        </FadeUp>

        {/* Daily checklist */}
        <FadeUp>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
            <CornerBrackets />
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Today</p>
                <h2 className="font-display text-3xl text-ink leading-tight">
                  Your daily <span className="italic text-emerald">ritual</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">Progress</p>
                <p className="font-display text-3xl text-emerald leading-none mt-1">{completedToday}<span className="text-base text-ink/55 font-sans"> / {totalToday}</span></p>
              </div>
            </div>

            <div className="h-2 bg-ink/10 rounded-full overflow-hidden mb-7">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dailyPercent}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full bg-emerald"
              />
            </div>

            <ul className="space-y-3">
              {checklist.map((item, i) => (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-4 py-3 border rounded-sm transition-colors ${
                    item.done ? "bg-gold-light/45 border-gold-deep/40" : "bg-ivory/60 border-gold/25"
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center shrink-0 border ${item.done ? "bg-white border-gold-deep/45" : "bg-white border-ink/15"}`}>
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald" />
                    ) : (
                      <span className="font-display text-lg text-gold-deep leading-none" aria-hidden="true">{item.piece}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-display text-base leading-tight ${item.done ? "text-ink" : "text-ink/65"}`}>{item.label}</p>
                  </div>
                  <p className="font-serif-quote italic text-[12px] text-gold-deep whitespace-nowrap">{item.detail}</p>
                </motion.li>
              ))}
            </ul>
          </section>
        </FadeUp>

        {/* Stats */}
        <FadeUp>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Stat label="Total Minutes" value={stats.totalMin} piece={PIECES.queen} />
            <Stat label="Openings" value={stats.byKind.opening ?? 0} piece={PIECES.king} suffix="min" />
            <Stat label="Endgames" value={stats.byKind.endgame ?? 0} piece={PIECES.bishop} suffix="min" />
            <Stat label="Tactics"  value={stats.byKind.tactics ?? 0} piece={PIECES.knight} suffix="min" />
          </section>
        </FadeUp>

        {/* History */}
        <FadeUp>
          <section>
            <SectionHeading eyebrow="The Log" title="Recent study sessions" />
            {sessions.length === 0 ? (
              <EmptyStudy onAdd={() => setModalOpen(true)} />
            ) : (
              <ul className="space-y-3">
                {sessions.slice(0, 12).map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                  >
                    <SessionCard session={s} onDelete={() => handleDelete(s.id)} />
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </FadeUp>
      </div>

      <LogStudyModal open={modalOpen} onOpenChange={setModalOpen} onSaved={(row) => setSessions((prev) => [row, ...prev])} />
    </div>
  );
}

function SessionCard({ session, onDelete }: { session: StudySessionRow; onDelete: () => void }) {
  const dateLabel = new Date(session.entry_date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
  return (
    <article className="flex items-stretch bg-white border border-gold/40 rounded-sm overflow-hidden hover:border-emerald transition-colors group">
      <div className="w-1 bg-emerald" aria-hidden="true" />
      <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-serif-quote italic text-gold-deep text-[12px] tracking-[0.18em] uppercase">{dateLabel}</span>
            <span className="text-[10px] tracking-[0.22em] uppercase text-ink/45 px-2 py-0.5 bg-ivory border border-gold/30 rounded-sm">{KIND_LABEL[session.kind]}</span>
          </div>
          {session.topic && (
            <p className="font-display text-base text-ink leading-tight">{session.topic}</p>
          )}
          {session.notes && (
            <p className="font-serif-quote italic text-[13px] text-ink/65 mt-1 leading-snug">&ldquo;{session.notes}&rdquo;</p>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-display text-2xl text-emerald leading-none">{session.minutes}</p>
            <p className="text-[9px] tracking-[0.22em] uppercase text-ink/50 mt-1">minutes</p>
          </div>
          <span className="font-display text-2xl text-gold-deep leading-none" aria-hidden="true">{KIND_PIECE[session.kind]}</span>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink/40 hover:text-destructive" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, piece, suffix }: { label: string; value: number; piece: string; suffix?: string }) {
  return (
    <article className="relative bg-white border border-gold/45 rounded-sm p-5 hover:-translate-y-0.5 hover:border-emerald transition-all group">
      <CornerBrackets small />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 font-medium">{label}</p>
        <span className="font-display text-2xl text-gold-deep group-hover:text-emerald transition-colors leading-none">{piece}</span>
      </div>
      <p className="font-display text-3xl text-emerald leading-none">
        {value}
        {suffix && <span className="text-sm text-ink/55 font-sans ml-1.5">{suffix}</span>}
      </p>
    </article>
  );
}

function EmptyStudy({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative bg-white border border-dashed border-gold/45 rounded-sm p-12 text-center">
      <span className="font-display text-5xl text-gold-deep/40 leading-none" aria-hidden="true">{PIECES.bishop}</span>
      <p className="mt-4 font-display text-xl text-ink">No study logged yet</p>
      <p className="mt-2 font-serif-quote italic text-ink/60 text-sm max-w-md mx-auto">
        Every video watched. Every chapter read. Every line drilled. Log them — your habits will surface.
      </p>
      <button onClick={onAdd} className="mt-6 inline-flex items-center gap-2 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors">
        <Plus className="w-4 h-4 text-gold" />
        Log Study Session
      </button>
    </div>
  );
}

function CornerBrackets({ small = false }: { small?: boolean }) {
  const c = small ? "size-2 border-gold-deep/45" : "size-2 border-gold-deep/50";
  return (
    <>
      <span className={`absolute top-2 left-2 border-t border-l ${c}`} />
      <span className={`absolute top-2 right-2 border-t border-r ${c}`} />
      <span className={`absolute bottom-2 left-2 border-b border-l ${c}`} />
      <span className={`absolute bottom-2 right-2 border-b border-r ${c}`} />
    </>
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
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}>
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-12 w-72 bg-ink/10 rounded" />
      <div className="h-72 bg-white border border-gold/30 rounded-sm" />
      <div className="grid grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 bg-white border border-gold/30 rounded-sm" />))}
      </div>
    </div>
  );
}
