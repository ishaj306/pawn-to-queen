import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Clerk proxy (Next.js 16 renamed middleware → proxy)
//  Replaces the previous Supabase session-refresh middleware.
// ─────────────────────────────────────────────────────────────

// Routes that require a signed-in user.
// /games and /puzzles intentionally left OPEN for now — they still use
// sample seed data. Add them here once Phase 3 wires them to Postgres.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/ratings(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/goals(.*)",
  "/journal(.*)",
  "/study(.*)",
  "/achievements(.*)",
  "/stats(.*)",
  "/calendar(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    // auth.protect() redirects unauthenticated users to the sign-in URL
    // configured in the Clerk dashboard (we set it to /login).
    await auth.protect();
  }
});

export const config = {
  // Clerk-recommended matcher: run on everything except Next internals
  // and static files. Always run for API routes.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
