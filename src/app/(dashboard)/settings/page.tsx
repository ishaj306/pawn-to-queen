"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { LogOut, Trash2, Loader2 } from "lucide-react";

import { getProfile, updateProfile } from "@/features/profile/actions";
import type { ProfileRow } from "@/types/database";

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

export default function SettingsPage() {
  const router = useRouter();
  const { signOut, user } = useClerk();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      setLoading(false);
    })();
  }, []);

  const togglePref = async (key: "notify_email" | "notify_push") => {
    if (!profile) return;
    setSavingPrefs(true);
    const next = !profile[key];
    setProfile({ ...profile, [key]: next });
    const res = await updateProfile({ [key]: next });
    if (!res.success) {
      // revert on failure
      setProfile({ ...profile, [key]: !next });
    } else {
      setSavedAt(Date.now());
    }
    setSavingPrefs(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ redirectUrl: "/login" });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await user.delete();
      router.push("/");
    } catch (err) {
      console.error("delete account error", err);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingShell />;

  return (
    <div className="relative bg-ivory">
      <span
        className="pointer-events-none absolute top-20 -right-12 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "24rem" }}
        aria-hidden="true"
      >
        {PIECES.king}
      </span>

      <div className="relative max-w-3xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-9">
        <FadeUp>
          <header className="pb-5 border-b border-gold/30">
            <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
              Configuration
            </p>
            <h1 className="font-display text-4xl text-ink leading-tight">
              <span className="italic text-emerald">Settings</span> & Account
            </h1>
            <p className="mt-2 font-serif-quote italic text-ink/65 text-base">
              The quiet preferences behind your journal.
            </p>
          </header>
        </FadeUp>

        {/* ─── Notification preferences ─── */}
        <FadeUp delay={0.05}>
          <Section eyebrow="Notifications" title="When we reach out">
            <ToggleRow
              label="Weekly Digest by Email"
              description="A short note every Sunday with last week's rating change, total puzzles solved, and longest streak."
              checked={profile?.notify_email ?? true}
              onChange={() => togglePref("notify_email")}
              disabled={savingPrefs}
            />
            <ToggleRow
              label="Browser Push"
              description="A nudge when you're about to break your streak (push notifications coming in a later release)."
              checked={profile?.notify_push ?? false}
              onChange={() => togglePref("notify_push")}
              disabled={savingPrefs}
            />
            {savedAt && (
              <motion.p
                key={savedAt}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif-quote italic text-[12px] text-gold-deep mt-2"
              >
                Saved ✓
              </motion.p>
            )}
          </Section>
        </FadeUp>

        {/* ─── Account ─── */}
        <FadeUp delay={0.05}>
          <Section eyebrow="Account" title="The keys to your journal">
            <Row
              label="Email"
              value={user?.primaryEmailAddress?.emailAddress ?? "—"}
            />
            <Row
              label="Signed in via"
              value="Clerk · Email"
            />
            <Row
              label="Member since"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
            />

            <div className="pt-5 border-t border-gold/30 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 bg-ink text-ivory px-5 py-2.5 text-[12px] tracking-[0.24em] uppercase hover:bg-ink/80 disabled:opacity-60 transition-colors rounded-sm"
              >
                {signingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Sign Out
              </button>
            </div>
          </Section>
        </FadeUp>

        {/* ─── Danger zone ─── */}
        <FadeUp delay={0.05}>
          <Section
            eyebrow="Danger Zone"
            title="Closing the book"
            destructive
          >
            <p className="font-serif-quote italic text-ink/65 text-[14px] mb-4 leading-relaxed">
              Deleting your account is permanent. Your profile, ratings, games,
              puzzles, goals, journal entries, study sessions and achievements
              are removed from the database. Clerk also removes your sign-in
              record.
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 bg-white text-destructive border border-destructive/40 px-5 py-2.5 text-[12px] tracking-[0.24em] uppercase hover:bg-destructive/5 transition-colors rounded-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            ) : (
              <div className="bg-destructive/8 border border-destructive/30 rounded-sm p-4 space-y-3">
                <p className="font-display text-sm text-destructive">
                  This cannot be undone.
                </p>
                <p className="font-serif-quote italic text-[13px] text-ink/65">
                  Are you certain? Your entire journal will be erased.
                </p>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 bg-destructive text-ivory px-5 py-2.5 text-[12px] tracking-[0.24em] uppercase hover:opacity-90 disabled:opacity-60 transition-opacity rounded-sm"
                  >
                    {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="px-5 py-2.5 text-[12px] tracking-[0.24em] uppercase text-ink/65 hover:text-emerald transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Section>
        </FadeUp>
      </div>
    </div>
  );
}

// ─── atoms ───

function Section({
  eyebrow,
  title,
  children,
  destructive,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <section
      className={`relative bg-white border ${destructive ? "border-destructive/30" : "border-gold/45"} rounded-sm p-7 lg:p-9 overflow-hidden`}
    >
      <span className={`absolute top-2 left-2 size-2 border-t border-l ${destructive ? "border-destructive/45" : "border-gold-deep/45"}`} />
      <span className={`absolute top-2 right-2 size-2 border-t border-r ${destructive ? "border-destructive/45" : "border-gold-deep/45"}`} />
      <span className={`absolute bottom-2 left-2 size-2 border-b border-l ${destructive ? "border-destructive/45" : "border-gold-deep/45"}`} />
      <span className={`absolute bottom-2 right-2 size-2 border-b border-r ${destructive ? "border-destructive/45" : "border-gold-deep/45"}`} />

      <div className="mb-5">
        <p
          className={`font-serif-quote italic ${destructive ? "text-destructive" : "text-gold-deep"} tracking-[0.28em] uppercase text-[11px] mb-1.5`}
        >
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl text-ink leading-tight">{title}</h2>
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="font-display text-base text-ink leading-tight">{label}</p>
        <p className="font-serif-quote italic text-[13px] text-ink/60 mt-1">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 border ${
          checked ? "bg-emerald border-gold" : "bg-ivory border-ink/20"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full transition-all ${
            checked
              ? "left-[1.5rem] bg-gold"
              : "left-0.5 bg-ink/40"
          }`}
        />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gold/20 last:border-0">
      <p className="text-[11px] tracking-[0.22em] uppercase text-ink/55">
        {label}
      </p>
      <p className="font-display text-[15px] text-ink truncate">{value}</p>
    </div>
  );
}

function FadeUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10 space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-ink/10 rounded" />
      <div className="h-48 bg-white border border-gold/30 rounded-sm" />
      <div className="h-56 bg-white border border-gold/30 rounded-sm" />
      <div className="h-40 bg-white border border-destructive/20 rounded-sm" />
    </div>
  );
}
