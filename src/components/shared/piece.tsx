import type { CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────
//  <Piece> — a flat, single-colour chess-piece silhouette.
//
//  Rendered as the FILLED Unicode chess glyph (♚♛♜♝♞♟) tinted with a
//  brand colour. This is rock-solid — no image loading, no CSS masks,
//  no "square" fallbacks — and gives exactly the clean editorial
//  silhouette we want (green = emerald side, gold = gold side).
//
//  Same props as before, so every existing call site keeps working.
// ─────────────────────────────────────────────────────────────

export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type PieceColor = "gold" | "green";

const GLYPH: Record<PieceType, string> = {
  king: "♚",
  queen: "♛",
  rook: "♜",
  bishop: "♝",
  knight: "♞",
  pawn: "♟",
};

const FILL: Record<PieceColor, string> = {
  gold: "var(--gold-deep)",
  green: "var(--emerald)",
};

export function Piece({
  type,
  color = "gold",
  size = 24,
  className = "",
  style,
  alt,
}: {
  type: PieceType;
  color?: PieceColor;
  size?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  /** accepted for API compatibility; unused in glyph mode */
  priority?: boolean;
}) {
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`inline-flex items-center justify-center leading-none select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 1,
        color: FILL[color],
        fontFamily: 'var(--font-display), Georgia, "Times New Roman", serif',
        ...style,
      }}
    >
      {GLYPH[type]}
    </span>
  );
}
