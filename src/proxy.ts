import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Clerk proxy (Next.js 16 renamed middleware → proxy)
// ─────────────────────────────────────────────────────────────

// Routes that require a signed-in user. /games and /puzzles now read /
// write Postgres (Phase 3) so they require auth too.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/ratings(.*)",
  "/games(.*)",
  "/puzzles(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/goals(.*)",
  "/journal(.*)",
  "/study(.*)",
  "/achievements(.*)",
  "/stats(.*)",
  "/calendar(.*)",
]);

// Auth routes — if you're already signed in, you shouldn't see these.
const isAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Signed-in user trying to reach login/signup — bounce to dashboard.
  // (Clerk Elements' SignIn.Root renders nothing when a session exists,
  //  so without this redirect the user would see an empty page.)
  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unsigned user trying to reach a protected route — bounce to login.
  if (isProtected(req) && !userId) {
    return NextResponse.redirect(new URL("/login", req.url));
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
