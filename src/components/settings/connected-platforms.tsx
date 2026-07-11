"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Check, AlertCircle } from "lucide-react";

import { updateProfile } from "@/features/profile/actions";
import { syncExternalGames, type SyncSummary } from "@/features/import/actions";
import type { ProfileRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Connected Platforms — link Chess.com / Lichess usernames and
//  pull games + ratings on demand. Removes the manual-entry tax.
// ─────────────────────────────────────────────────────────────

export function ConnectedPlatforms({ profile }: { profile: ProfileRow | null }) {
  const router = useRouter();
  const [cc, setCc] = useState(profile?.chess_com_username ?? "");
  const [li, setLi] = useState(profile?.lichess_username ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persist = () =>
    updateProfile({
      chess_com_username: cc.trim() || null,
      lichess_username: li.trim() || null,
    });

  const save = async () => {
    setSaving(true); setSaved(false); setError(null);
    const res = await persist();
    setSaving(false);
    if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2200); }
    else setError(res.error);
  };

  const sync = async () => {
    setSyncing(true); setSummary(null); setError(null);
    await persist(); // make sure the latest usernames are saved first
    const res = await syncExternalGames();
    setSyncing(false);
    if (!res.success) setError(res.error ?? "Sync failed.");
    else {
      setSummary(res);
      // Refresh server data so the freshly-imported games/ratings/puzzles
      // show across the app without a manual reload.
      router.refresh();
    }
  };

  const canSync = Boolean(cc.trim() || li.trim());

  return (
    <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9 overflow-hidden">
      <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
      <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
      <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
      <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

      <div className="mb-5">
        <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">
          Connected Platforms
        </p>
        <h2 className="font-display text-2xl text-ink leading-tight">Import your games</h2>
        <p className="mt-2 font-serif-quote italic text-ink/60 text-[14px] leading-relaxed">
          Link your accounts and pull recent games and ratings automatically — no re-typing.
          Both use public data, so no password is ever needed.
        </p>
      </div>

      <div className="space-y-4">
        <Field
          label="Chess.com username"
          glyph="♟"
          value={cc}
          onChange={setCc}
          placeholder="e.g. hikaru"
        />
        <Field
          label="Lichess username"
          glyph="♞"
          value={li}
          onChange={setLi}
          placeholder="e.g. DrNykterstein"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={sync}
          disabled={syncing || !canSync}
          className="inline-flex items-center gap-2 bg-emerald text-ivory px-5 py-2.5 text-[12px] tracking-[0.22em] uppercase hover:bg-emerald-deep disabled:opacity-50 transition-colors rounded-sm"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? "Syncing…" : "Sync now"}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.22em] uppercase text-ink/70 hover:text-emerald disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald" /> : null}
          {saved ? "Saved" : "Save only"}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-ink/45">
        Not importing?{" "}
        <a href="/api/sync-debug" target="_blank" rel="noopener" className="text-emerald hover:underline">
          Run diagnostic →
        </a>
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2 bg-destructive/8 border border-destructive/30 rounded-sm p-3.5">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="font-serif-quote italic text-[13px] text-ink/75">{error}</p>
        </div>
      )}

      {summary && summary.ranAny && (
        <div className="mt-5 bg-ivory/70 border border-gold/35 rounded-sm p-4 space-y-1.5">
          <p className="text-[10px] tracking-[0.24em] uppercase text-gold-deep font-medium mb-1">Sync complete</p>
          {summary.chesscom && (
            <ResultLine
              platform="Chess.com"
              newGames={summary.chesscom.newGames}
              error={summary.chesscom.error}
            />
          )}
          {summary.lichess && (
            <ResultLine
              platform="Lichess"
              newGames={summary.lichess.newGames}
              error={summary.lichess.error}
            />
          )}
          <p className="font-serif-quote italic text-[13px] text-ink/65 pt-1">
            {summary.ratingsLogged > 0
              ? `${summary.ratingsLogged} rating snapshot${summary.ratingsLogged === 1 ? "" : "s"} recorded for today.`
              : "Ratings already up to date for today."}
          </p>
          {summary.puzzlesLogged > 0 && (
            <p className="font-serif-quote italic text-[13px] text-ink/65">
              {summary.puzzlesLogged} puzzle{summary.puzzlesLogged === 1 ? "" : "s"} imported.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ResultLine({ platform, newGames, error }: { platform: string; newGames: number; error?: string }) {
  return (
    <p className="font-display text-[15px] text-ink flex items-center gap-2">
      <span className="text-gold-deep">{platform}:</span>
      {error ? (
        <span className="font-serif-quote italic text-destructive text-[13px]">{error}</span>
      ) : (
        <span className="text-ink/80">
          {newGames > 0 ? `${newGames} new game${newGames === 1 ? "" : "s"} imported` : "no new games"}
        </span>
      )}
    </p>
  );
}

function Field({
  label, glyph, value, onChange, placeholder,
}: {
  label: string;
  glyph: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.22em] uppercase text-ink/55 mb-1.5 block">{label}</span>
      <div className="flex items-center gap-2 bg-ivory border border-gold/40 rounded-sm px-3 focus-within:border-emerald transition-colors">
        <span className="font-display text-lg text-gold-deep leading-none" aria-hidden="true">{glyph}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="flex-1 bg-transparent py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-none font-sans"
        />
      </div>
    </label>
  );
}
