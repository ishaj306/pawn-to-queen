import { getPuzzles } from "@/features/puzzles/actions";
import PuzzlesClient from "./puzzles-client";

// Server component: fetch puzzle sessions on the server (per-user cached)
// and pass them to the interactive client as initial data.
export default async function PuzzlesPage() {
  const puzzles = await getPuzzles();
  return <PuzzlesClient initialPuzzles={puzzles} />;
}
