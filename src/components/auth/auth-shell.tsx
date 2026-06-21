import Link from "next/link";

// ─────────────────────────────────────────────────────────────
//  AUTH SHELL — Pawn to Queen
//  A premium chess-journal frame for Sign In / Sign Up / Reset
// ─────────────────────────────────────────────────────────────

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

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

function VerticalPieceColumn() {
  const pieces = [
    { glyph: PIECES.pawn, tone: "text-gold-deep" },
    { glyph: PIECES.knight, tone: "text-emerald" },
    { glyph: PIECES.bishop, tone: "text-gold-deep" },
    { glyph: PIECES.rook, tone: "text-emerald" },
    { glyph: PIECES.queen, tone: "text-gold-deep" },
  ];
  return (
    <div className="flex flex-col items-center gap-6">
      {pieces.map((p, i) => (
        <div key={i} className="flex flex-col items-center">
          <span
            className={`font-display text-4xl leading-none ${p.tone}`}
            aria-hidden="true"
          >
            {p.glyph}
          </span>
          {i < pieces.length - 1 && (
            <span className="block h-6 w-px bg-gold/40 mt-3" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-chessboard-faint text-ink overflow-hidden flex flex-col">
      {/* ─── Background engravings (faded chess pieces) ─── */}
      <div
        className="pointer-events-none absolute -top-20 -left-24 font-display text-gold/15 select-none leading-none hidden md:block"
        style={{ fontSize: "32rem" }}
        aria-hidden="true"
      >
        {PIECES.pawn}
      </div>
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 font-display text-emerald/10 select-none leading-none hidden lg:block"
        style={{ fontSize: "22rem" }}
        aria-hidden="true"
      >
        {PIECES.knight}
      </div>
      <div
        className="pointer-events-none absolute -top-20 -right-24 font-display text-emerald/15 select-none leading-none hidden md:block"
        style={{ fontSize: "32rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </div>
      <div
        className="pointer-events-none absolute top-1/3 -right-14 font-display text-gold/15 select-none leading-none hidden lg:block"
        style={{ fontSize: "16rem" }}
        aria-hidden="true"
      >
        {PIECES.bishop}
      </div>
      <div
        className="pointer-events-none absolute bottom-32 right-[10%] font-display text-gold-deep/15 select-none leading-none hidden lg:block"
        style={{ fontSize: "12rem" }}
        aria-hidden="true"
      >
        {PIECES.rook}
      </div>

      {/* Tiny scattered stars + crowns + pawns */}
      <GoldStar className="absolute top-24 left-[22%] size-3 text-gold opacity-70 hidden md:block" />
      <GoldStar className="absolute top-44 right-[20%] size-2.5 text-gold opacity-60 hidden md:block" />
      <GoldStar className="absolute bottom-40 left-[15%] size-2 text-gold opacity-60 hidden md:block" />
      <GoldStar className="absolute top-32 right-[30%] size-2 text-gold opacity-50 hidden md:block" />
      <Crown className="absolute top-20 left-[40%] w-7 h-5 text-gold-deep opacity-60 hidden lg:block" />
      <Crown className="absolute bottom-44 right-[28%] w-7 h-5 text-gold-deep opacity-60 hidden lg:block" />
      <Fleur className="absolute top-[55%] left-[6%] size-5 text-gold-deep opacity-50 hidden lg:block" />

      <span
        className="absolute bottom-44 left-[24%] font-display text-gold/35 leading-none select-none hidden md:block"
        style={{ fontSize: "3.5rem" }}
        aria-hidden="true"
      >
        {PIECES.pawn}
      </span>
      <span
        className="absolute top-44 left-[12%] font-display text-gold/35 leading-none select-none hidden md:block"
        style={{ fontSize: "3rem" }}
        aria-hidden="true"
      >
        {PIECES.pawn}
      </span>

      {/* ─── Top quote ─── */}
      <header className="relative z-10 pt-10 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 mb-6 group"
          >
            <span
              className="font-display text-2xl text-emerald leading-none"
              aria-hidden="true"
            >
              {PIECES.queen}
            </span>
            <span className="font-display tracking-wide text-[15px] text-ink group-hover:text-emerald transition-colors">
              Pawn <span className="text-gold-deep italic">to</span> Queen
            </span>
          </Link>

          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-gold-deep/60" />
            <Fleur className="size-4 text-gold-deep shrink-0" />
            <span className="h-px w-10 bg-gold-deep/60" />
          </div>

          <blockquote className="mt-5 font-serif-quote italic text-lg md:text-xl text-ink/80 leading-snug max-w-2xl mx-auto">
            &ldquo;The game of chess is not merely an idle amusement.&rdquo;
          </blockquote>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gold-deep/40" />
            <cite className="not-italic font-display tracking-[0.28em] uppercase text-[11px] text-gold-deep">
              Benjamin Franklin
            </cite>
            <span className="h-px w-8 bg-gold-deep/40" />
          </div>
        </div>
      </header>

      {/* ─── Center stage — card flanked by vertical piece column ─── */}
      <section className="relative z-10 flex-1 grid lg:grid-cols-[1fr_auto_8rem] items-center justify-items-center px-6 py-8 gap-10">
        <div /> {/* spacer for left column on lg */}
        <div className="w-full max-w-[460px]">{children}</div>
        <div className="hidden lg:block">
          <VerticalPieceColumn />
        </div>
      </section>

      {/* ─── Bottom gold strip ─── */}
      <footer className="relative z-10 bg-gold mt-10 py-10 px-6 overflow-hidden">
        <span
          className="absolute -left-6 top-1/2 -translate-y-1/2 font-display text-white/35 leading-none select-none hidden md:block"
          style={{ fontSize: "9rem" }}
          aria-hidden="true"
        >
          {PIECES.bishop}
        </span>
        <span
          className="absolute -right-6 top-1/2 -translate-y-1/2 font-display text-emerald/70 leading-none select-none hidden md:block"
          style={{ fontSize: "10rem" }}
          aria-hidden="true"
        >
          {PIECES.knight}
        </span>
        <GoldStar className="absolute top-6 right-[35%] size-3 text-white hidden md:block" />
        <GoldStar className="absolute bottom-6 left-[35%] size-2.5 text-white hidden md:block" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl text-ink leading-none">
            Track.{" "}
            <span className="italic text-emerald-deep">Learn.</span>{" "}
            Rise.
          </h2>
          <p className="mt-4 font-serif-quote italic text-ink/85 text-base md:text-lg">
            Your chess journey, organized and visualized.
          </p>
        </div>
      </footer>
    </div>
  );
}

export { GoldStar, Crown, Fleur, PIECES };
