import { NextResponse } from "next/server";

import { debugSync } from "@/features/import/actions";

// GET /api/sync-debug — signed-in diagnostic for the Chess.com/Lichess import.
// Returns exactly what the sync sees so we can pinpoint why games aren't landing.
export async function GET() {
  // Diagnostic endpoint — never exposed in production. It returns raw
  // sync internals for a signed-in user and is only for local debugging.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await debugSync();
  return NextResponse.json(result);
}
