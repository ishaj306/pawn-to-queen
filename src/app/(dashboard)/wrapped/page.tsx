"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Printer, ChevronDown, Check } from "lucide-react";

import { getWrapped, getWrappedYears, type WrappedData } from "@/features/wrapped/actions";
import type { JournalMood } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Chess Wrapped — an annual illuminated-manuscript recap.
//  A shareable, scroll-revealed story of the player's year.
// ─────────────────────────────────────────────────────────────

const PIECES = { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" };
const TITLE_PIECE: Record<string, string> = {
  Pawn: PIECES.pawn, Knight: PIECES.knight, Bishop: PIECES.bishop, Rook: PIECES.rook, Queen: PIECES.queen,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MOOD_META: Record<JournalMood, { label: string; glyph: string; color: string }> = {
  focused:    { label: "Focused",    glyph: "◎", color: "var(--emerald)" },
  excited:    { label: "Excited",    glyph: "✦", color: "var(--gold-deep)" },
  calm:       { label: "Calm",       glyph: "❍", color: "var(--emerald-light)" },
  curious:    { label: "Curious",    glyph: "✧", color: "var(--gold-deep)" },
  tired:      { label: "Tired",      glyph: "☾", color: "var(--text-muted)" },
  frustrated: { label: "Frustrated", glyph: "▲", color: "var(--danger)" },
};

// ─── Decorative atoms ───
function Fleur({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6zM3 12c3 1 4 3 6 3 1.5 0 2.5-1 2.5-3S10.5 9 9 9c-2 0-3 2-6 3zm18 0c-3-1-5-3-6-3-1.5 0-2.5 1-2.5 3s1 3 2.5 3c1 0 3-2 6-3zM12 13c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6z"
        fill="currentColor" opacity="0.85"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function ChapterLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-serif-quote italic text-gold-deep text-sm">{n}</span>
      <span className="h-px flex-1 bg-gold-deep/25" />
      <span className="text-[11px] tracking-[0.3em] uppercase text-gold-deep font-medium">{title}</span>
    </div>
  );
}

function BigStat({ value, label, sub }: { value: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="text-center px-4">
      <p className="font-display text-5xl md:text-6xl text-ink leading-none tabular-nums">{value}</p>
      <p className="mt-3 text-[11px] tracking-[0.24em] uppercase text-gold-deep">{label}</p>
      {sub && <p className="mt-1 font-serif-quote italic text-ink/60 text-sm">{sub}</p>}
    </div>
  );
}

export default function WrappedPage() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const yrs = await getWrappedYears();
      if (cancelled) return;
      setYears(yrs);
      setYear((y) => y ?? yrs[0] ?? new Date().getFullYear());
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (year === null) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await getWrapped(year);
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: `My ${year} Chess Wrapped`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed share sheet — ignore */
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex items-center gap-3 text-gold-deep">
          <span className="font-display text-3xl animate-float-slow" aria-hidden>{PIECES.queen}</span>
          <span className="font-serif-quote italic">Composing your year…</span>
        </div>
      </div>
    );
  }

  const d = data!;
  const deltaPositive = d.rating.delta >= 0;

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar — year switcher + share */}
      <div className="sticky top-0 z-30 bg-ivory/85 backdrop-blur-md border-b border-gold/25 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <div className="relative">
            <select
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-transparent font-display text-lg text-ink pr-6 focus:outline-none cursor-pointer"
              aria-label="Select year"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gold-deep absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={share}
              className="flex items-center gap-2 px-3.5 py-1.5 text-[12px] tracking-[0.15em] uppercase text-ink/80 hover:text-emerald transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Share"}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-1.5 text-[12px] tracking-[0.15em] uppercase text-ink/80 hover:text-emerald transition-colors"
              title="Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-28">
        {/* ── COVER ── */}
        <header className="pt-16 pb-14 text-center">
          <Fleur className="size-6 text-gold-deep mx-auto animate-float-slow" />
          <p className="mt-6 text-[12px] tracking-[0.4em] uppercase text-gold-deep">Pawn to Queen presents</p>
          <h1 className="mt-4 font-display text-6xl md:text-7xl text-ink leading-[0.95]">
            Chess <span className="italic text-emerald">Wrapped</span>
          </h1>
          <p className="mt-5 font-serif-quote italic text-xl text-ink/70">
            {d.year} — a year on the board
          </p>
          <div className="gold-divider max-w-xs mx-auto mt-8"><Fleur className="size-4 text-gold-deep shrink-0" /></div>
        </header>

        {!d.hasData ? (
          <div className="py-24 text-center">
            <span className="font-display text-6xl text-emerald/20" aria-hidden>{PIECES.pawn}</span>
            <p className="mt-6 font-display text-2xl text-ink">Your {d.year} is still unwritten.</p>
            <p className="mt-3 font-serif-quote italic text-ink/60 max-w-md mx-auto">
              Log a few games, ratings or journal entries this year and your Wrapped will compose itself.
            </p>
          </div>
        ) : (
          <div className="space-y-24">
            {/* ── CHAPTER I — Rating journey ── */}
            <Reveal>
              <ChapterLabel n="I" title="The Ascent" />
              <div className="grid grid-cols-3 gap-4 items-end">
                <BigStat value={d.rating.start ?? "—"} label="Began at" />
                <div className="text-center">
                  <p className={`font-display text-4xl leading-none ${deltaPositive ? "text-emerald" : "text-danger"}`}>
                    {deltaPositive ? "+" : ""}{d.rating.delta}
                  </p>
                  <p className="mt-2 text-[10px] tracking-[0.24em] uppercase text-gold-deep">Rating swing</p>
                </div>
                <BigStat value={d.rating.end ?? "—"} label="Ended at" />
              </div>
              <p className="mt-8 text-center font-serif-quote italic text-lg text-ink/75">
                {deltaPositive
                  ? `You climbed ${d.rating.delta} points across ${d.rating.entries} recorded moments${d.rating.peak ? `, peaking at ${d.rating.peak}` : ""}.`
                  : `A year of hard lessons — ${d.rating.entries} entries logged with honesty${d.rating.peak ? `, and a high of ${d.rating.peak}` : ""}.`}
              </p>
            </Reveal>

            {/* ── CHAPTER II — Battles ── */}
            <Reveal>
              <ChapterLabel n="II" title="Battles Fought" />
              <div className="flex items-center justify-center gap-8">
                <WinRing winRate={d.games.winRate} />
                <div className="space-y-2 text-left">
                  <LedgerRow label="Games" value={d.games.total} />
                  <LedgerRow label="Won" value={d.games.wins} accent="var(--emerald)" />
                  <LedgerRow label="Lost" value={d.games.losses} accent="var(--danger)" />
                  <LedgerRow label="Drawn" value={d.games.draws} />
                  {d.games.brilliancies > 0 && (
                    <LedgerRow label="Brilliancies" value={d.games.brilliancies} accent="var(--gold-deep)" glyph="✦" />
                  )}
                </div>
              </div>
            </Reveal>

            {/* ── CHAPTER III — Signature opening + nemesis ── */}
            {(d.games.bestOpening || d.games.nemesis) && (
              <Reveal>
                <ChapterLabel n="III" title="Your Signature" />
                <div className="grid md:grid-cols-2 gap-6">
                  {d.games.bestOpening && (
                    <Panel>
                      <p className="text-[11px] tracking-[0.24em] uppercase text-gold-deep">Best opening</p>
                      <p className="mt-3 font-display text-2xl text-ink leading-tight">{d.games.bestOpening.name}</p>
                      <p className="mt-2 font-serif-quote italic text-ink/60">{d.games.bestOpening.wins} wins flew from here.</p>
                    </Panel>
                  )}
                  {d.games.nemesis && (
                    <Panel>
                      <p className="text-[11px] tracking-[0.24em] uppercase text-gold-deep">Your nemesis</p>
                      <p className="mt-3 font-display text-2xl text-ink leading-tight">{d.games.nemesis.name}</p>
                      <p className="mt-2 font-serif-quote italic text-ink/60">Bested you {d.games.nemesis.losses} times. A rematch awaits.</p>
                    </Panel>
                  )}
                </div>
              </Reveal>
            )}

            {/* ── CHAPTER IV — Discipline (puzzles + study + streak) ── */}
            <Reveal>
              <ChapterLabel n="IV" title="Quiet Discipline" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <BigStat value={d.puzzles.solved.toLocaleString()} label="Puzzles solved" />
                <BigStat value={d.study.hours} label="Hours studied" sub={d.study.topKind ? `mostly ${d.study.topKind.replace("_", " ")}` : undefined} />
                <BigStat value={d.streak.longest} label="Longest streak" sub="days unbroken" />
                <BigStat value={d.puzzles.bestAccuracy !== null ? `${d.puzzles.bestAccuracy}%` : "—"} label="Best accuracy" />
              </div>
            </Reveal>

            {/* ── CHAPTER V — Mood arc (emotional analytics) ── */}
            {d.journal.moodArc.length > 0 && (
              <Reveal>
                <ChapterLabel n="V" title="The Inner Game" />
                <p className="text-center font-serif-quote italic text-lg text-ink/75 mb-8">
                  {d.journal.topMood
                    ? <>Your prevailing mood at the board was <span className="text-emerald not-italic font-medium">{MOOD_META[d.journal.topMood].label.toLowerCase()}</span>.</>
                    : "How the year felt, month by month."}
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {d.journal.moodArc.map((m) => {
                    const meta = MOOD_META[m.mood];
                    return (
                      <div key={m.month} className="flex flex-col items-center gap-1.5 w-14">
                        <span className="text-lg leading-none" style={{ color: meta.color }} aria-hidden>{meta.glyph}</span>
                        <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: meta.color }}>{meta.label}</span>
                        <span className="text-[10px] text-ink/45">{MONTHS[m.month]}</span>
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            )}

            {/* ── CHAPTER VI — Busiest month ── */}
            {d.busiestMonth && (
              <Reveal>
                <ChapterLabel n="VI" title="Deepest Devotion" />
                <p className="text-center font-serif-quote italic text-lg text-ink/75">
                  <span className="font-display not-italic text-2xl text-ink">{MONTHS[d.busiestMonth.month]}</span> was your most devoted month —{" "}
                  {d.busiestMonth.count} logged moments of study, play and reflection.
                </p>
              </Reveal>
            )}

            {/* ── CLOSING — title reveal ── */}
            <Reveal>
              <div className="text-center py-10 bg-gold-grid border border-gold/30 rounded-sm">
                <p className="text-[12px] tracking-[0.32em] uppercase text-gold-deep">This year you were a</p>
                <p className="mt-4 font-display text-7xl text-emerald leading-none" aria-hidden>
                  {TITLE_PIECE[d.rating.title] ?? PIECES.pawn}
                </p>
                <p className="mt-4 font-display text-5xl text-ink italic">{d.rating.title}</p>
                <p className="mt-5 font-serif-quote italic text-ink/60 max-w-sm mx-auto">
                  Every master was once a pawn. Here&rsquo;s to the next square.
                </p>
                <button
                  onClick={share}
                  className="mt-8 inline-flex items-center gap-2 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.22em] uppercase hover:bg-emerald-deep transition-colors print:hidden"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share your year
                </button>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface border border-gold/25 rounded-sm p-6">{children}</div>;
}

function LedgerRow({ label, value, accent, glyph }: { label: string; value: number; accent?: string; glyph?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-2xl tabular-nums w-12 text-right" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
      <span className="text-[12px] tracking-[0.16em] uppercase text-ink/60">
        {glyph && <span className="mr-1" style={accent ? { color: accent } : undefined}>{glyph}</span>}
        {label}
      </span>
    </div>
  );
}

function WinRing({ winRate }: { winRate: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (winRate / 100) * circ;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--gold-light)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--emerald)" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-ink leading-none">{winRate}%</span>
        <span className="text-[9px] tracking-[0.2em] uppercase text-gold-deep mt-1">Win rate</span>
      </div>
    </div>
  );
}
