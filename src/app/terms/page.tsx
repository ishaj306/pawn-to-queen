import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The polite agreement between you and Pawn to Queen — usage rules and the inevitable disclaimers.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "June 23, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <Header
          eyebrow="The Polite Agreement"
          title="Terms"
          subtitle="The rules of play between you and this journal."
        />

        <p className="text-[12px] tracking-[0.22em] uppercase text-gold-deep mb-12">
          Last updated · {LAST_UPDATED}
        </p>

        <Section title="What this is">
          <p>
            Pawn to Queen is a personal chess-improvement journal built as a
            portfolio project. By using it, you agree to these terms. If you
            don&apos;t, please don&apos;t use it.
          </p>
        </Section>

        <Section title="Your account">
          <ul>
            <li>You&apos;re responsible for keeping your sign-in credentials safe.</li>
            <li>One account per person. Don&apos;t share login info.</li>
            <li>
              You must be 13 or older to use Pawn to Queen. If you&apos;re
              between 13 and 18, please use it with parental consent.
            </li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>You won&apos;t:</p>
          <ul>
            <li>Try to break the app, scrape it, or run automated traffic against it.</li>
            <li>Upload content that&apos;s illegal, hateful, or violates someone else&apos;s rights.</li>
            <li>Pretend to be someone you&apos;re not.</li>
            <li>Use the service to harm or harass other users.</li>
          </ul>
          <p>
            We may suspend or delete accounts that do any of the above. You can
            also delete your account yourself at any time from{" "}
            <Link href="/settings" className="text-emerald hover:underline decoration-gold">
              Settings
            </Link>.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            The ratings, games, puzzles, goals, journal entries, study sessions
            and achievements you log are <b>yours</b>. We store them so the app
            can show them back to you. We don&apos;t claim ownership and we
            don&apos;t train AI models on your data.
          </p>
        </Section>

        <Section title="The app, as-is">
          <p>
            This is a portfolio project. It comes <em>as-is</em>, with no
            warranty. We try to keep it reliable, but we can&apos;t guarantee
            uptime, accuracy of stats, or freedom from bugs. Don&apos;t rely on
            it for anything mission-critical — back up data you care about.
          </p>
        </Section>

        <Section title="Limits of liability">
          <p>
            To the maximum extent allowed by law, the maintainer is not liable
            for indirect, incidental, or consequential damages from your use of
            Pawn to Queen — including lost ratings, missed tournaments, or
            cancelled chess careers (we wish).
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You can leave anytime via Settings → Delete Account. We can also
            end your access if you violate these terms or if we discontinue the
            project. We&apos;ll give reasonable notice when possible.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            If the terms change in a meaningful way, we&apos;ll update the date
            above and flag it inside the app the next time you sign in. Continued
            use after that means you accept the new terms.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are interpreted under the laws of India unless local
            consumer-protection law overrides this for you.
          </p>
        </Section>

        <Footer />
      </div>
    </main>
  );
}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl text-ink mb-4">{title}</h2>
      <div className="prose-luxury font-sans text-[15.5px] text-ink/80 leading-relaxed space-y-3 [&_b]:text-ink [&_b]:font-semibold [&_em]:text-gold-deep [&_em]:not-italic [&_em]:tracking-wider [&_ul]:list-none [&_ul]:space-y-2 [&_li]:pl-5 [&_li]:relative [&_li]:before:content-['❦'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-0 [&_li]:before:text-gold-deep [&_li]:before:text-[10px]">
        {children}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <div className="mt-12 pt-8 border-t border-gold/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] tracking-[0.22em] uppercase text-ink/55">
      <span>♕ Pawn to Queen</span>
      <div className="flex items-center gap-5">
        <Link href="/privacy" className="hover:text-emerald transition-colors">Privacy</Link>
        <Link href="/" className="hover:text-emerald transition-colors">Home</Link>
      </div>
    </div>
  );
}
