"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Minus,
  Plus,
  Search,
} from "lucide-react";

import {
  LogGameModal,
  type GameFormat,
  type GameResult,
  type LoggedGame,
} from "@/components/games/log-game-modal";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Games Log + Opening Explorer (Page 5)
//  A grandmaster's notebook
// ─────────────────────────────────────────────────────────────

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

// ─── Decorative atoms ───
function GoldStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1.5l2.65 6.95L22 9.6l-5.5 5.05L18 22l-6-3.6L6 22l1.5-7.35L2 9.6l7.35-1.15z"
        fill="currentColor"
      />
    </svg>
  );
}

function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
      <path
        d="M2 8l5 8h18l5-8-6 4-4-8-4 6-4-6-4 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="8" r="1.6" fill="currentColor" />
      <circle cx="16" cy="2" r="1.6" fill="currentColor" />
      <circle cx="30" cy="8" r="1.6" fill="currentColor" />
      <line x1="4" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Fleur({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6zM3 12c3 1 4 3 6 3 1.5 0 2.5-1 2.5-3S10.5 9 9 9c-2 0-3 2-6 3zm18 0c-3-1-5-3-6-3-1.5 0-2.5 1-2.5 3s1 3 2.5 3c1 0 3-2 6-3zM12 13c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

// ─── Sample seed data ─────────────────────────────────────────
const SEED_GAMES: LoggedGame[] = [
  {
    id: "g1",
    opponent: "M. Goldberg",
    date: "2026-06-19",
    platform: "Chess.com",
    result: "win",
    opening: "Italian Game",
    accuracy: 87,
    timeControl: "10+0",
    format: "Rapid",
    blunders: 1, mistakes: 3, brilliant: 2, missedWins: 0,
    notes: "Sharp Italian — found the right tactical motif on move 24.",
  },
  {
    id: "g2",
    opponent: "L. Petrov",
    date: "2026-06-18",
    platform: "Chess.com",
    result: "loss",
    opening: "Sicilian Defense",
    accuracy: 74,
    timeControl: "5+3",
    format: "Blitz",
    blunders: 3, mistakes: 5, brilliant: 0, missedWins: 1,
    notes: "Walked into a Najdorf line I didn't know. Need to drill 6.Bg5.",
  },
  {
    id: "g3",
    opponent: "A. Karim",
    date: "2026-06-17",
    platform: "Lichess",
    result: "draw",
    opening: "Queen's Gambit",
    accuracy: 81,
    timeControl: "10+0",
    format: "Rapid",
    blunders: 1, mistakes: 2, brilliant: 1, missedWins: 1,
    notes: "Held a tough endgame with opposite-coloured bishops.",
  },
  {
    id: "g4",
    opponent: "R. Suzuki",
    date: "2026-06-16",
    platform: "Chess.com",
    result: "win",
    opening: "London System",
    accuracy: 89,
    timeControl: "10+0",
    format: "Rapid",
    blunders: 0, mistakes: 2, brilliant: 3, missedWins: 0,
    notes: "Classic London setup, won with a kingside attack.",
  },
  {
    id: "g5",
    opponent: "K. Smith",
    date: "2026-06-15",
    platform: "Chess.com",
    result: "loss",
    opening: "French Defense",
    accuracy: 71,
    timeControl: "3+2",
    format: "Blitz",
    blunders: 4, mistakes: 6, brilliant: 0, missedWins: 0,
    notes: "Lost the thread in the middlegame. Time trouble.",
  },
  {
    id: "g6",
    opponent: "T. Mendoza",
    date: "2026-06-14",
    platform: "OTB",
    result: "win",
    opening: "Caro-Kann",
    accuracy: 84,
    timeControl: "30+30",
    format: "Rapid",
    blunders: 0, mistakes: 1, brilliant: 1, missedWins: 0,
    notes: "Solid Caro-Kann. Converted a pawn-up endgame cleanly.",
  },
  {
    id: "g7",
    opponent: "Y. Park",
    date: "2026-06-12",
    platform: "Chess.com",
    result: "draw",
    opening: "Italian Game",
    accuracy: 79,
    timeControl: "5+3",
    format: "Blitz",
    blunders: 1, mistakes: 3, brilliant: 0, missedWins: 1,
    notes: "Should have pushed in the rook endgame.",
  },
  {
    id: "g8",
    opponent: "D. Almeida",
    date: "2026-06-11",
    platform: "Lichess",
    result: "win",
    opening: "Queen's Gambit",
    accuracy: 92,
    timeControl: "10+0",
    format: "Rapid",
    blunders: 0, mistakes: 1, brilliant: 4, missedWins: 0,
    notes: "Best game of the month. Brilliant exchange sacrifice on move 19.",
  },
];

// ─── Derive opening stats from games ─────────────────────────
interface OpeningStat {
  name: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  accuracy: number;
  winPct: number;
  lossPct: number;
  drawPct: number;
}

function aggregateOpenings(games: LoggedGame[]): OpeningStat[] {
  const map = new Map<string, { w: number; l: number; d: number; acc: number[]; n: number }>();
  for (const g of games) {
    const entry = map.get(g.opening) ?? { w: 0, l: 0, d: 0, acc: [], n: 0 };
    if (g.result === "win") entry.w++;
    else if (g.result === "loss") entry.l++;
    else entry.d++;
    entry.acc.push(g.accuracy);
    entry.n++;
    map.set(g.opening, entry);
  }
  return Array.from(map.entries()).map(([name, v]) => {
    const games = v.n;
    return {
      name,
      games,
      wins: v.w,
      losses: v.l,
      draws: v.d,
      accuracy: Math.round(v.acc.reduce((a, b) => a + b, 0) / Math.max(1, games)),
      winPct: Math.round((v.w / games) * 100),
      lossPct: Math.round((v.l / games) * 100),
      drawPct: Math.round((v.d / games) * 100),
    };
  });
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

type ResultFilter = "All" | "Wins" | "Losses" | "Draws";
type FormatFilter = "All Formats" | GameFormat;

export default function GamesPage() {
  const [games, setGames] = useState<LoggedGame[]>(SEED_GAMES);
  const [modalOpen, setModalOpen] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("All");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("All Formats");
  const [search, setSearch] = useState("");

  // Filtered list for the journal view
  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (resultFilter === "Wins" && g.result !== "win") return false;
      if (resultFilter === "Losses" && g.result !== "loss") return false;
      if (resultFilter === "Draws" && g.result !== "draw") return false;
      if (formatFilter !== "All Formats" && g.format !== formatFilter) return false;
      if (search && !g.opening.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [games, resultFilter, formatFilter, search]);

  // Top stats across ALL games (not filtered)
  const stats = useMemo(() => computeStats(games), [games]);
  const openings = useMemo(() => aggregateOpenings(games), [games]);
  const weakOpenings = openings.filter((o) => o.winPct < 35 && o.games >= 3);
  const bestOpenings = [...openings]
    .filter((o) => o.games >= 3)
    .sort((a, b) => b.winPct - a.winPct)
    .slice(0, 3);

  const handleSaved = (g: LoggedGame) => {
    setGames((prev) => [g, ...prev]);
  };

  return (
    <div className="relative bg-ivory">
      {/* Background engravings */}
      <span
        className="pointer-events-none absolute top-32 -left-12 font-display text-emerald/[0.04] leading-none select-none hidden lg:block"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>
      <span
        className="pointer-events-none absolute top-[55%] -right-10 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "22rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </span>
      <GoldStar className="absolute top-40 right-[16%] size-3 text-gold opacity-50 hidden md:block" />
      <GoldStar className="absolute top-[60%] left-[8%] size-2 text-gold opacity-50 hidden md:block" />
      <Crown className="absolute top-20 right-[34%] w-7 h-5 text-gold-deep opacity-30 hidden lg:block" />

      {/* Vertical piece rail on the right edge */}
      <VerticalPieceRail />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-12">
        <PageHeader onAdd={() => setModalOpen(true)} />

        <FadeUp>
          <StatCardsRow stats={stats} />
        </FadeUp>

        <FadeUp delay={0.05}>
          <FilterBar
            resultFilter={resultFilter}
            onResultFilter={setResultFilter}
            formatFilter={formatFilter}
            onFormatFilter={setFormatFilter}
            search={search}
            onSearch={setSearch}
          />
        </FadeUp>

        <FadeUp delay={0.05}>
          <GameHistoryList
            games={filtered}
            totalCount={games.length}
            onAdd={() => setModalOpen(true)}
          />
        </FadeUp>

        {/* Opening Explorer */}
        <FadeUp>
          <OpeningExplorerHeader />
        </FadeUp>

        <FadeUp delay={0.05}>
          <OpeningGrid openings={openings} />
        </FadeUp>

        <div className="grid lg:grid-cols-12 gap-8">
          <FadeUp className="lg:col-span-7">
            <WeakOpeningsSection openings={weakOpenings} />
          </FadeUp>
          <FadeUp delay={0.05} className="lg:col-span-5">
            <BestOpeningsSection openings={bestOpenings} />
          </FadeUp>
        </div>

        <FadeUp>
          <OpeningPerformanceChart openings={openings} />
        </FadeUp>

        <FadeUp delay={0.05}>
          <InsightsSection games={games} openings={openings} />
        </FadeUp>

        <FadeUp>
          <QuoteSection />
        </FadeUp>
      </div>

      <LogGameModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="relative pb-6 border-b border-gold/30">
      <span
        className="pointer-events-none absolute -top-8 left-2 font-display text-gold/15 leading-none select-none hidden md:block"
        style={{ fontSize: "13rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
            Chapter Three
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
            <span className="italic text-emerald">Games</span> Log
          </h1>
          <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
            &ldquo;Every game leaves behind a lesson.&rdquo;
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Log New Game
          <span
            className="text-gold transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
//  STATS — 6 cards
// ─────────────────────────────────────────────────────────────

interface Stats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  accuracy: number;
  brilliant: number;
  mostPlayed: string;
  longestWinStreak: number;
}

function computeStats(games: LoggedGame[]): Stats {
  const total = games.length;
  const wins = games.filter((g) => g.result === "win").length;
  const losses = games.filter((g) => g.result === "loss").length;
  const draws = games.filter((g) => g.result === "draw").length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const accuracy = total
    ? Math.round(games.reduce((a, g) => a + g.accuracy, 0) / total)
    : 0;
  const brilliant = games.reduce((a, g) => a + g.brilliant, 0);

  // Most played opening
  const counts = new Map<string, number>();
  for (const g of games) counts.set(g.opening, (counts.get(g.opening) ?? 0) + 1);
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const mostPlayed = sorted[0]?.[0] ?? "—";

  // Longest win streak — newest first in the list, so iterate in chronological order
  const chrono = [...games].sort((a, b) => a.date.localeCompare(b.date));
  let cur = 0;
  let max = 0;
  for (const g of chrono) {
    if (g.result === "win") {
      cur++;
      max = Math.max(max, cur);
    } else cur = 0;
  }

  return {
    total,
    wins,
    losses,
    draws,
    winRate,
    accuracy,
    brilliant,
    mostPlayed,
    longestWinStreak: max,
  };
}

function StatCardsRow({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Games",       value: stats.total,                  sub: `${stats.wins}W · ${stats.losses}L · ${stats.draws}D`, piece: PIECES.pawn },
    { label: "Win Rate",          value: `${stats.winRate}%`,          sub: "Across all games",        piece: PIECES.queen },
    { label: "Avg. Accuracy",     value: `${stats.accuracy}%`,         sub: "Engine evaluation",       piece: PIECES.bishop },
    { label: "Brilliant Moves",   value: stats.brilliant,              sub: "All games",               piece: PIECES.knight },
    { label: "Most Played",       value: stats.mostPlayed,             sub: "Favourite opening",       piece: PIECES.rook,  isText: true },
    { label: "Longest Win Streak", value: `${stats.longestWinStreak}`, sub: stats.longestWinStreak === 1 ? "game" : "games", piece: PIECES.king },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
      {cards.map((c, i) => (
        <motion.article
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 0.85, 0.36, 1] }}
          className="group relative bg-white border border-gold/45 rounded-sm p-5 hover:-translate-y-0.5 hover:border-emerald hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.25)] transition-all"
        >
          <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
          <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
          <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
          <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 font-medium">
              {c.label}
            </p>
            <span
              className="font-display text-2xl text-gold-deep group-hover:text-emerald transition-colors leading-none"
              aria-hidden="true"
            >
              {c.piece}
            </span>
          </div>
          <p className={`font-display ${c.isText ? "text-xl" : "text-3xl"} text-emerald leading-none ${c.isText ? "truncate" : ""}`}>
            {c.value}
          </p>
          <p className="mt-2.5 font-serif-quote italic text-[12px] text-ink/55">
            {c.sub}
          </p>
        </motion.article>
      ))}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  FILTER BAR
// ─────────────────────────────────────────────────────────────

const RESULT_FILTERS: ResultFilter[] = ["All", "Wins", "Losses", "Draws"];
const FORMAT_FILTERS: FormatFilter[] = ["All Formats", "Rapid", "Blitz", "Bullet"];

function FilterBar({
  resultFilter,
  onResultFilter,
  formatFilter,
  onFormatFilter,
  search,
  onSearch,
}: {
  resultFilter: ResultFilter;
  onResultFilter: (v: ResultFilter) => void;
  formatFilter: FormatFilter;
  onFormatFilter: (v: FormatFilter) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      {/* Result tabs */}
      <div className="inline-flex p-1.5 bg-white border border-gold/45 rounded-sm">
        {RESULT_FILTERS.map((r) => {
          const active = r === resultFilter;
          return (
            <button
              key={r}
              onClick={() => onResultFilter(r)}
              className="relative px-4 md:px-5 py-2 text-[11px] tracking-[0.24em] uppercase font-medium transition-colors z-10"
            >
              {active && (
                <motion.span
                  layoutId="result-tab-pill"
                  className="absolute inset-0 bg-emerald border border-gold rounded-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={active ? "text-ivory" : "text-ink/65 hover:text-emerald transition-colors"}>
                {r === "All" ? "All Games" : r}
              </span>
            </button>
          );
        })}
      </div>

      {/* Format tabs */}
      <div className="inline-flex p-1.5 bg-white border border-gold/45 rounded-sm">
        {FORMAT_FILTERS.map((f) => {
          const active = f === formatFilter;
          return (
            <button
              key={f}
              onClick={() => onFormatFilter(f)}
              className="relative px-4 md:px-5 py-2 text-[11px] tracking-[0.24em] uppercase font-medium transition-colors z-10"
            >
              {active && (
                <motion.span
                  layoutId="format-tab-pill"
                  className="absolute inset-0 bg-emerald border border-gold rounded-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={active ? "text-ivory" : "text-ink/65 hover:text-emerald transition-colors"}>
                {f === "All Formats" ? "All" : f}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative lg:ml-auto flex-1 lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/45" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by opening…"
          className="w-full h-11 pl-10 pr-4 bg-white border border-gold/45 text-[14px] text-ink font-sans placeholder:text-ink/40 placeholder:italic focus:outline-none focus:border-emerald rounded-sm transition-colors"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  GAME HISTORY LIST
// ─────────────────────────────────────────────────────────────

const RESULT_TONES = {
  win: {
    card: "bg-emerald/[0.05] border-emerald/35 hover:border-emerald",
    bar: "bg-emerald",
    chip: "bg-emerald text-ivory",
    text: "text-emerald-deep",
  },
  loss: {
    card: "bg-gold-light/35 border-gold-deep/30 hover:border-gold-deep",
    bar: "bg-gold-deep",
    chip: "bg-gold-deep text-ivory",
    text: "text-gold-deep",
  },
  draw: {
    card: "bg-ivory border-ink/15 hover:border-ink/40",
    bar: "bg-ink/40",
    chip: "bg-ink text-ivory",
    text: "text-ink/70",
  },
} as const;

function GameHistoryList({
  games,
  totalCount,
  onAdd,
}: {
  games: LoggedGame[];
  totalCount: number;
  onAdd: () => void;
}) {
  if (games.length === 0) {
    return (
      <section>
        <SectionHeading
          eyebrow="The Notebook"
          title="Game history"
          action={
            <span className="text-[11px] tracking-[0.22em] uppercase text-ink/50">
              {totalCount} total
            </span>
          }
        />
        <div className="relative bg-white border border-dashed border-gold/45 rounded-sm p-12 text-center">
          <span
            className="font-display text-5xl text-gold-deep/40 leading-none"
            aria-hidden="true"
          >
            {PIECES.knight}
          </span>
          <p className="mt-4 font-display text-xl text-ink">
            No games match those filters
          </p>
          <p className="mt-2 font-serif-quote italic text-ink/60 text-sm max-w-sm mx-auto">
            Try a different combination — or log a fresh one.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-6 inline-flex items-center gap-2 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors"
          >
            <Plus className="w-4 h-4 text-gold" />
            Log a Game
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading
        eyebrow="The Notebook"
        title="Game history"
        action={
          <span className="text-[11px] tracking-[0.22em] uppercase text-ink/50">
            {games.length} of {totalCount}
          </span>
        }
      />
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {games.map((g, i) => (
            <motion.li
              key={g.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, delay: i * 0.03, ease: [0.22, 0.85, 0.36, 1] }}
            >
              <GameCard game={g} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

function GameCard({ game }: { game: LoggedGame }) {
  const [open, setOpen] = useState(false);
  const tone = RESULT_TONES[game.result];

  const dateLabel = new Date(game.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <article
      className={`relative border rounded-sm overflow-hidden transition-colors ${tone.card}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left flex items-stretch"
      >
        <div className={`w-[3px] ${tone.bar}`} aria-hidden="true" />
        <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] tracking-[0.28em] uppercase font-medium px-2 py-0.5 ${tone.chip} rounded-sm`}
              >
                {game.result}
              </span>
              <span className="font-serif-quote italic text-gold-deep text-[12px]">
                {dateLabel}
              </span>
              <span className="text-[10px] tracking-[0.22em] uppercase text-ink/45 px-2 py-0.5 bg-ivory border border-gold/30 rounded-sm">
                {game.format} · {game.timeControl}
              </span>
              <span className="text-[10px] tracking-[0.22em] uppercase text-ink/45">
                {game.platform}
              </span>
            </div>
            <h3 className="font-display text-xl text-ink leading-tight">
              vs. <span className="italic">{game.opponent}</span>
            </h3>
            <p className="mt-1 text-[13px] text-ink/65">
              <span className="text-gold-deep">{game.opening}</span>
              {" · "}
              Accuracy{" "}
              <span className={`font-display text-base ${tone.text}`}>
                {game.accuracy}
              </span>
              %
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="flex gap-4 text-center">
              <MiniStat label="Blunders" value={game.blunders} tone={game.blunders > 2 ? "loss" : "ink"} />
              <MiniStat label="Brilliant" value={game.brilliant} tone={game.brilliant > 0 ? "win" : "ink"} />
            </div>
            <ChevronDown
              className={`w-4 h-4 text-ink/55 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded panel — turns like a page */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.85, 0.36, 1] }}
            className="relative overflow-hidden"
            style={{ transformOrigin: "top" }}
          >
            <div className="relative px-7 pb-6 pt-2 border-t border-gold/30">
              {/* Bishop watermark */}
              <span
                className="absolute -bottom-10 -right-6 font-display text-ink/[0.05] leading-none select-none pointer-events-none"
                style={{ fontSize: "12rem" }}
                aria-hidden="true"
              >
                {PIECES.bishop}
              </span>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-px w-12 bg-gold-deep/40" />
                <Fleur className="size-3.5 text-gold-deep" />
                <span className="h-px w-12 bg-gold-deep/40" />
              </div>

              <div className="relative grid md:grid-cols-2 gap-7">
                <div className="space-y-3.5">
                  <BarLine label="Accuracy" value={game.accuracy} max={100} tone="emerald" suffix="%" />
                  <BarLine label="Brilliant Moves" value={game.brilliant} max={5} tone="gold" />
                  <BarLine label="Blunders" value={game.blunders} max={5} tone="loss" />
                  <BarLine label="Mistakes" value={game.mistakes} max={6} tone="muted" />
                  <BarLine label="Missed Wins" value={game.missedWins} max={3} tone="loss" />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] tracking-[0.24em] uppercase text-gold-deep">
                    Notes from the scorebook
                  </p>
                  {game.notes ? (
                    <p className="font-serif-quote italic text-[15px] text-ink/80 leading-snug">
                      &ldquo;{game.notes}&rdquo;
                    </p>
                  ) : (
                    <p className="font-serif-quote italic text-[14px] text-ink/45">
                      No notes recorded for this game.
                    </p>
                  )}
                  <div className="pt-3 border-t border-gold/25 flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-ink/55">
                    <span>
                      Format · <span className="text-emerald">{game.format}</span>
                    </span>
                    <span>
                      Platform · <span className="text-emerald">{game.platform}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "win" | "loss" | "ink";
}) {
  const color =
    tone === "win" ? "text-emerald" : tone === "loss" ? "text-gold-deep" : "text-ink";
  return (
    <div>
      <p className={`font-display text-xl leading-none ${color}`}>{value}</p>
      <p className="text-[9px] tracking-[0.22em] uppercase text-ink/50 mt-1">
        {label}
      </p>
    </div>
  );
}

function BarLine({
  label,
  value,
  max,
  tone,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  tone: "emerald" | "gold" | "loss" | "muted";
  suffix?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colour =
    tone === "emerald"
      ? "bg-emerald"
      : tone === "gold"
        ? "bg-gold"
        : tone === "loss"
          ? "bg-gold-deep"
          : "bg-ink/40";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">
          {label}
        </p>
        <p className="font-display text-base text-ink leading-none">
          {value}
          {suffix}
        </p>
      </div>
      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full ${colour}`}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  OPENING EXPLORER
// ─────────────────────────────────────────────────────────────

function OpeningExplorerHeader() {
  return (
    <header className="relative pt-6 pb-3 text-center">
      {/* Queen watermark */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-gold/15 leading-none select-none"
        style={{ fontSize: "16rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <div className="relative">
        <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-3">
          Part Two
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-ink leading-tight">
          <span className="italic text-emerald">Opening</span> Explorer
        </h2>
        <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl mx-auto">
          Understand your opening repertoire.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-gold-deep/55" />
            <Fleur className="size-4 text-gold-deep" />
            <span className="h-px w-12 bg-gold-deep/55" />
          </div>
        </div>
      </div>
    </header>
  );
}

function OpeningGrid({ openings }: { openings: OpeningStat[] }) {
  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {openings.map((o, i) => (
        <motion.article
          key={o.name}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className={`group relative bg-white border rounded-sm p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.2)] ${
            o.winPct < 35
              ? "border-destructive/30 hover:border-destructive/55"
              : o.winPct >= 60
                ? "border-emerald/45 hover:border-emerald"
                : "border-gold/45 hover:border-gold-deep"
          }`}
        >
          <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
          <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
          <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
          <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

          <div className="flex items-start gap-4">
            <OpeningDonut win={o.winPct} loss={o.lossPct} draw={o.drawPct} size={68} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">
                {o.games} games
              </p>
              <h3 className="font-display text-lg text-ink leading-tight mt-1">
                {o.name}
              </h3>
              <p className="font-serif-quote italic text-[12px] text-gold-deep mt-1">
                Avg. accuracy{" "}
                <span className="font-display not-italic text-emerald text-base ml-0.5">
                  {o.accuracy}%
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <RatioCell label="Win"  value={o.winPct}  tone="win"  />
            <RatioCell label="Draw" value={o.drawPct} tone="draw" />
            <RatioCell label="Loss" value={o.lossPct} tone="loss" />
          </div>
        </motion.article>
      ))}
    </section>
  );
}

function RatioCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "win" | "loss" | "draw";
}) {
  const colour =
    tone === "win"
      ? "text-emerald"
      : tone === "loss"
        ? "text-destructive"
        : "text-gold-deep";
  return (
    <div className="bg-ivory/60 border border-gold/30 rounded-sm py-2">
      <p className={`font-display text-base leading-none ${colour}`}>{value}%</p>
      <p className="text-[9px] tracking-[0.22em] uppercase text-ink/50 mt-1">
        {label}
      </p>
    </div>
  );
}

function OpeningDonut({
  win,
  loss,
  draw,
  size = 56,
}: {
  win: number;
  loss: number;
  draw: number;
  size?: number;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const winLen = (win / 100) * c;
  const lossLen = (loss / 100) * c;
  const drawLen = (draw / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      aria-hidden="true"
      className="shrink-0 -rotate-90"
    >
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(17,17,17,0.08)" strokeWidth="6" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke="#0E5A3C" strokeWidth="6"
        strokeDasharray={`${winLen} ${c - winLen}`}
        strokeDashoffset={0}
        strokeLinecap="butt"
      />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke="#E6C46A" strokeWidth="6"
        strokeDasharray={`${drawLen} ${c - drawLen}`}
        strokeDashoffset={-winLen}
        strokeLinecap="butt"
      />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke="#B7411E" strokeWidth="6"
        strokeDasharray={`${lossLen} ${c - lossLen}`}
        strokeDashoffset={-(winLen + drawLen)}
        strokeLinecap="butt"
        opacity="0.7"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  WEAK OPENINGS
// ─────────────────────────────────────────────────────────────

function WeakOpeningsSection({ openings }: { openings: OpeningStat[] }) {
  return (
    <section className="relative">
      <SectionHeading
        eyebrow="A Closer Look"
        title="Openings to improve"
        compact
      />

      <div className="relative">
        <span
          className="pointer-events-none absolute -top-2 -right-4 font-display text-gold/15 leading-none select-none"
          style={{ fontSize: "13rem" }}
          aria-hidden="true"
        >
          {PIECES.rook}
        </span>

        {openings.length === 0 ? (
          <div className="bg-emerald/[0.05] border border-emerald/30 rounded-sm p-7 text-center">
            <span
              className="font-display text-3xl text-emerald leading-none"
              aria-hidden="true"
            >
              {PIECES.queen}
            </span>
            <p className="mt-3 font-display text-xl text-ink">
              No weak openings detected
            </p>
            <p className="mt-1 font-serif-quote italic text-ink/60 text-sm">
              Every opening you&apos;ve played enough is above 35% win rate.
            </p>
          </div>
        ) : (
          <ul className="relative space-y-3">
            {openings.map((o, i) => (
              <motion.li
                key={o.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-stretch bg-gold-light/40 border border-gold-deep/40 rounded-sm overflow-hidden"
              >
                <div className="w-1 bg-gold-deep" aria-hidden="true" />
                <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] tracking-[0.28em] uppercase font-medium text-gold-deep">
                        Needs Study
                      </span>
                      <span className="font-serif-quote italic text-ink/55 text-[12px]">
                        {o.games} games
                      </span>
                    </div>
                    <h3 className="font-display text-xl text-ink leading-tight">
                      {o.name}
                    </h3>
                    <p className="mt-1 font-serif-quote italic text-[13px] text-ink/70 leading-snug">
                      Losing more often than winning here — a fresh dose of theory
                      will move the needle.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-3xl text-destructive leading-none">
                      {o.winPct}%
                    </p>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-ink/45 mt-1">
                      Win rate
                    </p>
                    <p className="mt-3 text-[10px] tracking-[0.22em] uppercase text-gold-deep">
                      High Priority
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  BEST OPENINGS — top 3 trophy cards
// ─────────────────────────────────────────────────────────────

function BestOpeningsSection({ openings }: { openings: OpeningStat[] }) {
  return (
    <section className="relative">
      <SectionHeading eyebrow="Hall of Fame" title="Your best openings" compact />
      <div className="relative">
        <Crown className="absolute -top-2 right-2 w-16 h-10 text-gold-deep/30" aria-hidden="true" />
        {openings.length === 0 ? (
          <div className="bg-white border border-dashed border-gold/40 rounded-sm p-6 text-center">
            <p className="font-serif-quote italic text-ink/60 text-sm">
              Play more games in your favourite openings to see them crowned here.
            </p>
          </div>
        ) : (
          <div className="relative grid grid-cols-1 gap-3">
            {openings.map((o, i) => (
              <motion.article
                key={o.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative bg-gold-light/45 border border-gold-deep/40 rounded-sm p-4 hover:bg-gold-light/65 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-emerald text-gold flex items-center justify-center shrink-0 font-display text-xl border-2 border-gold">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg text-ink leading-tight">
                      {o.name}
                    </h3>
                    <p className="font-serif-quote italic text-[12px] text-gold-deep mt-0.5">
                      {o.games} games · Avg. accuracy {o.accuracy}%
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-2xl text-emerald leading-none">
                      {o.winPct}%
                    </p>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55 mt-1">
                      Win rate
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  OPENING PERFORMANCE CHART
// ─────────────────────────────────────────────────────────────

function OpeningPerformanceChart({ openings }: { openings: OpeningStat[] }) {
  const data = openings.map((o) => ({
    name: o.name.length > 14 ? o.name.slice(0, 14) + "…" : o.name,
    Win: o.winPct,
    Draw: o.drawPct,
    Loss: o.lossPct,
  }));

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <SectionHeading
        eyebrow="Performance"
        title="Opening, side by side"
        compact
      />

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(184, 146, 63, 0.15)" strokeDasharray="2 6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
              stroke="rgba(184, 146, 63, 0.4)"
              tickLine={false}
              interval={0}
              angle={-12}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
              stroke="rgba(184, 146, 63, 0.4)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FAF8F2",
                border: "1px solid #E6C46A",
                borderRadius: "2px",
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              labelStyle={{
                fontFamily: "var(--font-playfair)",
                fontWeight: 600,
                color: "#0E5A3C",
              }}
              cursor={{ fill: "rgba(14,90,60,0.05)" }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                color: "#4A463F",
                paddingTop: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            />
            <Bar dataKey="Win"  stackId="a" fill="#0E5A3C" />
            <Bar dataKey="Draw" stackId="a" fill="#E6C46A" />
            <Bar dataKey="Loss" stackId="a" fill="#B7411E" fillOpacity={0.75} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  INSIGHTS
// ─────────────────────────────────────────────────────────────

function InsightsSection({
  games,
  openings,
}: {
  games: LoggedGame[];
  openings: OpeningStat[];
}) {
  const mostSuccessful = useMemo(() => {
    const candidates = openings.filter((o) => o.games >= 2);
    return [...candidates].sort((a, b) => b.winPct - a.winPct)[0];
  }, [openings]);

  const mostAggressive = useMemo(() => {
    // Most brilliant moves per game on average
    const counts = new Map<string, { brilliant: number; n: number }>();
    for (const g of games) {
      const e = counts.get(g.opening) ?? { brilliant: 0, n: 0 };
      e.brilliant += g.brilliant;
      e.n++;
      counts.set(g.opening, e);
    }
    return [...counts.entries()]
      .map(([name, v]) => ({ name, avg: v.brilliant / Math.max(1, v.n) }))
      .sort((a, b) => b.avg - a.avg)[0];
  }, [games]);

  const highestAccuracy = useMemo(() => {
    return [...games].sort((a, b) => b.accuracy - a.accuracy)[0];
  }, [games]);

  const biggestBlunderGame = useMemo(() => {
    return [...games].sort((a, b) => b.blunders - a.blunders)[0];
  }, [games]);

  const favoriteTC = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games) counts.set(g.timeControl, (counts.get(g.timeControl) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [games]);

  const cards = [
    {
      title: "Most Successful Opening",
      label: mostSuccessful?.name ?? "—",
      sub: mostSuccessful ? `${mostSuccessful.winPct}% over ${mostSuccessful.games} games` : "Need more data",
      piece: PIECES.queen,
    },
    {
      title: "Most Aggressive Opening",
      label: mostAggressive?.name ?? "—",
      sub: mostAggressive ? `Avg. ${mostAggressive.avg.toFixed(1)} brilliant moves` : "Need more data",
      piece: PIECES.knight,
    },
    {
      title: "Highest Accuracy Game",
      label: highestAccuracy ? `${highestAccuracy.accuracy}%` : "—",
      sub: highestAccuracy ? `vs. ${highestAccuracy.opponent}` : "Need games",
      piece: PIECES.bishop,
    },
    {
      title: "Biggest Blunder Count",
      label: biggestBlunderGame ? `${biggestBlunderGame.blunders} blunders` : "—",
      sub: biggestBlunderGame ? `${biggestBlunderGame.opening}` : "Need games",
      piece: PIECES.rook,
    },
    {
      title: "Favourite Time Control",
      label: favoriteTC,
      sub: "Most logged",
      piece: PIECES.king,
    },
  ];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-10 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      {/* Queen engraving */}
      <span
        className="absolute -bottom-12 -right-6 font-display text-emerald/[0.07] leading-none select-none pointer-events-none"
        style={{ fontSize: "24rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <SectionHeading
        eyebrow="Insights"
        title="What the games whisper"
      />

      <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="bg-ivory/60 border border-gold/35 rounded-sm p-5 hover:border-emerald hover:bg-emerald/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55 font-medium">
                {c.title}
              </p>
              <span
                className="font-display text-xl text-gold-deep leading-none"
                aria-hidden="true"
              >
                {c.piece}
              </span>
            </div>
            <p className="font-display text-lg text-ink leading-tight">
              {c.label}
            </p>
            <p className="mt-1 font-serif-quote italic text-[12px] text-gold-deep">
              {c.sub}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  QUOTE
// ─────────────────────────────────────────────────────────────

function QuoteSection() {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-7">
          <span className="h-px w-12 bg-gold-deep/55" />
          <Fleur className="size-4 text-gold-deep" />
          <span className="h-px w-12 bg-gold-deep/55" />
        </div>
        <blockquote className="font-serif-quote italic text-2xl md:text-[2rem] leading-snug text-ink/85">
          &ldquo;In chess, as in life, opportunity strikes
          <br className="hidden md:block" /> but once.&rdquo;
        </blockquote>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold-deep/45" />
          <cite className="not-italic font-display tracking-[0.28em] uppercase text-[11px] text-gold-deep">
            A Chess Proverb
          </cite>
          <span className="h-px w-10 bg-gold-deep/45" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  VERTICAL DECORATIVE RAIL — Pawn → Queen on right edge
// ─────────────────────────────────────────────────────────────

function VerticalPieceRail() {
  const pieces = [
    { glyph: PIECES.pawn,   tone: "text-gold-deep" },
    { glyph: PIECES.knight, tone: "text-emerald"   },
    { glyph: PIECES.bishop, tone: "text-gold-deep" },
    { glyph: PIECES.rook,   tone: "text-emerald"   },
    { glyph: PIECES.queen,  tone: "text-gold-deep" },
  ];
  return (
    <aside
      className="hidden xl:flex fixed top-1/2 right-4 -translate-y-1/2 flex-col items-center gap-5 z-10 pointer-events-none opacity-80"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <React.Fragment key={i}>
          <span className={`font-display text-3xl leading-none ${p.tone}`}>
            {p.glyph}
          </span>
          {i < pieces.length - 1 && (
            <span className="block h-5 w-px bg-gold/45" />
          )}
        </React.Fragment>
      ))}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shared atoms
// ─────────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
  action,
  compact,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${compact ? "mb-5" : "mb-6"}`}>
      <div>
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">
          {eyebrow}
        </p>
        <h2 className={`font-display ${compact ? "text-xl" : "text-2xl"} text-ink leading-tight`}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
