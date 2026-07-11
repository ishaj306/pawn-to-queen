import { NextResponse } from "next/server";

import { debugSync } from "@/features/import/actions";

// GET /api/sync-debug — signed-in diagnostic for the Chess.com/Lichess import.
// Returns exactly what the sync sees so we can pinpoint why games aren't landing.
export async function GET() {
  const result = await debugSync();
  return NextResponse.json(result);
}
