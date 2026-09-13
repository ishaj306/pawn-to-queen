"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { getRatingEntries } from "@/features/ratings/actions";
import { getGames } from "@/features/games/actions";
import { getPuzzles } from "@/features/puzzles/actions";
import { getJournalEntries } from "@/features/journal/actions";
import { getStudySessions } from "@/features/study/actions";
import type {
  GameRow,
  JournalRow,
  PuzzleRow,
  RatingEntryRow,
  StudySessionRow,
} from "@/types/database";

const PIECES = { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" };

// ─── helpers ───
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

interface DayActivity {
  date:        string;
  intensity:   number;
  games:       number;
  puzzles:     number;
  studyMin:    number;
  journal:     number;
  ratingDelta: number | null;
}

function intensityColor(v: number): string {
  if (v <= 0)  return "#FAF8F2";
  if (v < 3)   return "#F2E4B0";
  if (v < 6)   return "#E6C46A";
  if (v < 10)  return "#2D7A56";
  return "#073A26";
}

export default function CalendarPage() {
  const [ratings, setRatings] = useState<RatingEntryRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [study, setStudy] = useState<StudySessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, g, p, j, s] = await Promise.all([
          getRatingEntries(),
          getGames(),
          getPuzzles(),
          getJournalEntries(),
          getStudySessions(),
        ]);
        if (cancelled) return;
        setRatings(r as RatingEntryRow[]);
        setGames(g);
        setPuzzles(p);
        setJournal(j);
        setStudy(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 53-week year view ending on this week's Saturday
  const weeks = useMemo(() => {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    const start = addDays(endOfWeek, -53 * 7 + 1);

    // Aggregate per day
    const gamesBy = new Map<string, number>();
    for (const g of games) gamesBy.set(g.played_at, (gamesBy.get(g.played_at) ?? 0) + 1);

    const puzzlesBy = new Map<string, number>();
    for (const p of puzzles) puzzlesBy.set(p.session_date, (puzzlesBy.get(p.session_date) ?? 0) + p.count);

    const studyBy = new Map<string, number>();
    for (const s of study) studyBy.set(s.entry_date, (studyBy.get(s.entry_date) ?? 0) + s.minutes);

    const journalBy = new Map<string, number>();
    for (const j of journal) journalBy.set(j.entry_date, (journalBy.get(j.entry_date) ?? 0) + 1);

    const ratingByDay = new Map<string, number>();
    for (const r of ratings) {
      // Keep the most recent rating for each date
      ratingByDay.set(r.entry_date, r.rating);
    }
    const sortedRatingDates = Array.from(ratingByDay.keys()).sort();

    const days: DayActivity[] = [];
    let prevRating: number | null = null;
    for (let i = 0; i < 53 * 7; i++) {
      const d = addDays(start, i);
      const iso = isoDate(d);
      const g = gamesBy.get(iso) ?? 0;
      const p = puzzlesBy.get(iso) ?? 0;
      const sMin = studyBy.get(iso) ?? 0;
      const jrn = journalBy.get(iso) ?? 0;

      // Rating delta vs the most recent prior rating
      let ratingDelta: number | null = null;
      if (ratingByDay.has(iso)) {
        const cur = ratingByDay.get(iso) as number;
        if (prevRating !== null) ratingDelta = cur - prevRating;
        prevRating = cur;
      } else {
        // backfill prevRating if any rating exists on or before this date
        const onOrBefore = sortedRatingDates.filter((x) => x <= iso);
        if (onOrBefore.length > 0) {
          prevRating = ratingByDay.get(onOrBefore[onOrBefore.length - 1]) ?? prevRating;
        }
      }

      const intensity = g + Math.min(8, p / 3) + sMin / 10 + jrn;
      days.push({
        date: iso,
        intensity,
        games: g,
        puzzles: p,
        studyMin: sMin,
        journal: jrn,
        ratingDelta,
      });
    }

    const weeks: DayActivity[][] = [];
    for (let w = 0; w < 53; w++) {
      weeks.push(days.slice(w * 7, w * 7 + 7));
    }
    return weeks;
  }, [ratings, games, puzzles, journal, study]);

  const monthLabels = useMemo(() => {
    return weeks.map((w, i) => {
      if (w.length === 0) return "";
      const first = w[0];
      const d = new Date(first.date + "T00:00:00");
      const m = d.getMonth();
      if (i === 0) return d.toLocaleDateString("en-US", { month: "short" });
      const prev = new Date(weeks[i - 1][0].date + "T00:00:00").getMonth();
      return m !== prev ? d.toLocaleDateString("en-US", { month: "short" }) : "";
    });
  }, [weeks]);

  const totals = useMemo(() => {
    let active = 0, games = 0, puzzles = 0, studyMin = 0, journal = 0;
    for (const w of weeks) {
      for (const d of w) {
        if (d.intensity > 0) active++;
        games += d.games;
        puzzles += d.puzzles;
        studyMin += d.studyMin;
        journal += d.journal;
      }
    }
    return { active, games, puzzles, studyMin, journal };
  }, [weeks]);

  const selectedDay = useMemo(() => {
    if (!selected) return null;
    for (const w of weeks) for (const d of w) if (d.date === selected) return d;
    return null;
  }, [selected, weeks]);

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span className="pointer-events-none absolute top-32 -right-10 font-display text-gold/15 leading-none select-none hidden lg:block" style={{ fontSize: "26rem" }} aria-hidden="true">{PIECES.queen}</span>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        <FadeUp>
          <header className="relative pb-6 border-b border-gold/30">
            <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">Chapter Ten</p>
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
              The <span className="italic text-emerald">Calendar</span>
            </h1>
            <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-2xl">
              &ldquo;Show me your calendar and I&apos;ll show you your future.&rdquo; A year of practice, every square a day.
            </p>
          </header>
        </FadeUp>

        {/* Year totals */}
        <FadeUp>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat label="Active Days" value={totals.active}                                piece={PIECES.queen}  />
            <Stat label="Games"       value={totals.games}                                 piece={PIECES.rook}   />
            <Stat label="Puzzles"     value={totals.puzzles}                               piece={PIECES.knight} />
            <Stat label="Study"       value={`${Math.round(totals.studyMin / 60)}h`}      piece={PIECES.bishop} />
            <Stat label="Journal"     value={totals.journal}                               piece={PIECES.pawn}   />
          </section>
        </FadeUp>

        {/* Heatmap */}
        <FadeUp delay={0.05}>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
            <CornerBrackets />

            <div className="mb-6">
              <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">A Year in Squares</p>
              <h2 className="font-display text-2xl text-ink leading-tight">53 weeks · {53 * 7} days</h2>
              <p className="mt-2 font-serif-quote italic text-ink/60 text-sm">
                Click any day to see what happened. Empty squares show days you stepped away.
              </p>
            </div>

            <div className="overflow-x-auto scroll-luxury">
              <div className="inline-block min-w-full">
                {/* Month labels */}
                <div className="ml-8 flex gap-[5px] mb-1.5">
                  {monthLabels.map((m, i) => (
                    <span key={i} className="text-[10px] tracking-[0.18em] uppercase text-ink/55 w-[14px] min-w-[14px]">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  {/* DOW labels */}
                  <div className="flex flex-col justify-between text-[10px] tracking-[0.18em] uppercase text-ink/45 pt-0.5 pb-0.5 w-6 shrink-0">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>

                  {/* Grid */}
                  <div className="flex gap-[5px]">
                    {weeks.map((wk, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[5px]">
                        {wk.map((day, dIdx) => {
                          const isToday = day.date === isoDate(new Date());
                          const isSelected = day.date === selected;
                          return (
                            <button
                              key={dIdx}
                              type="button"
                              onClick={() => setSelected(day.date)}
                              className={`size-[14px] rounded-sm cursor-pointer transition-transform hover:scale-150 ${isToday ? "ring-1 ring-gold-deep" : ""} ${isSelected ? "ring-2 ring-emerald" : ""}`}
                              style={{
                                backgroundColor: intensityColor(day.intensity),
                                border: day.intensity === 0 ? "1px solid rgba(184,146,63,0.25)" : undefined,
                              }}
                              aria-label={`${day.date}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-gold/25 flex items-center justify-end gap-3 text-[10px] tracking-[0.22em] uppercase text-ink/55">
              <span>Less</span>
              <span className="size-3 rounded-sm bg-ivory border border-gold/40" />
              <span className="size-3 rounded-sm" style={{ backgroundColor: "#F2E4B0" }} />
              <span className="size-3 rounded-sm" style={{ backgroundColor: "#E6C46A" }} />
              <span className="size-3 rounded-sm" style={{ backgroundColor: "#2D7A56" }} />
              <span className="size-3 rounded-sm" style={{ backgroundColor: "#073A26" }} />
              <span>More</span>
            </div>
          </section>
        </FadeUp>

        {/* Day detail */}
        <FadeUp delay={0.05}>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden min-h-[180px]">
            <CornerBrackets />
            {!selectedDay ? (
              <div className="text-center py-6">
                <p className="font-serif-quote italic text-ink/55">Pick a square above to see that day&apos;s record.</p>
              </div>
            ) : (
              <DayDetail
                day={selectedDay}
                ratings={ratings}
                games={games}
                puzzles={puzzles}
                study={study}
                journal={journal}
                onClose={() => setSelected(null)}
              />
            )}
          </section>
        </FadeUp>
      </div>
    </div>
  );
}

function DayDetail({
  day,
  ratings,
  games,
  puzzles,
  study,
  journal,
  onClose,
}: {
  day: DayActivity;
  ratings: RatingEntryRow[];
  games: GameRow[];
  puzzles: PuzzleRow[];
  study: StudySessionRow[];
  journal: JournalRow[];
  onClose: () => void;
}) {
  const ratingsToday = ratings.filter((r) => r.entry_date === day.date);
  const gamesToday = games.filter((g) => g.played_at === day.date);
  const puzzlesToday = puzzles.filter((p) => p.session_date === day.date);
  const studyToday = study.filter((s) => s.entry_date === day.date);
  const journalToday = journal.filter((j) => j.entry_date === day.date);
  const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1">
            {day.intensity > 0 ? "An active day" : "A quiet day"}
          </p>
          <h3 className="font-display text-2xl text-ink leading-tight">{dateLabel}</h3>
        </div>
        <button onClick={onClose} className="text-[11px] tracking-[0.22em] uppercase text-ink/55 hover:text-emerald transition-colors">
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MiniStat label="Games" value={day.games} />
        <MiniStat label="Puzzles" value={day.puzzles} />
        <MiniStat label="Study" value={`${day.studyMin}m`} />
        <MiniStat label="Journal" value={day.journal} />
        <MiniStat label="Δ Rating" value={day.ratingDelta === null ? "—" : day.ratingDelta > 0 ? `+${day.ratingDelta}` : `${day.ratingDelta}`} />
      </div>

      {day.intensity === 0 ? (
        <p className="font-serif-quote italic text-ink/60 text-sm text-center py-4">
          No activity logged. Even a single puzzle would have brightened this square.
        </p>
      ) : (
        <div className="space-y-5">
          {ratingsToday.length > 0 && (
            <DetailGroup title="Rating" items={ratingsToday.map((r) => `${r.format} · ${r.rating}${r.notes ? ` — ${r.notes}` : ""}`)} />
          )}
          {gamesToday.length > 0 && (
            <DetailGroup title="Games" items={gamesToday.map((g) => `vs ${g.opponent} — ${g.result} (${g.opening})`)} />
          )}
          {puzzlesToday.length > 0 && (
            <DetailGroup title="Puzzles" items={puzzlesToday.map((p) => `${p.count} solved · ${p.accuracy ?? "—"}% accuracy · ${p.minutes ?? "—"} min`)} />
          )}
          {studyToday.length > 0 && (
            <DetailGroup title="Study" items={studyToday.map((s) => `${s.kind.replace("_", " ")} · ${s.minutes} min${s.topic ? ` · ${s.topic}` : ""}`)} />
          )}
          {journalToday.length > 0 && (
            <DetailGroup title="Journal" items={journalToday.map((j) => `${j.kind}${j.title ? ` · ${j.title}` : ""}`)} />
          )}
        </div>
      )}
    </>
  );
}

function DetailGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.22em] uppercase text-gold-deep font-medium mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="font-serif-quote italic text-[13.5px] text-ink/75 pl-4 border-l-2 border-emerald/30">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-ivory/60 border border-gold/30 rounded-sm p-3 text-center">
      <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55">{label}</p>
      <p className="font-display text-xl text-emerald leading-none mt-1">{value}</p>
    </div>
  );
}

function Stat({ label, value, piece }: { label: string; value: number | string; piece: string }) {
  return (
    <article className="relative bg-white border border-gold/45 rounded-sm p-5 hover:border-emerald transition-colors group">
      <CornerBrackets small />
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 font-medium">{label}</p>
        <span className="font-display text-xl text-gold-deep group-hover:text-emerald transition-colors leading-none">{piece}</span>
      </div>
      <p className="font-display text-3xl text-emerald leading-none">{value}</p>
    </article>
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

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}>
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-12 w-72 bg-ink/10 rounded" />
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-24 bg-white border border-gold/30 rounded-sm" />))}
      </div>
      <div className="h-72 bg-white border border-gold/30 rounded-sm" />
    </div>
  );
}
