// Stashes the format inside the entry's `notes` until the rating_entries
// table gains a real `format` column. The token sits at the very start
// of the notes string and never leaks into the displayed text.

export const RATING_FORMATS = ["Rapid", "Blitz", "Bullet", "Daily"] as const;
export type RatingFormat = (typeof RATING_FORMATS)[number];

const TOKEN = /^\[fmt:(rapid|blitz|bullet|daily)\]\n?/i;

export function encodeFormatInNotes(
  format: RatingFormat,
  notes: string,
): string {
  return `[fmt:${format.toLowerCase()}]${notes ? "\n" + notes : ""}`;
}

export function decodeFormatFromNotes(notes: string | null | undefined): {
  format: RatingFormat;
  notes: string;
} {
  if (!notes) return { format: "Rapid", notes: "" };
  const m = notes.match(TOKEN);
  if (!m) return { format: "Rapid", notes };
  const fmt = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return {
    format: fmt as RatingFormat,
    notes: notes.replace(TOKEN, ""),
  };
}
