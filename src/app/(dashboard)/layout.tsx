"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAuthStore } from "@/store/authStore";
import { Piece, type PieceType } from "@/components/shared/piece";

// ─────────────────────────────────────────────────────────────
//  Pawn to Queen — Dashboard Shell
//  Sidebar + main content area, journal-styled
// ─────────────────────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  piece: PieceType;
  ready?: boolean;
}

// 12 chapters of the journal, per the dashboard spec. All routes wired.
const NAV: NavItem[] = [
  { name: "Dashboard",      href: "/dashboard",    piece: "queen",  ready: true },
  { name: "Rating Tracker", href: "/ratings",      piece: "king",   ready: true },
  { name: "Games Log",      href: "/games",        piece: "rook",   ready: true },
  { name: "Puzzle Tracker", href: "/puzzles",      piece: "bishop", ready: true },
  { name: "Goals",          href: "/goals",        piece: "knight", ready: true },
  { name: "Study Planner",  href: "/study",        piece: "pawn",   ready: true },
  { name: "Journal",        href: "/journal",      piece: "bishop", ready: true },
  { name: "Achievements",   href: "/achievements", piece: "queen",  ready: true },
  { name: "Chess Wrapped",  href: "/wrapped",      piece: "queen",  ready: true },
  { name: "Statistics",     href: "/stats",        piece: "knight", ready: true },
  { name: "Calendar",       href: "/calendar",     piece: "rook",   ready: true },
  { name: "Profile",        href: "/profile",      piece: "king",   ready: true },
  { name: "Settings",       href: "/settings",     piece: "pawn",   ready: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: "/login" });
      router.refresh();
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const displayName =
    profile?.full_name || user?.fullName || user?.email?.split("@")[0] || "Player";
  const avatarLetter = displayName[0]?.toUpperCase() ?? "P";
  const displayRating = profile?.current_rating ?? 800;

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white border-r border-gold/40 sticky top-0 h-screen self-start">
        {/* Faint background ornament */}
        <Piece
          type="queen"
          color="green"
          size={288}
          className="pointer-events-none absolute -bottom-6 -left-10 opacity-[0.06] select-none"
        />

        {/* Brand */}
        <Link
          href="/dashboard"
          className="relative px-7 pt-8 pb-6 border-b border-gold/30 group"
        >
          <div className="flex items-center gap-3">
            <Piece type="queen" color="green" size={34} className="w-8 h-8 shrink-0" priority />
            <div>
              <p className="font-display text-[19px] text-ink leading-none">
                Pawn <span className="text-gold-deep italic">to</span> Queen
              </p>
              <p className="font-serif-quote italic text-gold-deep text-[11px] tracking-[0.22em] uppercase mt-1.5">
                Chess Growth OS
              </p>
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto scroll-luxury py-7 px-5">
          <p className="text-[10px] tracking-[0.32em] uppercase text-gold-deep font-medium mb-4 px-3">
            The Journal
          </p>
          <ul className="space-y-0.5">
            {NAV.map((item, i) => {
              const isActive = pathname === item.href;
              const isReady = item.ready;
              const content = (
                <span
                  className={`relative flex items-center gap-3 px-3 py-2.5 text-[13.5px] font-medium transition-colors rounded-sm ${
                    isActive
                      ? "bg-emerald/5 text-emerald"
                      : isReady
                        ? "text-ink/75 hover:text-emerald hover:bg-emerald/[0.03]"
                        : "text-ink/40 cursor-not-allowed"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-emerald rounded-r"
                      aria-hidden="true"
                    />
                  )}
                  <Piece
                    type={item.piece}
                    color={i % 2 === 0 ? "gold" : "green"}
                    size={22}
                    className={`w-5 h-5 shrink-0 transition-opacity ${
                      isActive ? "" : isReady ? "opacity-85 group-hover:opacity-100" : "opacity-30"
                    }`}
                  />
                  <span className="flex-1 font-sans">{item.name}</span>
                  {!isReady && (
                    <span className="text-[8.5px] tracking-[0.2em] uppercase text-gold-deep/70 bg-gold-light/40 px-1.5 py-0.5 rounded-sm">
                      Soon
                    </span>
                  )}
                </span>
              );

              return (
                <li key={item.name}>
                  {isReady ? (
                    <Link href={item.href} className="group block">
                      {content}
                    </Link>
                  ) : (
                    <div aria-disabled className="block">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom quote */}
        <div className="relative px-7 py-5 border-t border-gold/30">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="h-px flex-1 bg-gold-deep/35" />
            <span
              className="font-display text-base text-gold-deep leading-none"
              aria-hidden="true"
            >
              ❦
            </span>
            <span className="h-px flex-1 bg-gold-deep/35" />
          </div>
          <p className="font-serif-quote italic text-[14px] text-ink/75 text-center leading-snug">
            &ldquo;Every Master Was Once A Pawn.&rdquo;
          </p>
        </div>

        {/* User card */}
        <div className="relative px-5 py-4 border-t border-gold/30 bg-ivory/60 flex items-center justify-between gap-3">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 group">
            <div className="size-10 rounded-full bg-emerald text-ivory flex items-center justify-center font-display text-base shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[13px] text-ink truncate group-hover:text-emerald transition-colors">
                {displayName}
              </p>
              <p className="font-serif-quote italic text-gold-deep text-[11px]">
                Rating · {displayRating}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-ink/55 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <main className="flex-1 overflow-y-auto scroll-luxury">
          {children}
        </main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gold/40 flex items-center justify-around z-40">
        {NAV.filter((n) => n.ready)
          .slice(0, 5)
          .map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                  isActive ? "text-emerald" : "text-ink/55"
                }`}
              >
                <Piece
                  type={item.piece}
                  color={i % 2 === 0 ? "gold" : "green"}
                  size={24}
                  className={`w-6 h-6 transition-opacity ${isActive ? "" : "opacity-70"}`}
                />
                <span className="text-[9px] tracking-[0.16em] uppercase">
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
