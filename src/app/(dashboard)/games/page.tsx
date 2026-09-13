import { getGames } from "@/features/games/actions";
import GamesClient from "./games-client";

// Server component: fetch the user's games on the server (cached per-user
// in getGames) and hand them to the interactive client as initial data.
// The route's loading.tsx streams while this awaits.
export default async function GamesPage() {
  const games = await getGames();
  return <GamesClient initialGames={games} />;
}
