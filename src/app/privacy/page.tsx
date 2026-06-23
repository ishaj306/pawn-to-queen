import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Pawn to Queen handles your data — what we collect, where it lives, and your rights.",
  alternates: { canonical: "/privacy" },
};

// Light-touch privacy page. Calibrated for portfolio scope — if this
// ever ships to real users at scale, replace with policy from Termly,
// iubenda, or a legal advisor.

const LAST_UPDATED = "June 23, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <Header
          eyebrow="The Fine Print"
          title="Privacy"
          subtitle="What we collect, where it lives, and the lines we don’t cross."
        />

        <p className="text-[12px] tracking-[0.22em] uppercase text-gold-deep mb-12">
          Last updated · {LAST_UPDATED}
        </p>

        <Section title="What this is">
          <p>
            Pawn to Queen is a personal chess-improvement journal. You sign in,
            log ratings, games, puzzles, study sessions and journal entries.
            Everything is associated with your account; we never sell, rent,
            or trade your data.
          </p>
        </Section>

        <Section title="Data we collect">
          <ul>
            <li>
              <b>Account info</b> — your name, email, and authentication metadata,
              handled by <ExtLink href="https://clerk.com">Clerk</ExtLink>.
            </li>
            <li>
              <b>Activity data</b> — ratings, games, puzzles, goals, journal
              entries, study sessions and achievements you create. Stored in our
              <ExtLink href="https://supabase.com"> Supabase</ExtLink> Postgres database.
            </li>
            <li>
              <b>Usage analytics (optional)</b> — anonymous page views and event
              counts via <ExtLink href="https://posthog.com">PostHog</ExtLink> when
              the keys are configured. No personally identifying content is
              transmitted — just route names and event types.
            </li>
            <li>
              <b>Logs</b> — standard server logs (request paths, status codes,
              timestamps) retained for short periods to diagnose errors.
            </li>
          </ul>
        </Section>

        <Section title="What we don't collect">
          <ul>
            <li>We don&apos;t track you across the web.</li>
            <li>We don&apos;t fingerprint your device.</li>
            <li>We don&apos;t sell or share your data with advertisers.</li>
            <li>We don&apos;t read your journal entries — they&apos;re yours.</li>
          </ul>
        </Section>

        <Section title="Where data lives">
          <p>
            Clerk hosts your authentication record (US/EU regions depending on
            their setup). Supabase hosts your activity data (region you chose
            when creating the project). The app itself runs on Vercel&apos;s edge
            network. All connections are encrypted in transit via HTTPS.
          </p>
        </Section>

        <Section title="Your rights">
          <ul>
            <li>
              <b>Export</b> — every table in your account is a simple Postgres
              row. Email the maintainer and we&apos;ll send a JSON dump.
            </li>
            <li>
              <b>Delete</b> — Settings → Danger Zone → Delete Account. This
              wipes your profile, ratings, games, puzzles, goals, journal,
              study sessions, achievements and your Clerk record in one motion.
              It cannot be undone.
            </li>
            <li>
              <b>Correct / update</b> — most fields are editable from the app
              directly (Profile page).
            </li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p>
            Clerk uses essential cookies to keep you signed in. PostHog uses a
            single first-party cookie to deduplicate sessions for analytics
            counts. No third-party advertising cookies are set.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we change how data is collected, we update this page and the
            <em> Last updated</em> date above. Material changes will be flagged
            on the dashboard the next time you sign in.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Reach the maintainer via the GitHub repo. This is a
            portfolio project — there&apos;s no support team — but messages are
            read.
          </p>
        </Section>

        <Footer />
      </div>
    </main>
  );
}

// ─── Shared atoms (kept inline; this page has no other consumers) ───

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-10 pb-7 border-b border-gold/30">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-ink/55 hover:text-emerald transition-colors mb-6"
      >
        ← Back to Landing
      </Link>
      <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
        {eyebrow}
      </p>
      <h1 className="font-display text-5xl text-ink leading-tight">
        <span className="italic text-emerald">{title}</span>
      </h1>
      <p className="mt-3 font-serif-quote italic text-lg text-ink/65">
        {subtitle}
      </p>
    </header>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl text-ink mb-4">{title}</h2>
      <div className="prose-luxury font-sans text-[15.5px] text-ink/80 leading-relaxed space-y-3 [&_b]:text-ink [&_b]:font-semibold [&_em]:text-gold-deep [&_em]:not-italic [&_em]:tracking-wider [&_ul]:list-none [&_ul]:space-y-2 [&_li]:pl-5 [&_li]:relative [&_li]:before:content-['❦'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-0 [&_li]:before:text-gold-deep [&_li]:before:text-[10px]">
        {children}
      </div>
    </section>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-emerald underline-offset-2 hover:underline decoration-gold"
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <div className="mt-12 pt-8 border-t border-gold/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] tracking-[0.22em] uppercase text-ink/55">
      <span>♕ Pawn to Queen</span>
      <div className="flex items-center gap-5">
        <Link href="/terms" className="hover:text-emerald transition-colors">Terms</Link>
        <Link href="/" className="hover:text-emerald transition-colors">Home</Link>
      </div>
    </div>
  );
}
