"use client";

import Link from "next/link";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { JournalCard } from "@/components/auth/auth-primitives";

// ─────────────────────────────────────────────────────────────
//  Sign Up — Clerk Elements inside the luxury journal chrome
// ─────────────────────────────────────────────────────────────

const labelCls =
  "block text-[11px] tracking-[0.22em] uppercase font-medium text-ink/65";
const inputCls =
  "mt-1.5 w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink font-sans placeholder:text-ink/30 focus:outline-none focus:border-emerald focus:ring-0 transition-colors data-[invalid]:border-destructive";
const errorCls = "block text-[12px] text-destructive font-sans mt-1";
const primaryBtnCls =
  "group w-full mt-2 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.28em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const googleBtnCls =
  "w-full inline-flex items-center justify-center gap-3 bg-white border border-ink/80 text-ink px-6 py-3.5 text-[12px] tracking-[0.24em] uppercase hover:bg-ink hover:text-ivory transition-colors";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-3">
      <span className="h-px flex-1 bg-gold/45" />
      <span className="text-[10px] tracking-[0.32em] uppercase text-gold-deep">
        Or
      </span>
      <span className="h-px flex-1 bg-gold/45" />
    </div>
  );
}

export function SignupClient() {
  return (
    <AuthShell>
      <SignUp.Root>
        {/* ─── START STEP ─── */}
        <SignUp.Step name="start">
          <JournalCard title="Begin Your Journey" eyebrow="Create your account">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <div className="space-y-5">
              <Clerk.Field name="firstName" className="block">
                <Clerk.Label className={labelCls}>Name</Clerk.Label>
                <Clerk.Input
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <Clerk.Field name="emailAddress" className="block">
                <Clerk.Label className={labelCls}>Email</Clerk.Label>
                <Clerk.Input
                  type="email"
                  placeholder="you@domain.com"
                  autoComplete="email"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <Clerk.Field name="password" className="block">
                <Clerk.Label className={labelCls}>Password</Clerk.Label>
                <Clerk.Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <SignUp.Captcha />

              <SignUp.Action submit className={primaryBtnCls}>
                <Clerk.Loading>
                  {(isLoading) =>
                    isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null
                  }
                </Clerk.Loading>
                Create Account
                <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </SignUp.Action>

              <OrDivider />

              <Clerk.Connection name="google" className={googleBtnCls}>
                <Clerk.Loading scope="provider:google">
                  {(isLoading) =>
                    isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )
                  }
                </Clerk.Loading>
                Continue With Google
              </Clerk.Connection>
            </div>

            <div className="mt-7 pt-5 border-t border-gold/35 text-center">
              <p className="text-[13px] text-ink/65 font-sans">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald font-medium underline-offset-4 hover:underline decoration-gold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </JournalCard>
        </SignUp.Step>

        {/* ─── VERIFICATIONS STEP — email code ─── */}
        <SignUp.Step name="verifications">
          <JournalCard title="Verify Your Email" eyebrow="Check your inbox">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <SignUp.Strategy name="email_code">
              <div className="space-y-5">
                <p className="font-serif-quote italic text-ink/65 text-sm text-center -mt-2 mb-2">
                  We&apos;ve sent a verification code to your email. Enter it
                  below to finish creating your journal.
                </p>

                <Clerk.Field name="code" className="block">
                  <Clerk.Label className={labelCls}>
                    Verification Code
                  </Clerk.Label>
                  <Clerk.Input
                    type="otp"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className={`${inputCls} font-display text-2xl text-emerald tracking-[0.4em] text-center`}
                  />
                  <Clerk.FieldError className={errorCls} />
                </Clerk.Field>

                <SignUp.Action submit className={primaryBtnCls}>
                  <Clerk.Loading>
                    {(isLoading) =>
                      isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null
                    }
                  </Clerk.Loading>
                  Verify Email
                  <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </SignUp.Action>

                <SignUp.Action
                  resend
                  className="block text-center text-[11px] tracking-[0.22em] uppercase text-ink/60 hover:text-emerald transition-colors pt-2"
                >
                  Didn&apos;t get it? Resend
                </SignUp.Action>
              </div>
            </SignUp.Strategy>
          </JournalCard>
        </SignUp.Step>

        {/* ─── CONTINUE STEP — Clerk sometimes needs extra fields after OAuth ─── */}
        <SignUp.Step name="continue">
          <JournalCard title="One More Detail" eyebrow="Almost there">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <div className="space-y-5">
              <Clerk.Field name="username" className="block">
                <Clerk.Label className={labelCls}>Choose a username</Clerk.Label>
                <Clerk.Input
                  type="text"
                  placeholder="grandmaster_in_training"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <SignUp.Action submit className={primaryBtnCls}>
                Finish
                <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </SignUp.Action>
            </div>
          </JournalCard>
        </SignUp.Step>
      </SignUp.Root>
    </AuthShell>
  );
}
