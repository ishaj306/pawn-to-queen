import { ImageResponse } from "next/og";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Open Graph image
//
//  Rendered on-demand at request time (Next's Edge-runtime OG API,
//  Satori under the hood). Satori uses a bundled font that DOESN'T
//  include the Miscellaneous Symbols block (♕ ♟ etc.), and its
//  dynamic-font lookup returns 400 on those chars — so we use inline
//  SVG shapes for the chess-piece silhouettes instead. Every glyph is
//  pure vector, no font needed.
// ─────────────────────────────────────────────────────────────

export const alt = "Pawn to Queen — Every Master Was Once A Pawn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A stylized crown shape (stand-in for the queen). Uses `fill="currentColor"`
// so the enclosing div's `color` controls the paint.
function CrownSVG({ size: s, color }: { size: number; color: string }) {
  return (
    <svg
      width={s}
      height={(s * 0.7) | 0}
      viewBox="0 0 100 70"
      style={{ display: "flex", color }}
    >
      <path
        fill="currentColor"
        d="M10 50 L25 20 L35 40 L50 10 L65 40 L75 20 L90 50 L85 60 L15 60 Z"
      />
      <circle cx="25" cy="20" r="5" fill="currentColor" />
      <circle cx="50" cy="10" r="6" fill="currentColor" />
      <circle cx="75" cy="20" r="5" fill="currentColor" />
    </svg>
  );
}

// A rounded pawn silhouette.
function PawnSVG({ size: s, color }: { size: number; color: string }) {
  return (
    <svg
      width={s}
      height={(s * 1.4) | 0}
      viewBox="0 0 100 140"
      style={{ display: "flex", color }}
    >
      <circle cx="50" cy="30" r="22" fill="currentColor" />
      <path
        fill="currentColor"
        d="M35 52 Q50 62 65 52 L60 78 L40 78 Z"
      />
      <path
        fill="currentColor"
        d="M30 82 L70 82 L78 130 L22 130 Z"
      />
    </svg>
  );
}

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FAF8F2",
          backgroundImage: `
            linear-gradient(45deg, rgba(17,17,17,0.025) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(17,17,17,0.025) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(17,17,17,0.025) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(17,17,17,0.025) 75%)
          `,
          backgroundSize: "120px 120px",
          backgroundPosition: "0 0, 0 60px, 60px -60px, -60px 0",
          padding: "70px 80px",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Faded queen (crown) watermark — top right */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -80,
            display: "flex",
            opacity: 0.18,
          }}
        >
          <CrownSVG size={700} color="#E6C46A" />
        </div>

        {/* Faded pawn watermark — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -60,
            display: "flex",
            opacity: 0.09,
          }}
        >
          <PawnSVG size={360} color="#0E5A3C" />
        </div>

        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#B8923F",
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            fontStyle: "italic",
            marginBottom: 30,
          }}
        >
          <div style={{ width: 60, height: 1, backgroundColor: "#B8923F", display: "flex" }} />
          <span>Pawn to Queen</span>
          <div style={{ width: 60, height: 1, backgroundColor: "#B8923F", display: "flex" }} />
        </div>

        {/* Headline */}
        <div
          style={{
            color: "#111111",
            fontSize: 110,
            fontWeight: 700,
            lineHeight: 1.05,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 30,
          }}
        >
          <span>Every Master</span>
          <span>
            Was Once <span style={{ color: "#0E5A3C", fontStyle: "italic" }}>A Pawn</span>.
          </span>
        </div>

        {/* Subhead */}
        <div
          style={{
            color: "rgba(17,17,17,0.7)",
            fontSize: 32,
            fontStyle: "italic",
            lineHeight: 1.3,
            maxWidth: 800,
            display: "flex",
          }}
        >
          The personal operating system for chess improvement.
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 80,
            right: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ display: "flex" }}>
              <CrownSVG size={50} color="#0E5A3C" />
            </div>
            <span style={{ fontSize: 24, color: "#111111", display: "flex" }}>
              Pawn <span style={{ color: "#B8923F", fontStyle: "italic", margin: "0 6px", display: "flex" }}>to</span> Queen
            </span>
          </div>
          <div
            style={{
              fontSize: 16,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#B8923F",
              display: "flex",
            }}
          >
            Chess Growth OS
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
