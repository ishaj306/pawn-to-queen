"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CartesianGrid,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { getRatingEntries } from "@/features/ratings/actions";
import { FadeUp, GoldStar, Crown, Fleur } from "@/components/shared/decor";
import {
  calculateStreak,
  RATING_MILESTONES,
  titleFor,
  nextTitle,
  TITLE_JOURNEY,
  type DbRatingEntry,
} from "@/utils/stats";
import {
  decodeFormatFromNotes,
  RATING_FORMATS,
  type RatingFormat,
} from "@/lib/rating-format";
import { AddRatingModal } from "@/components/ratings/add-rating-modal";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Rating Tracker (Page 4)
//  A personal growth timeline, kept like a journal
// ─────────────────────────────────────────────────────────────

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

// ─── Decoded entry shape used everywhere on this page ───
interface DecodedEntry extends DbRatingEntry {
  format: RatingFormat;
  cleanNotes: string;
  delta: number; // change vs. previous of same format (0 if first)
}

function decodeEntries(rows: DbRatingEntry[]): DecodedEntry[] {
  const decoded = rows.map((e) => {
    const { format, notes } = decodeFormatFromNotes(e.notes);
    return { ...e, format, cleanNotes: notes, delta: 0 };
  });
  // Compute per-format deltas
  const lastByFmt: Record<string, number | undefined> = {};
  for (const e of decoded) {
    const prev = lastByFmt[e.format];
    e.delta = prev === undefined ? 0 : e.rating - prev;
    lastByFmt[e.format] = e.rating;
  }
  return decoded;
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function RatingsClient({
  initialEntries,
}: {
  initialEntries: DbRatingEntry[];
}) {
  // Seeded from the server component; refresh() re-pulls after a mutation.
  const [allEntries, setAllEntries] = useState<DecodedEntry[]>(() =>
    decodeEntries(initialEntries),
  );
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<RatingFormat>("Rapid");
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = async () => {
    try {
      const rows = await getRatingEntries();
      setAllEntries(decodeEntries(rows));
    } catch (err) {
      console.error("Failed to load rating entries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Entries filtered to the active tab's format
  const entries = useMemo(
    () => allEntries.filter((e) => e.format === format),
    [allEntries, format],
  );

  const hasEntries = entries.length > 0;
  const currentRating = hasEntries ? entries[entries.length - 1].rating : 800;
  const peakRating = hasEntries ? Math.max(...entries.map((e) => e.rating)) : 800;
  const lowestRating = hasEntries ? Math.min(...entries.map((e) => e.rating)) : 800;
  const avgRating = hasEntries
    ? Math.round(entries.reduce((a, e) => a + e.rating, 0) / entries.length)
    : 800;
  const streak = calculateStreak(entries);

  // Month gain: difference between earliest entry of current month and latest
  const monthGain = useMemo(() => {
    if (!hasEntries) return 0;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthRows = entries.filter((e) => e.entry_date.startsWith(monthKey));
    if (monthRows.length === 0) return 0;
    return monthRows[monthRows.length - 1].rating - monthRows[0].rating;
  }, [entries, hasEntries]);

  const title = titleFor(currentRating);
  const upcoming = nextTitle(currentRating);
  const targetRating = upcoming?.threshold ?? peakRating + 100;

  // Personal best per format (across allEntries, not the filter)
  const peakByFormat = useMemo(() => {
    const out: Record<RatingFormat, number | null> = {
      Rapid: null,
      Blitz: null,
      Bullet: null,
      Daily: null,
    };
    for (const e of allEntries) {
      if (!out[e.format] || e.rating > (out[e.format] as number)) {
        out[e.format] = e.rating;
      }
    }
    return out;
  }, [allEntries]);

  // Chart data — sample if too few real points
  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        date: new Date(e.entry_date + "T00:00:00Z").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        rating: e.rating,
      })),
    [entries],
  );

  // "isSample" now simply means "no real data yet" — never fabricated points.
  const isSampleChart = chartData.length === 0;

  // Weekly rating change for monthly progress bar chart
  const weeklyDelta = useMemo(() => {
    // Bucket entries into ISO weeks (simple — by YYYY-WW)
    const byWeek: Record<string, { first: number; last: number }> = {};
    for (const e of entries) {
      const d = new Date(e.entry_date + "T00:00:00Z");
      const year = d.getUTCFullYear();
      // Approximate week number (Sun-based)
      const start = new Date(Date.UTC(year, 0, 1));
      const diff = Math.floor((d.getTime() - start.getTime()) / 86400000);
      const week = Math.floor(diff / 7) + 1;
      const key = `${year}-W${String(week).padStart(2, "0")}`;
      if (!byWeek[key]) byWeek[key] = { first: e.rating, last: e.rating };
      else byWeek[key].last = e.rating;
    }
    const keys = Object.keys(byWeek).sort().slice(-6);
    return keys.map((k, i) => ({
      label: `W${i + 1}`,
      delta: byWeek[k].last - byWeek[k].first,
    }));
  }, [entries]);

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      {/* Background engravings */}
      <span
        className="pointer-events-none absolute top-24 -left-12 font-display text-emerald/[0.04] leading-none select-none hidden lg:block"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </span>
      <span
        className="pointer-events-none absolute top-[55%] -right-10 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "20rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>
      <GoldStar className="absolute top-32 right-[12%] size-3 text-gold opacity-50 hidden md:block" />
      <GoldStar className="absolute top-[40%] left-[7%] size-2 text-gold opacity-50 hidden md:block" />
      <Crown className="absolute top-20 right-[30%] w-7 h-5 text-gold-deep opacity-30 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-12">
        <PageHeader onAdd={() => setModalOpen(true)} />

        <FadeUp>
          <FormatTabs value={format} onChange={setFormat} />
        </FadeUp>

        <FadeUp delay={0.05}>
          <HeroStats
            format={format}
            currentRating={hasEntries ? currentRating : null}
            peakRating={hasEntries ? peakRating : null}
            monthGain={hasEntries ? monthGain : null}
            targetRating={targetRating}
            title={title}
          />
        </FadeUp>

        <FadeUp delay={0.1}>
          <MainChart
            data={chartData}
            isSample={isSampleChart}
            highest={peakRating}
            lowest={lowestRating}
            current={currentRating}
            average={avgRating}
            format={format}
            hasEntries={hasEntries}
          />
        </FadeUp>

        <FadeUp delay={0.05}>
          <MilestoneJourney currentRating={currentRating} />
        </FadeUp>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <FadeUp>
              <RecentEntries
                entries={entries}
                streak={streak}
                onAdd={() => setModalOpen(true)}
              />
            </FadeUp>
          </div>
          <div className="lg:col-span-5">
            <FadeUp delay={0.05}>
              <MonthlyProgress data={weeklyDelta} />
            </FadeUp>
          </div>
        </div>

        <FadeUp>
          <PersonalBest peaks={peakByFormat} />
        </FadeUp>

        <FadeUp delay={0.05}>
          <InsightsSection
            entries={entries}
            allEntries={allEntries}
            currentRating={currentRating}
          />
        </FadeUp>

        <FadeUp>
          <QuoteSection />
        </FadeUp>
      </div>

      <AddRatingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultFormat={format}
        defaultRating={hasEntries ? currentRating : undefined}
        onSaved={refresh}
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
      {/* Faded rook behind title */}
      <span
        className="pointer-events-none absolute -top-10 left-0 font-display text-gold/15 leading-none select-none hidden md:block"
        style={{ fontSize: "13rem" }}
        aria-hidden="true"
      >
        {PIECES.rook}
      </span>

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
            Chapter Two
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
            <span className="italic text-emerald">Rating</span> Tracker
          </h1>
          <p className="mt-3 font-serif-quote italic text-lg text-ink/65 max-w-xl">
            &ldquo;Every rating point tells a story.&rdquo;
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Add Rating Entry
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
//  FORMAT TABS
// ─────────────────────────────────────────────────────────────

function FormatTabs({
  value,
  onChange,
}: {
  value: RatingFormat;
  onChange: (v: RatingFormat) => void;
}) {
  return (
    <div className="flex justify-center">
      <div
        role="tablist"
        className="inline-flex p-1.5 bg-white border border-gold/45 rounded-sm shadow-[0_15px_30px_-20px_rgba(17,17,17,0.15)]"
      >
        {RATING_FORMATS.map((f) => {
          const active = value === f;
          return (
            <button
              key={f}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(f)}
              className="relative px-6 md:px-7 py-2.5 text-[12px] tracking-[0.26em] uppercase font-medium transition-colors z-10"
            >
              {active && (
                <motion.span
                  layoutId="rating-tab-pill"
                  className="absolute inset-0 bg-emerald border border-gold rounded-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={`${active ? "text-ivory" : "text-ink/65 hover:text-emerald"} transition-colors`}
              >
                {f}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HERO STATS — 4 cards
// ─────────────────────────────────────────────────────────────

function HeroStats({
  format,
  currentRating,
  peakRating,
  monthGain,
  targetRating,
  title,
}: {
  format: RatingFormat;
  currentRating: number | null;
  peakRating: number | null;
  monthGain: number | null;
  targetRating: number;
  title: { name: string; piece: string };
}) {
  const cards = [
    {
      label: `Current ${format}`,
      value: currentRating !== null ? currentRating.toLocaleString() : "—",
      sub: currentRating !== null ? `${title.name} band` : "Add an entry to begin",
      piece: PIECES.pawn,
    },
    {
      label: "Peak Rating",
      value: peakRating !== null ? peakRating.toLocaleString() : "—",
      sub: peakRating !== null ? "Personal high" : "Awaiting your first entry",
      piece: PIECES.knight,
    },
    {
      label: "This Month",
      value:
        monthGain === null
          ? "—"
          : monthGain >= 0
            ? `+${monthGain}`
            : String(monthGain),
      sub:
        monthGain === null
          ? "No data yet"
          : monthGain >= 0
            ? "Net gain"
            : "Net loss",
      piece: PIECES.bishop,
      tone:
        monthGain === null
          ? "ink"
          : monthGain >= 0
            ? "emerald"
            : "gold",
    },
    {
      label: "Target Rating",
      value: targetRating.toLocaleString(),
      sub:
        currentRating !== null
          ? `${Math.max(0, targetRating - currentRating)} to go`
          : `Next milestone`,
      piece: PIECES.queen,
    },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, i) => (
        <motion.article
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: i * 0.06,
            ease: [0.22, 0.85, 0.36, 1],
          }}
          className="group relative bg-white border border-gold/45 rounded-sm p-6 hover:-translate-y-0.5 hover:border-emerald hover:shadow-[0_20px_40px_-20px_rgba(14,90,60,0.25)] transition-all"
        >
          <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
          <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
          <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
          <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

          <div className="flex items-start justify-between mb-4">
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
          <p
            className={`font-display text-4xl leading-none ${
              c.tone === "gold"
                ? "text-gold-deep"
                : c.tone === "ink"
                  ? "text-ink/65"
                  : "text-emerald"
            }`}
          >
            {c.value}
          </p>
          <p className="mt-3 font-serif-quote italic text-[12px] text-ink/55">
            {c.sub}
          </p>
        </motion.article>
      ))}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN CHART
// ─────────────────────────────────────────────────────────────

function MainChart({
  data,
  isSample,
  highest,
  lowest,
  current,
  average,
  format,
  hasEntries,
}: {
  data: { date: string; rating: number }[];
  isSample: boolean;
  highest: number;
  lowest: number;
  current: number;
  average: number;
  format: RatingFormat;
  hasEntries: boolean;
}) {
  const min = data.length ? Math.min(...data.map((d) => d.rating)) : 0;
  const max = data.length ? Math.max(...data.map((d) => d.rating)) : 1000;
  const yDomain = [Math.max(0, min - 80), max + 80] as [number, number];

  const summaryStats = [
    { label: "Highest",  value: hasEntries ? highest : "—" },
    { label: "Average",  value: hasEntries ? average : "—" },
    { label: "Current",  value: hasEntries ? current : "—" },
    { label: "Lowest",   value: hasEntries ? lowest  : "—" },
  ];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/50" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/50" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/50" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/50" />

      {/* Queen watermark behind chart */}
      <span
        className="absolute -bottom-16 -right-8 font-display text-gold/15 leading-none select-none pointer-events-none"
        style={{ fontSize: "28rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <div className="relative p-7 lg:p-9">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
          <div>
            <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
              {format} Trajectory
            </p>
            <h2 className="font-display text-3xl text-ink leading-tight">
              The <span className="italic text-emerald">arc</span> of your climb
            </h2>
            <p className="mt-2 font-serif-quote italic text-ink/60 text-sm">
              {isSample
                ? "No entries yet — connect an account in Settings and Sync, or add a rating."
                : "Each point is a moment you decided to track."}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4 md:gap-6">
            {summaryStats.map((s) => (
              <div key={s.label} className="text-center md:text-right">
                <p className="text-[9px] tracking-[0.22em] uppercase text-ink/55">
                  {s.label}
                </p>
                <p className="font-display text-xl text-emerald leading-none mt-1">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 14, right: 28, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                stroke="rgba(184, 146, 63, 0.15)"
                strokeDasharray="2 6"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
                stroke="rgba(184, 146, 63, 0.4)"
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "#4A463F", fontSize: 11, fontFamily: "var(--font-inter)" }}
                stroke="rgba(184, 146, 63, 0.4)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FAF8F2",
                  border: "1px solid #E6C46A",
                  borderRadius: "2px",
                  fontFamily: "var(--font-inter)",
                  fontSize: "12px",
                  color: "#111111",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  fontFamily: "var(--font-playfair)",
                  fontWeight: 600,
                  color: "#0E5A3C",
                  marginBottom: 2,
                }}
                cursor={{ stroke: "#0E5A3C", strokeWidth: 1, strokeDasharray: "2 4" }}
              />
              {RATING_MILESTONES.map((m) =>
                m >= yDomain[0] && m <= yDomain[1] ? (
                  <ReferenceLine
                    key={m}
                    y={m}
                    stroke="#0E5A3C"
                    strokeDasharray="3 4"
                    strokeOpacity={0.4}
                    label={{
                      value: String(m),
                      position: "right",
                      fill: "#0E5A3C",
                      fontSize: 10,
                      fontFamily: "var(--font-inter)",
                      offset: 8,
                    }}
                  />
                ) : null,
              )}
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#E6C46A"
                strokeWidth={2.5}
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-out"
                dot={{ fill: "#FAF8F2", stroke: "#0E5A3C", strokeWidth: 2, r: 4 }}
                activeDot={{
                  fill: "#0E5A3C",
                  stroke: "#E6C46A",
                  strokeWidth: 2.5,
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  MILESTONE JOURNEY — Pawn → Queen
// ─────────────────────────────────────────────────────────────

function MilestoneJourney({ currentRating }: { currentRating: number }) {
  const current = titleFor(currentRating);
  const activeIdx = TITLE_JOURNEY.findIndex((b) => b.name === current.name);

  // Progress along the rail, computed as fraction between active band and next
  const next = nextTitle(currentRating);
  const progressWithinBand = next
    ? (currentRating - current.threshold) /
      (next.threshold - current.threshold)
    : 1;
  const railProgress =
    (activeIdx + Math.min(1, Math.max(0, progressWithinBand))) /
    (TITLE_JOURNEY.length - 1);

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-10 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <div className="text-center mb-10">
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
          Milestone Journey
        </p>
        <h2 className="font-display text-3xl text-ink leading-tight">
          From <span className="italic text-emerald">Pawn</span> to{" "}
          <span className="italic text-emerald">Queen</span>
        </h2>
      </div>

      <div className="relative">
        {/* Connecting rail */}
        <div className="hidden md:block absolute top-[3.25rem] left-[10%] right-[10%] h-px bg-gold/40" />
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${railProgress * 80}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="hidden md:block absolute top-[3.25rem] left-[10%] h-px bg-emerald origin-left"
        />

        <ol className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 relative">
          {TITLE_JOURNEY.map((band, i) => {
            const reached = currentRating >= band.threshold;
            const isCurrent = band.name === current.name;
            return (
              <li
                key={band.name}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative">
                  {isCurrent && (
                    <>
                      <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 w-10 h-7 text-gold-deep" />
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(230, 196, 106, 0)",
                            "0 0 0 12px rgba(230, 196, 106, 0.18)",
                            "0 0 0 0 rgba(230, 196, 106, 0)",
                          ],
                        }}
                        transition={{ duration: 2.6, repeat: Infinity }}
                        className="absolute inset-0 rounded-full"
                      />
                    </>
                  )}
                  <div
                    className={`relative size-[5.5rem] md:size-[6.5rem] rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent
                        ? "bg-emerald border-gold text-gold scale-110"
                        : reached
                          ? "bg-gold-light/60 border-gold-deep text-emerald"
                          : "bg-ivory border-ink/15 text-ink/30"
                    }`}
                  >
                    <span
                      className="font-display text-5xl leading-none"
                      aria-hidden="true"
                    >
                      {band.piece}
                    </span>
                  </div>
                </div>
                <h3
                  className={`mt-6 font-display text-xl tracking-wide ${
                    isCurrent ? "text-emerald" : "text-ink"
                  }`}
                >
                  {band.name}
                </h3>
                <p
                  className={`mt-1 font-serif-quote italic text-[12px] tracking-wide ${
                    reached ? "text-gold-deep" : "text-ink/40"
                  }`}
                >
                  {band.threshold.toLocaleString()}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  RECENT ENTRIES
// ─────────────────────────────────────────────────────────────

function RecentEntries({
  entries,
  streak,
  onAdd,
}: {
  entries: DecodedEntry[];
  streak: number;
  onAdd: () => void;
}) {
  const recent = entries.slice(-6).reverse();

  return (
    <section>
      <SectionHeading
        eyebrow="Recent Entries"
        title="The journal so far"
        action={
          streak > 0 && (
            <span className="text-[11px] tracking-[0.22em] uppercase text-gold-deep">
              Streak · <span className="text-emerald">{streak} d</span>
            </span>
          )
        }
      />

      {recent.length === 0 ? (
        <EmptyEntries onAdd={onAdd} />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {recent.map((e, i) => (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.04,
                  ease: [0.22, 0.85, 0.36, 1],
                }}
              >
                <EntryCard entry={e} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function EntryCard({ entry }: { entry: DecodedEntry }) {
  const delta = entry.delta;
  const tone =
    delta > 0 ? "gain" : delta < 0 ? "loss" : "flat";

  const toneStyles = {
    gain: {
      bar: "bg-emerald",
      chip: "text-emerald",
      Icon: ArrowUpRight,
    },
    loss: {
      bar: "bg-gold-deep",
      chip: "text-gold-deep",
      Icon: ArrowDownRight,
    },
    flat: {
      bar: "bg-ink/30",
      chip: "text-ink/55",
      Icon: Minus,
    },
  }[tone];
  const Icon = toneStyles.Icon;

  const dateLabel = new Date(entry.entry_date + "T00:00:00Z").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <article className="relative flex items-stretch bg-white border border-gold/40 rounded-sm overflow-hidden hover:border-emerald transition-colors">
      <div className={`w-[3px] ${toneStyles.bar}`} aria-hidden="true" />
      <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-serif-quote italic text-gold-deep text-[12px] tracking-[0.18em] uppercase">
              {dateLabel}
            </span>
            <span className="text-[10px] tracking-[0.22em] uppercase text-ink/45 px-2 py-0.5 bg-ivory border border-gold/30 rounded-sm">
              {entry.format}
            </span>
          </div>
          {entry.cleanNotes && (
            <p className="font-serif-quote italic text-[13.5px] text-ink/70 leading-snug line-clamp-2">
              &ldquo;{entry.cleanNotes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="font-display text-3xl text-emerald leading-none">
              {entry.rating.toLocaleString()}
            </p>
            <p className="text-[10px] tracking-[0.22em] uppercase text-ink/45 mt-1">
              Rating
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 border ${
              tone === "gain"
                ? "border-emerald/30 bg-emerald/[0.06]"
                : tone === "loss"
                  ? "border-gold-deep/30 bg-gold-light/40"
                  : "border-ink/15 bg-ivory"
            } rounded-sm ${toneStyles.chip}`}
          >
            <Icon className="w-3 h-3" />
            <span className="font-display text-sm leading-none">
              {delta > 0 ? `+${delta}` : delta}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyEntries({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative bg-white border border-dashed border-gold/45 rounded-sm p-10 text-center">
      <span
        className="font-display text-5xl text-gold-deep/40 leading-none"
        aria-hidden="true"
      >
        {PIECES.pawn}
      </span>
      <p className="mt-4 font-display text-xl text-ink">
        No entries in this format yet
      </p>
      <p className="mt-2 font-serif-quote italic text-ink/60 text-sm max-w-sm mx-auto">
        Add your first rating and the journal will begin to fill — even 800 is worth writing down.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="group mt-6 inline-flex items-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors"
      >
        <Plus className="w-4 h-4 text-gold" />
        Add Rating Entry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MONTHLY PROGRESS — bar chart of weekly delta
// ─────────────────────────────────────────────────────────────

function MonthlyProgress({
  data,
}: {
  data: { label: string; delta: number }[];
}) {
  const max = Math.max(...data.map((d) => Math.abs(d.delta)), 10);

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 h-full">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <SectionHeading
        eyebrow="Monthly Progress"
        title="Weekly rating change"
        compact
      />

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 10, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              stroke="rgba(184, 146, 63, 0.15)"
              strokeDasharray="2 6"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#4A463F", fontSize: 10, fontFamily: "var(--font-inter)" }}
              stroke="rgba(184, 146, 63, 0.4)"
              tickLine={false}
            />
            <YAxis
              domain={[-max - 5, max + 5]}
              tick={{ fill: "#4A463F", fontSize: 10, fontFamily: "var(--font-inter)" }}
              stroke="rgba(184, 146, 63, 0.4)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FAF8F2",
                border: "1px solid #E6C46A",
                borderRadius: "2px",
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              cursor={{ fill: "rgba(14,90,60,0.05)" }}
            />
            <ReferenceLine y={0} stroke="#B8923F" strokeOpacity={0.5} />
            <Bar
              dataKey="delta"
              radius={[2, 2, 0, 0]}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.delta >= 0 ? "#0E5A3C" : "#E6C46A"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gold/25 flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-ink/55">
        <span className="flex items-center gap-2">
          <span className="block size-2 bg-emerald rounded-sm" /> Gains
        </span>
        <span className="flex items-center gap-2">
          <span className="block size-2 bg-gold rounded-sm" /> Losses
        </span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  PERSONAL BEST — 4 trophy cards
// ─────────────────────────────────────────────────────────────

function PersonalBest({
  peaks,
}: {
  peaks: Record<RatingFormat, number | null>;
}) {
  return (
    <section>
      <SectionHeading
        eyebrow="Personal Best"
        title="Your peaks, by format"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {RATING_FORMATS.map((fmt, i) => {
          const peak = peaks[fmt];
          return (
            <motion.article
              key={fmt}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group relative bg-gold-light/45 border border-gold-deep/40 rounded-sm p-6 hover:bg-gold-light/65 transition-colors text-center"
            >
              <Crown className="mx-auto w-9 h-6 text-gold-deep mb-3" />
              <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium">
                Highest {fmt}
              </p>
              <p
                className={`mt-2 font-display text-4xl leading-none ${
                  peak === null ? "text-ink/30" : "text-emerald"
                }`}
              >
                {peak === null ? "—" : peak.toLocaleString()}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-gold-deep/40" />
                <span
                  className="font-display text-lg text-gold-deep leading-none"
                  aria-hidden="true"
                >
                  {fmt === "Rapid"
                    ? PIECES.rook
                    : fmt === "Blitz"
                      ? PIECES.knight
                      : fmt === "Bullet"
                        ? PIECES.bishop
                        : PIECES.king}
                </span>
                <span className="h-px w-6 bg-gold-deep/40" />
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  INSIGHTS — 5 cards w/ bishop watermark
// ─────────────────────────────────────────────────────────────

function InsightsSection({
  entries,
  allEntries,
  currentRating,
}: {
  entries: DecodedEntry[];
  allEntries: DecodedEntry[];
  currentRating: number;
}) {
  // Derive what we can from real data; fall back to demo lines.
  const hasReal = entries.length >= 3;

  const biggestMonth = useMemo(() => {
    if (!hasReal) return { label: "—", value: "Awaiting data" };
    const byMonth: Record<string, { first: number; last: number }> = {};
    for (const e of entries) {
      const key = e.entry_date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { first: e.rating, last: e.rating };
      else byMonth[key].last = e.rating;
    }
    let bestKey = "";
    let bestDelta = -Infinity;
    for (const k of Object.keys(byMonth)) {
      const d = byMonth[k].last - byMonth[k].first;
      if (d > bestDelta) {
        bestDelta = d;
        bestKey = k;
      }
    }
    return {
      label: new Date(bestKey + "-01").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      value: `+${bestDelta} rating`,
    };
  }, [entries, hasReal]);

  const mostActiveFormat = useMemo(() => {
    if (allEntries.length === 0) return { label: "Rapid", value: "Most logged" };
    const counts: Record<string, number> = {};
    for (const e of allEntries) counts[e.format] = (counts[e.format] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { label: top[0], value: `${top[1]} entries` };
  }, [allEntries]);

  const fastestClimb = useMemo(() => {
    if (entries.length < 2) return { label: "—", value: "Need 2+ entries" };
    let best = 0;
    for (let i = 1; i < entries.length; i++) {
      const d = entries[i].rating - entries[i - 1].rating;
      if (d > best) best = d;
    }
    return {
      label: best > 0 ? `+${best} in a session` : "Steady",
      value: best > 0 ? "Best single jump" : "No spike yet",
    };
  }, [entries]);

  const longestPlateau = useMemo(() => {
    if (entries.length < 3) return { label: "—", value: "Need more data" };
    let max = 1;
    let cur = 1;
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].rating === entries[i - 1].rating) {
        cur++;
        if (cur > max) max = cur;
      } else {
        cur = 1;
      }
    }
    return {
      label: `${max} session${max === 1 ? "" : "s"}`,
      value: "Same rating",
    };
  }, [entries]);

  const cards = [
    {
      title: "Biggest Improvement Month",
      label: biggestMonth.label,
      sub: biggestMonth.value,
      piece: PIECES.knight,
    },
    {
      title: "Most Active Format",
      label: mostActiveFormat.label,
      sub: mostActiveFormat.value,
      piece: PIECES.rook,
    },
    {
      title: "Fastest Rating Climb",
      label: fastestClimb.label,
      sub: fastestClimb.value,
      piece: PIECES.queen,
    },
    {
      title: "Longest Plateau",
      label: longestPlateau.label,
      sub: longestPlateau.value,
      piece: PIECES.pawn,
    },
    {
      title: "Favorite Time to Play",
      label: "Evenings",
      sub: "Inferred · 7 – 9 pm",
      piece: PIECES.king,
    },
  ];

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-10 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      {/* Bishop watermark */}
      <span
        className="absolute -bottom-10 -right-4 font-display text-emerald/[0.07] leading-none select-none pointer-events-none"
        style={{ fontSize: "22rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </span>

      <SectionHeading
        eyebrow="Insights"
        title="What the numbers whisper"
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
//  QUOTE SECTION
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
          &ldquo;Success in chess comes from making one good move
          <br className="hidden md:block" /> after another.&rdquo;
        </blockquote>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold-deep/45" />
          <cite className="not-italic font-display tracking-[0.28em] uppercase text-[11px] text-gold-deep">
            A Chess Maxim
          </cite>
          <span className="h-px w-10 bg-gold-deep/45" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shared section heading
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
    <div
      className={`flex items-end justify-between gap-4 ${compact ? "mb-5" : "mb-6"}`}
    >
      <div>
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">
          {eyebrow}
        </p>
        <h2
          className={`font-display ${compact ? "text-xl" : "text-2xl"} text-ink leading-tight`}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Loading shell
// ─────────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-32 bg-gold/30 rounded" />
        <div className="h-10 w-80 bg-ink/10 rounded" />
        <div className="h-4 w-72 bg-ink/10 rounded" />
      </div>
      <div className="flex justify-center">
        <div className="h-10 w-80 bg-white border border-gold/30 rounded-sm" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white border border-gold/30 rounded-sm" />
        ))}
      </div>
      <div className="h-96 bg-white border border-gold/30 rounded-sm" />
    </div>
  );
}
