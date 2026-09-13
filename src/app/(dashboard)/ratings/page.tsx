import { getRatingEntries } from "@/features/ratings/actions";
import RatingsClient from "./ratings-client";

// Server component: fetch rating entries on the server (per-user cached)
// and pass them to the interactive client as initial data.
export default async function RatingsPage() {
  const entries = await getRatingEntries();
  return <RatingsClient initialEntries={entries} />;
}
