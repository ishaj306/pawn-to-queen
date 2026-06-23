import { ImageResponse } from "next/og";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Open Graph image
//  Renders to /opengraph-image at build time; used as the social
//  preview when the landing page is shared on Twitter, Slack, etc.
//  Built with Next's Edge-runtime image API (Satori under the hood).
// ─────────────────────────────────────────────────────────────

export const alt = "Pawn to Queen — Every Master Was Once A Pawn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          // Subtle vintage chessboard texture
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
        {/* Faded queen watermark */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -60,
            fontSize: 700,
            color: "rgba(230, 196, 106, 0.18)",
            lineHeight: 1,
            display: "flex",
          }}
        >
          ♕
        </div>

        {/* Faded pawn watermark */}
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -50,
            fontSize: 520,
            color: "rgba(14, 90, 60, 0.07)",
            lineHeight: 1,
            display: "flex",
          }}
        >
          ♟
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
            <span style={{ fontSize: 44, color: "#0E5A3C", lineHeight: 1, display: "flex" }}>♕</span>
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
