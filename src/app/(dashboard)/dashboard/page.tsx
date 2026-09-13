import { getChessData } from "@/features/chess-data/actions";
import DashboardClient from "./dashboard-client";

// Server component: pull the unified dataset on the server (each getter is
// per-user cached) and hand it to the client, which derives every stat via
// computeChessStats. The route's loading.tsx streams while this awaits.
export default async function DashboardPage() {
  const data = await getChessData();
  return <DashboardClient initialData={data} />;
}
