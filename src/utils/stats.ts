import type { RatingEntryRow } from "@/types/database";

// Back-compat alias — older callers import { DbRatingEntry }. New code
// should import RatingEntryRow from @/types/database directly.
export type DbRatingEntry = RatingEntryRow;

/**
 * Calculates the current consecutive day streak of rating entries.
 */
export function calculateStreak(entries: DbRatingEntry[]): number {
  if (!entries || entries.length === 0) return 0;

  // Extract unique sorted dates (YYYY-MM-DD)
  const uniqueDates = Array.from(new Set(entries.map((e) => e.entry_date))).sort();
  
  // Get today and yesterday in local YYYY-MM-DD format
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(1);

  // Check if today or yesterday has an entry to keep the streak active
  const hasToday = uniqueDates.includes(todayStr);
  const hasYesterday = uniqueDates.includes(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    return 0;
  }

  // Traverse backwards to count consecutive days
  let streak = 0;
  let offset = hasToday ? 0 : 1;

  while (true) {
    const targetDateStr = getLocalDateString(offset);
    if (uniqueDates.includes(targetDateStr)) {
      streak++;
      offset++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates next rating milestone (900, 1000, 1100, 1200)
 */
export function getNextMilestone(currentRating: number): number {
  if (currentRating < 900) return 900;
  if (currentRating < 1000) return 1000;
  if (currentRating < 1100) return 1100;
  return 1200;
}

// ─── Shared title bands (Pawn → Queen) ─────────────────────────
// Order matters: highest threshold last.
export interface TitleBand {
  name: "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen";
  piece: string;
  threshold: number; // rating required to enter this band
}

export const TITLE_JOURNEY: TitleBand[] = [
  { name: "Pawn",   piece: "♙", threshold: 0    },
  { name: "Knight", piece: "♘", threshold: 500  },
  { name: "Bishop", piece: "♗", threshold: 1000 },
  { name: "Rook",   piece: "♖", threshold: 2000 },
  { name: "Queen",  piece: "♕", threshold: 5000 },
];

export function titleFor(rating: number): TitleBand {
  let band = TITLE_JOURNEY[0];
  for (const b of TITLE_JOURNEY) {
    if (rating >= b.threshold) band = b;
  }
  return band;
}

export function nextTitle(rating: number): TitleBand | null {
  const idx = TITLE_JOURNEY.findIndex(
    (b) => b.threshold > rating,
  );
  return idx === -1 ? null : TITLE_JOURNEY[idx];
}

// Major rating milestones for chart reference lines.
export const RATING_MILESTONES = [100, 200, 300, 500, 800, 1000, 1200, 1500];
