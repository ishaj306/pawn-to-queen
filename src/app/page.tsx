import Link from "next/link";

// ─────────────────────────────────────────────────────────────
//  PAWN TO QUEEN — LANDING PAGE (Page 1)
//  Luxury editorial × Vintage chess manuscript × Hermès
// ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="bg-ivory text-ink overflow-x-hidden">
      <TopNav />
      <Hero />
      <QuoteBand />
      <HowItWorks />
      <Features />
      <SecondBrain />
      <Screenshots />
      <WhyP2Q />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
//  Decorative atoms
// ─────────────────────────────────────────────────────────────

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
      <line
        x1="4"
        y1="20"
        x2="28"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.2"
      />
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

function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`gold-divider ${className}`}>
      <Fleur className="size-4 text-gold-deep shrink-0" />
    </div>
  );
}

// Unicode chess glyphs render beautifully in Playfair Display
// — they feel like vintage manuscript woodcuts at large sizes.
const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

// ─────────────────────────────────────────────────────────────
//  Top navigation
// ─────────────────────────────────────────────────────────────

function TopNav() {
  return (
    <header className="sticky top-0 z-50 bg-ivory/85 backdrop-blur-md border-b border-gold/25">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="font-display text-2xl text-emerald leading-none"
            aria-hidden="true"
          >
            {PIECES.queen}
          </span>
          <span className="font-display tracking-wide text-[15px] text-ink">
            Pawn <span className="text-gold-deep">to</span> Queen
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-[13px] tracking-[0.18em] uppercase text-ink/70">
          <a href="#features" className="hover:text-emerald transition-colors">
            Features
          </a>
          <a href="#journey" className="hover:text-emerald transition-colors">
            Journey
          </a>
          <a href="#why" className="hover:text-emerald transition-colors">
            Why
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-block text-[13px] tracking-[0.18em] uppercase text-ink/80 hover:text-emerald transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald text-ivory px-5 py-2.5 text-[12px] tracking-[0.22em] uppercase hover:bg-emerald-deep transition-colors"
          >
            Start Journey
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
//  Hero
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative bg-chessboard-faint">
      {/* Scattered ornamental stars */}
      <GoldStar className="absolute top-24 left-[8%] size-3 text-gold opacity-70 animate-float-slow" />
      <GoldStar className="absolute top-40 right-[14%] size-2.5 text-gold opacity-60 animate-float-slow [animation-delay:1.5s]" />
      <Crown className="absolute top-16 right-[8%] w-10 h-7 text-gold-deep opacity-60" />
      <GoldStar className="absolute bottom-16 left-[20%] size-2 text-gold opacity-50" />
      <Fleur className="absolute bottom-24 right-[18%] size-5 text-gold-deep opacity-50 animate-float-slow [animation-delay:2.5s]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 items-center">
        {/* LEFT — vintage pawn */}
        <div className="hidden lg:flex lg:col-span-2 justify-center">
          <div className="relative">
            <div
              className="font-display text-ink/80 leading-none select-none"
              style={{ fontSize: "13rem" }}
              aria-hidden="true"
            >
              {PIECES.pawn}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-px bg-gold-deep/40" />
          </div>
        </div>

        {/* CENTER — editorial type */}
        <div className="lg:col-span-7 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 mb-7">
            <span className="h-px w-10 bg-gold-deep" />
            <span className="font-serif-quote italic text-gold-deep text-sm tracking-[0.32em] uppercase">
              Chess Growth OS
            </span>
            <span className="h-px w-10 bg-gold-deep" />
          </div>

          <h1 className="font-display font-medium leading-[0.92] tracking-tight text-ink">
            <span className="block text-[clamp(2.75rem,7vw,6.5rem)]">
              Every Master
            </span>
            <span className="block text-[clamp(2.75rem,7vw,6.5rem)]">
              Was Once
            </span>
            <span className="block text-[clamp(2.75rem,7vw,6.5rem)] italic text-emerald">
              A Pawn.
            </span>
          </h1>

          <p className="mt-8 font-serif-quote text-2xl md:text-[1.65rem] text-ink/75 italic leading-snug max-w-2xl mx-auto lg:mx-0">
            The personal operating system for chess improvement.
          </p>

          <p className="mt-5 text-[15px] leading-relaxed text-ink/65 max-w-xl mx-auto lg:mx-0">
            Track your ratings, games, puzzles, habits and insights. Transform
            scattered practice into structured growth — one move at a time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-3 bg-emerald text-ivory px-9 py-4 text-[12px] tracking-[0.28em] uppercase hover:bg-emerald-deep transition-colors min-w-[14rem]"
            >
              Start Your Journey
              <span className="text-gold transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-ivory border border-ink/80 text-ink px-9 py-4 text-[12px] tracking-[0.28em] uppercase hover:bg-ink hover:text-ivory transition-colors min-w-[10rem]"
            >
              Sign In
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center text-[12px] tracking-[0.28em] uppercase text-ink/70 hover:text-emerald transition-colors underline-offset-8 hover:underline decoration-gold"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* RIGHT — emerald queen */}
        <div className="lg:col-span-3 flex justify-center">
          <div className="relative">
            <div
              className="absolute inset-0 blur-3xl bg-gold/30 rounded-full"
              aria-hidden="true"
            />
            <div
              className="relative font-display text-emerald leading-none select-none drop-shadow-sm"
              style={{ fontSize: "20rem" }}
              aria-hidden="true"
            >
              {PIECES.queen}
            </div>
            <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-10 text-gold-deep" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-px bg-gold-deep/50" />
          </div>
        </div>
      </div>

      {/* Bottom ornamental rule */}
      <div className="max-w-5xl mx-auto px-10 pb-8">
        <GoldDivider />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Quote band
// ─────────────────────────────────────────────────────────────

function QuoteBand() {
  return (
    <section className="bg-ivory py-24 lg:py-32 border-y border-gold/25">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-10">
          <Fleur className="size-7 text-gold-deep" />
        </div>

        <GoldDivider className="mb-10" />

        <blockquote className="font-serif-quote italic text-3xl md:text-[2.6rem] leading-[1.25] text-ink/90">
          &ldquo;The game of chess is not merely
          <br className="hidden md:block" /> an idle amusement.&rdquo;
        </blockquote>

        <div className="mt-10 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-gold-deep" />
          <cite className="not-italic font-display tracking-[0.3em] uppercase text-[13px] text-gold-deep">
            Benjamin Franklin
          </cite>
          <span className="h-px w-12 bg-gold-deep" />
        </div>

        <GoldDivider className="mt-10" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  How It Works — Pawn → Queen journey
// ─────────────────────────────────────────────────────────────

const JOURNEY = [
  { piece: PIECES.pawn, name: "Pawn", note: "Begin" },
  { piece: PIECES.knight, name: "Knight", note: "Learn" },
  { piece: PIECES.bishop, name: "Bishop", note: "Refine" },
  { piece: PIECES.rook, name: "Rook", note: "Master" },
  { piece: PIECES.queen, name: "Queen", note: "Reign" },
];

function HowItWorks() {
  return (
    <section id="journey" className="bg-paper py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-sm mb-5">
            How It Works
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-ink mb-6 leading-tight">
            The <span className="italic text-emerald">Journey</span> of a Player
          </h2>
          <p className="font-serif-quote italic text-xl md:text-2xl text-ink/70">
            Track. Learn. Rise.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-[5.5rem] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-deep/50 to-transparent"
            aria-hidden="true"
          />

          <ol className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-6 relative">
            {JOURNEY.map((step, i) => (
              <li
                key={step.name}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative">
                  <div className="size-[7.5rem] md:size-[8.5rem] rounded-full bg-ivory border border-gold/60 flex items-center justify-center shadow-[0_0_0_6px_rgba(250,248,242,1),0_0_0_7px_rgba(230,196,106,0.3)] group-hover:border-emerald transition-colors">
                    <span
                      className="font-display text-7xl text-ink group-hover:text-emerald transition-colors leading-none"
                      aria-hidden="true"
                    >
                      {step.piece}
                    </span>
                  </div>
                  <span className="absolute -top-2 -right-2 bg-emerald text-ivory size-7 rounded-full flex items-center justify-center text-xs font-serif-quote font-semibold">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-7 font-display text-2xl tracking-wide text-ink">
                  {step.name}
                </h3>
                <p className="mt-1 font-serif-quote italic text-gold-deep tracking-[0.2em] uppercase text-xs">
                  {step.note}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Feature cards — 9 luxury cards
// ─────────────────────────────────────────────────────────────

type FeatureIconProps = { className?: string };

function FeatureIcon({
  paths,
  className = "",
}: FeatureIconProps & { paths: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

const FEATURES = [
  {
    title: "Dashboard",
    sub: "Your daily command center",
    body: "Current rating, peak, streak and recent games — at a glance.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <rect x="8" y="12" width="48" height="40" rx="2" />
            <line x1="8" y1="22" x2="56" y2="22" />
            <polyline points="14,42 22,34 30,38 40,28 50,32" />
            <circle cx="14" cy="42" r="1.4" fill="currentColor" />
            <circle cx="50" cy="32" r="1.4" fill="currentColor" />
          </>
        }
      />
    ),
  },
  {
    title: "Rating Tracker",
    sub: "Rapid · Blitz · Bullet · Daily",
    body: "Line charts per format with milestone markers at 500, 800, 1000+.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <line x1="10" y1="50" x2="54" y2="50" />
            <line x1="10" y1="10" x2="10" y2="50" />
            <polyline points="10,44 20,38 28,40 36,28 44,30 54,16" />
            <circle cx="54" cy="16" r="2" fill="currentColor" />
          </>
        }
      />
    ),
  },
  {
    title: "Games Log",
    sub: "Every move, every lesson",
    body: "Log results, openings, accuracy. Spot weak openings in red.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <rect x="10" y="10" width="44" height="44" rx="1" />
            <line x1="32" y1="10" x2="32" y2="54" />
            <line x1="10" y1="32" x2="54" y2="32" />
            <rect x="10" y="10" width="11" height="11" fill="currentColor" opacity="0.18" />
            <rect x="32" y="32" width="11" height="11" fill="currentColor" opacity="0.18" />
            <rect x="43" y="10" width="11" height="11" fill="currentColor" opacity="0.18" />
            <rect x="21" y="43" width="11" height="11" fill="currentColor" opacity="0.18" />
          </>
        }
      />
    ),
  },
  {
    title: "Puzzle Tracker",
    sub: "Daily tactics, daily growth",
    body: "Count, accuracy, rating and streak — a GitHub-style heatmap.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            {[0, 1, 2, 3, 4, 5].map((c) =>
              [0, 1, 2, 3].map((r) => (
                <rect
                  key={`${c}-${r}`}
                  x={10 + c * 8}
                  y={16 + r * 8}
                  width="6"
                  height="6"
                  rx="0.5"
                  fill="currentColor"
                  opacity={0.15 + ((c + r) % 5) * 0.18}
                  stroke="none"
                />
              )),
            )}
          </>
        }
      />
    ),
  },
  {
    title: "Goals",
    sub: "Intentions, made visible",
    body: "Reach 600 · Play 10 games · 30-day streak. Auto-tracked.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <circle cx="32" cy="32" r="22" />
            <circle cx="32" cy="32" r="14" />
            <circle cx="32" cy="32" r="6" fill="currentColor" />
            <line x1="32" y1="6" x2="32" y2="2" />
            <line x1="32" y1="62" x2="32" y2="58" />
            <line x1="6" y1="32" x2="2" y2="32" />
            <line x1="62" y1="32" x2="58" y2="32" />
          </>
        }
      />
    ),
  },
  {
    title: "Study Planner",
    sub: "A ritual, not a chore",
    body: "Play, puzzles, openings, endgames, videos, books — checked off daily.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <rect x="12" y="10" width="40" height="44" rx="2" />
            <line x1="20" y1="20" x2="44" y2="20" />
            <line x1="20" y1="30" x2="44" y2="30" />
            <line x1="20" y1="40" x2="44" y2="40" />
            <polyline points="16,20 18,22 22,18" stroke="currentColor" />
            <polyline points="16,30 18,32 22,28" stroke="currentColor" />
          </>
        }
      />
    ),
  },
  {
    title: "Journal",
    sub: "Lessons, mistakes, thoughts",
    body: "Capture insights from every game. Searchable forever.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <path d="M14 10h28a4 4 0 0 1 4 4v40H18a4 4 0 0 1-4-4z" />
            <line x1="14" y1="20" x2="46" y2="20" />
            <line x1="22" y1="28" x2="40" y2="28" />
            <line x1="22" y1="34" x2="40" y2="34" />
            <line x1="22" y1="40" x2="34" y2="40" />
          </>
        }
      />
    ),
  },
  {
    title: "Achievements",
    sub: "Earn your title",
    body: "Pawn → Knight → Bishop → Rook → Queen. Badges that mean something.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <path d="M22 10h20l-2 16a8 8 0 0 1-16 0z" />
            <path d="M22 14h-6a6 6 0 0 0 6 10" />
            <path d="M42 14h6a6 6 0 0 1-6 10" />
            <rect x="26" y="44" width="12" height="6" />
            <line x1="24" y1="54" x2="40" y2="54" />
            <line x1="32" y1="26" x2="32" y2="44" />
          </>
        }
      />
    ),
  },
  {
    title: "Insights",
    sub: "Patterns you couldn't see",
    body: "Best playing time. Biggest weakness. Long-term growth curves.",
    icon: (
      <FeatureIcon
        className="size-12 text-emerald"
        paths={
          <>
            <circle cx="32" cy="32" r="22" />
            <path d="M32 10v22l16 8" />
            <circle cx="32" cy="32" r="2" fill="currentColor" />
          </>
        }
      />
    ),
  },
];

function Features() {
  return (
    <section id="features" className="bg-ivory py-24 lg:py-32 relative">
      <GoldStar className="absolute top-20 left-[6%] size-2.5 text-gold opacity-50" />
      <GoldStar className="absolute bottom-20 right-[8%] size-2 text-gold opacity-50" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-sm mb-5">
            Nine Chapters
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-ink leading-tight">
            Everything an ambitious player
            <br />
            <span className="italic text-emerald">needs in one place.</span>
          </h2>
          <div className="mt-8 max-w-md mx-auto">
            <GoldDivider />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group relative bg-white border border-gold/40 rounded-sm p-8 transition-all duration-300 hover:border-emerald hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(14,90,60,0.35)] cursor-default"
            >
              {/* Corner ornaments */}
              <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/50" />
              <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/50" />
              <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/50" />
              <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/50" />

              <div className="mb-6 transition-transform group-hover:scale-105">
                {f.icon}
              </div>

              <h3 className="font-display text-2xl text-ink mb-1.5">
                {f.title}
              </h3>
              <p className="font-serif-quote italic text-gold-deep text-sm mb-4">
                {f.sub}
              </p>
              <p className="text-[14.5px] leading-relaxed text-ink/70">
                {f.body}
              </p>

              <div className="mt-6 inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-emerald opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <span>→</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Second Brain — antique gold band
// ─────────────────────────────────────────────────────────────

function SecondBrain() {
  return (
    <section className="bg-gold relative overflow-hidden py-28 lg:py-36">
      {/* Decorative chess pieces */}
      <div
        className="absolute -left-10 top-12 font-display text-white/40 select-none leading-none"
        style={{ fontSize: "16rem" }}
        aria-hidden="true"
      >
        {PIECES.king}
      </div>
      <div
        className="absolute -right-10 bottom-0 font-display text-emerald/80 select-none leading-none"
        style={{ fontSize: "20rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </div>
      <GoldStar className="absolute top-16 right-[20%] size-4 text-white" />
      <Fleur className="absolute bottom-20 left-[28%] size-7 text-emerald" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 text-center">
        <Crown className="w-14 h-10 mx-auto mb-8 text-ink" />

        <h2 className="font-display text-5xl md:text-7xl text-ink leading-[1.02] mb-10">
          Your <span className="italic">Second Brain</span>
          <br />
          for Chess.
        </h2>

        <div className="max-w-2xl mx-auto space-y-3 font-serif-quote text-2xl md:text-[1.7rem] italic text-ink/85 leading-snug">
          <p>No more scattered notes.</p>
          <p>No more forgotten lessons.</p>
          <p>No more random improvement.</p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <p className="text-[15px] md:text-base leading-relaxed text-ink/80">
            Bring ratings, games, puzzles, journals and goals together in one
            beautiful place — a private studio for your growth, kept like a
            collectible journal.
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          <span className="h-px w-32 bg-ink/40" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Screenshot section — magazine layout w/ watermark queen
// ─────────────────────────────────────────────────────────────

const PREVIEWS = [
  {
    name: "Dashboard",
    label: "01",
    body: (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: "Rating", v: "1147" },
            { k: "Peak", v: "1182" },
            { k: "Streak", v: "12d" },
          ].map((s) => (
            <div
              key={s.k}
              className="bg-ivory border border-gold/40 rounded-sm p-2.5"
            >
              <div className="text-[9px] tracking-[0.2em] uppercase text-ink/55">
                {s.k}
              </div>
              <div className="font-display text-xl text-emerald mt-1">
                {s.v}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-ivory border border-gold/40 rounded-sm h-20 p-2 flex items-end gap-1.5">
          {[40, 55, 48, 62, 58, 72, 68, 80, 74, 88].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-emerald/80 rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "Rating Tracker",
    label: "02",
    body: (
      <div className="bg-ivory border border-gold/40 rounded-sm h-40 p-3 relative">
        <div className="text-[9px] tracking-[0.2em] uppercase text-ink/55 mb-1">
          Rapid · 30 days
        </div>
        <svg viewBox="0 0 100 50" className="w-full h-28" preserveAspectRatio="none">
          <polyline
            points="0,42 10,38 20,40 30,32 40,30 50,25 60,28 70,20 80,18 90,12 100,10"
            fill="none"
            stroke="#0E5A3C"
            strokeWidth="1.4"
          />
          <polyline
            points="0,42 10,38 20,40 30,32 40,30 50,25 60,28 70,20 80,18 90,12 100,10 100,50 0,50"
            fill="#0E5A3C"
            opacity="0.12"
          />
        </svg>
      </div>
    ),
  },
  {
    name: "Puzzle Heatmap",
    label: "03",
    body: (
      <div className="bg-ivory border border-gold/40 rounded-sm p-3">
        <div className="text-[9px] tracking-[0.2em] uppercase text-ink/55 mb-2">
          365 days
        </div>
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}
        >
          {Array.from({ length: 140 }).map((_, i) => {
            const intensity = (i * 7) % 5;
            const opacity = [0.1, 0.25, 0.5, 0.75, 1][intensity];
            return (
              <div
                key={i}
                className="aspect-square rounded-[1px]"
                style={{ backgroundColor: `rgba(14,90,60,${opacity})` }}
              />
            );
          })}
        </div>
      </div>
    ),
  },
  {
    name: "Journal",
    label: "04",
    body: (
      <div className="bg-ivory border border-gold/40 rounded-sm p-3 space-y-2">
        {[
          { tag: "Lesson", text: "Always control the e4 square in the Italian." },
          { tag: "Mistake", text: "Blundered a knight in the middlegame — calc first." },
          { tag: "Thought", text: "Endgames feel sharper after the Silman chapter." },
        ].map((e) => (
          <div
            key={e.tag}
            className="border-l-2 border-gold pl-2.5 py-1"
          >
            <div className="text-[9px] tracking-[0.2em] uppercase text-gold-deep">
              {e.tag}
            </div>
            <div className="font-serif-quote italic text-[13px] text-ink/80 leading-tight">
              {e.text}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: "Achievements",
    label: "05",
    body: (
      <div className="bg-ivory border border-gold/40 rounded-sm p-3 grid grid-cols-3 gap-2">
        {[
          { p: PIECES.pawn, unlocked: true },
          { p: PIECES.knight, unlocked: true },
          { p: PIECES.bishop, unlocked: true },
          { p: PIECES.rook, unlocked: false },
          { p: PIECES.queen, unlocked: false },
          { p: PIECES.king, unlocked: false },
        ].map((b, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm border flex items-center justify-center ${
              b.unlocked
                ? "border-gold bg-gold/15 text-emerald"
                : "border-ink/15 bg-ink/[0.03] text-ink/25"
            }`}
          >
            <span className="font-display text-3xl leading-none">{b.p}</span>
          </div>
        ))}
      </div>
    ),
  },
];

function Screenshots() {
  return (
    <section className="relative bg-paper py-24 lg:py-32 overflow-hidden">
      {/* Giant watermark queen */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="font-display text-gold/15 leading-none"
          style={{ fontSize: "44rem" }}
        >
          {PIECES.queen}
        </span>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-sm mb-5">
            A Closer Look
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-ink leading-tight">
            Arranged like the pages
            <br />
            <span className="italic text-emerald">of a fine journal.</span>
          </h2>
        </div>

        {/* Magazine-style mosaic */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[minmax(0,auto)]">
          <PreviewCard preview={PREVIEWS[0]} className="md:col-span-4" />
          <PreviewCard preview={PREVIEWS[1]} className="md:col-span-2" />
          <PreviewCard preview={PREVIEWS[2]} className="md:col-span-2" />
          <PreviewCard preview={PREVIEWS[3]} className="md:col-span-2" />
          <PreviewCard preview={PREVIEWS[4]} className="md:col-span-2" />
        </div>
      </div>
    </section>
  );
}

function PreviewCard({
  preview,
  className = "",
}: {
  preview: (typeof PREVIEWS)[number];
  className?: string;
}) {
  return (
    <div
      className={`relative bg-white border border-gold/50 rounded-sm p-5 shadow-[0_30px_60px_-40px_rgba(17,17,17,0.4)] ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-serif-quote italic text-gold-deep text-xs tracking-[0.2em] uppercase">
            Plate {preview.label}
          </div>
          <h3 className="font-display text-xl text-ink leading-tight">
            {preview.name}
          </h3>
        </div>
        <div className="flex gap-1">
          <span className="size-1.5 rounded-full bg-gold" />
          <span className="size-1.5 rounded-full bg-gold/50" />
          <span className="size-1.5 rounded-full bg-gold/30" />
        </div>
      </div>
      {preview.body}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Why Pawn to Queen — 4 pillars
// ─────────────────────────────────────────────────────────────

const PILLARS = [
  {
    n: "I",
    title: "Track Progress",
    body: "Every rating, every game — recorded with the care of a manuscript.",
  },
  {
    n: "II",
    title: "Build Habits",
    body: "A daily ritual that turns sporadic effort into compounding growth.",
  },
  {
    n: "III",
    title: "Understand Weaknesses",
    body: "Surface the openings, time controls and patterns that hold you back.",
  },
  {
    n: "IV",
    title: "Celebrate Milestones",
    body: "Badges, titles and chapters earned — not given.",
  },
];

function WhyP2Q() {
  return (
    <section id="why" className="relative bg-ivory py-24 lg:py-32 overflow-hidden">
      {/* Border ornaments — knight & rook */}
      <div
        className="absolute -left-8 top-1/2 -translate-y-1/2 font-display text-ink/[0.06] select-none leading-none"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </div>
      <div
        className="absolute -right-8 top-1/2 -translate-y-1/2 font-display text-ink/[0.06] select-none leading-none"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.rook}
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-sm mb-5">
            Why Pawn to Queen
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-ink leading-tight">
            Four reasons to begin
            <br />
            <span className="italic text-emerald">your campaign.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {PILLARS.map((p) => (
            <article
              key={p.n}
              className="group relative bg-white border border-gold/40 rounded-sm p-10 transition-all hover:border-emerald hover:shadow-[0_30px_60px_-30px_rgba(14,90,60,0.3)]"
            >
              <div className="flex items-baseline gap-5 mb-5">
                <span className="font-display text-5xl text-gold-deep leading-none">
                  {p.n}
                </span>
                <span className="h-px flex-1 bg-gold/40" />
                <Fleur className="size-4 text-gold-deep" />
              </div>
              <h3 className="font-display text-3xl text-ink mb-3 group-hover:text-emerald transition-colors">
                {p.title}
              </h3>
              <p className="font-serif-quote italic text-lg text-ink/75 leading-snug">
                {p.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Final CTA — antique gold band
// ─────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="relative bg-gold overflow-hidden py-28 lg:py-36">
      {/* Decorative chess pieces */}
      <div
        className="absolute left-[5%] top-1/2 -translate-y-1/2 font-display text-white/45 select-none leading-none"
        style={{ fontSize: "14rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </div>
      <div
        className="absolute right-[5%] top-1/2 -translate-y-1/2 font-display text-emerald/85 select-none leading-none"
        style={{ fontSize: "16rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </div>
      <GoldStar className="absolute top-14 left-[35%] size-3 text-white" />
      <GoldStar className="absolute bottom-16 right-[40%] size-2.5 text-white" />
      <Crown className="absolute top-12 right-[30%] w-10 h-7 text-ink" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <Fleur className="size-9 mx-auto mb-8 text-ink" />

        <h2 className="font-display text-5xl md:text-7xl text-ink leading-[1.02] mb-8">
          Every Master Was
          <br />
          Once <span className="italic">A Pawn.</span>
        </h2>

        <p className="font-serif-quote italic text-2xl md:text-3xl text-ink/85 mb-12">
          Begin your journey today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-3 bg-emerald text-ivory px-10 py-4 text-[12px] tracking-[0.28em] uppercase hover:bg-emerald-deep transition-colors min-w-[16rem]"
          >
            Create Free Account
            <span className="text-gold transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center bg-transparent border border-ink text-ink px-10 py-4 text-[12px] tracking-[0.28em] uppercase hover:bg-ink hover:text-gold transition-colors min-w-[12rem]"
          >
            Learn More
          </a>
        </div>

        <div className="mt-14 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-ink/40" />
          <span className="font-serif-quote italic text-ink/70 text-sm tracking-widest">
            Free during open beta
          </span>
          <span className="h-px w-12 bg-ink/40" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  Footer
// ─────────────────────────────────────────────────────────────

function SiteFooter() {
  return (
    <footer className="relative bg-ivory border-t border-gold/30 py-16 overflow-hidden">
      {/* Scattered ornaments */}
      <span
        className="absolute left-[10%] top-1/2 -translate-y-1/2 font-display text-ink/10 select-none leading-none"
        style={{ fontSize: "7rem" }}
        aria-hidden="true"
      >
        {PIECES.pawn}
      </span>
      <span
        className="absolute right-[10%] top-1/2 -translate-y-1/2 font-display text-ink/10 select-none leading-none"
        style={{ fontSize: "7rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </span>
      <GoldStar className="absolute left-[30%] top-8 size-2 text-gold opacity-60" />
      <GoldStar className="absolute right-[30%] bottom-8 size-2 text-gold opacity-60" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col items-center text-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span
              className="font-display text-4xl text-emerald leading-none"
              aria-hidden="true"
            >
              {PIECES.queen}
            </span>
            <span className="font-display text-2xl tracking-wide text-ink">
              Pawn <span className="text-gold-deep italic">to</span> Queen
            </span>
          </Link>

          <p className="font-serif-quote italic text-ink/65 text-lg max-w-md">
            A second brain for ambitious chess players.
          </p>

          <GoldDivider className="w-72" />

          <nav className="flex flex-wrap items-center justify-center gap-8 text-[12px] tracking-[0.24em] uppercase text-ink/70">
            <a href="#features" className="hover:text-emerald transition-colors">
              Features
            </a>
            <a href="#journey" className="hover:text-emerald transition-colors">
              Roadmap
            </a>
            <a href="#why" className="hover:text-emerald transition-colors">
              About
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald transition-colors"
            >
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-3 mt-2 text-[12px] tracking-[0.24em] uppercase text-ink/55">
            <span>Made by</span>
            <span className="font-serif-quote italic text-gold-deep text-base normal-case tracking-normal">
              Isha
            </span>
            <span aria-hidden="true">·</span>
            <span>2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
