"use client";

import Link from "next/link";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { JournalCard } from "@/components/auth/auth-primitives";

// ─────────────────────────────────────────────────────────────
//  Sign In — Clerk Elements inside the luxury journal chrome
// ─────────────────────────────────────────────────────────────

// Class tokens for inputs / buttons / errors — reused across steps
const labelCls =
  "block text-[11px] tracking-[0.22em] uppercase font-medium text-ink/65";
const inputCls =
  "mt-1.5 w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink font-sans placeholder:text-ink/30 focus:outline-none focus:border-emerald focus:ring-0 transition-colors data-[invalid]:border-destructive";
const errorCls = "block text-[12px] text-destructive font-sans mt-1";
const primaryBtnCls =
  "group w-full mt-2 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.28em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const ghostBtnCls =
  "text-[11px] tracking-[0.22em] uppercase text-ink/60 hover:text-emerald transition-colors";
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

export function LoginClient() {
  return (
    <AuthShell>
      <SignIn.Root routing="virtual">
        {/* ─── START STEP — identifier (email) + OAuth ─── */}
        <SignIn.Step name="start">
          <JournalCard title="Sign In To Your Journal" eyebrow="Welcome back">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <div className="space-y-5">
              <Clerk.Field name="identifier" className="block">
                <Clerk.Label className={labelCls}>Email</Clerk.Label>
                <Clerk.Input
                  type="email"
                  placeholder="you@domain.com"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <SignIn.Action
                submit
                className={primaryBtnCls}
              >
                <Clerk.Loading>
                  {(isLoading) =>
                    isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null
                  }
                </Clerk.Loading>
                Continue
                <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </SignIn.Action>

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
                New here?{" "}
                <Link
                  href="/signup"
                  className="text-emerald font-medium underline-offset-4 hover:underline decoration-gold"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </JournalCard>
        </SignIn.Step>

        {/* ─── VERIFICATIONS STEP — password OR email code ─── */}
        <SignIn.Step name="verifications">
          <JournalCard title="Confirm It's You" eyebrow="One more step">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <SignIn.Strategy name="password">
              <div className="space-y-5">
                <Clerk.Field name="password" className="block">
                  <div className="flex items-center justify-between">
                    <Clerk.Label className={labelCls}>Password</Clerk.Label>
                    <SignIn.Action
                      navigate="forgot-password"
                      className="text-[11px] tracking-[0.22em] uppercase text-gold-deep hover:text-emerald transition-colors"
                    >
                      Forgot Password
                    </SignIn.Action>
                  </div>
                  <Clerk.Input
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  <Clerk.FieldError className={errorCls} />
                </Clerk.Field>

                <SignIn.Action submit className={primaryBtnCls}>
                  <Clerk.Loading>
                    {(isLoading) =>
                      isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null
                    }
                  </Clerk.Loading>
                  Sign In
                  <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </SignIn.Action>
              </div>
            </SignIn.Strategy>

            <SignIn.Strategy name="email_code">
              <div className="space-y-5">
                <p className="font-serif-quote italic text-ink/65 text-sm text-center -mt-2 mb-2">
                  We sent a code to your email. Enter it below.
                </p>
                <Clerk.Field name="code" className="block">
                  <Clerk.Label className={labelCls}>
                    Verification Code
                  </Clerk.Label>
                  <Clerk.Input
                    type="otp"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className={`${inputCls} font-display text-2xl text-emerald tracking-[0.4em]`}
                  />
                  <Clerk.FieldError className={errorCls} />
                </Clerk.Field>

                <SignIn.Action submit className={primaryBtnCls}>
                  Verify
                </SignIn.Action>
              </div>
            </SignIn.Strategy>
          </JournalCard>
        </SignIn.Step>

        {/* ─── FORGOT PASSWORD STEP ─── */}
        <SignIn.Step name="forgot-password">
          <JournalCard title="Recover Your Account" eyebrow="A small detour">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <p className="text-[13.5px] text-ink/70 font-sans leading-relaxed text-center mb-5">
              We&apos;ll send a verification code to your email so you can choose
              a new password.
            </p>

            <div className="space-y-5">
              <SignIn.SupportedStrategy
                name="reset_password_email_code"
                asChild
              >
                <button type="button" className={primaryBtnCls}>
                  Send Reset Code
                  <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </button>
              </SignIn.SupportedStrategy>

              <SignIn.Action
                navigate="start"
                className={`${ghostBtnCls} block text-center pt-2`}
              >
                ← Back to Sign In
              </SignIn.Action>
            </div>
          </JournalCard>
        </SignIn.Step>

        {/* ─── RESET PASSWORD STEP ─── */}
        <SignIn.Step name="reset-password">
          <JournalCard title="Set A New Password" eyebrow="Almost there">
            <Clerk.GlobalError className="block bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm mb-4" />

            <div className="space-y-5">
              <Clerk.Field name="password" className="block">
                <Clerk.Label className={labelCls}>New Password</Clerk.Label>
                <Clerk.Input
                  type="password"
                  placeholder="••••••••"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <Clerk.Field name="confirmPassword" className="block">
                <Clerk.Label className={labelCls}>
                  Confirm New Password
                </Clerk.Label>
                <Clerk.Input
                  type="password"
                  placeholder="••••••••"
                  className={inputCls}
                />
                <Clerk.FieldError className={errorCls} />
              </Clerk.Field>

              <SignIn.Action submit className={primaryBtnCls}>
                Reset Password
                <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </SignIn.Action>
            </div>
          </JournalCard>
        </SignIn.Step>
      </SignIn.Root>
    </AuthShell>
  );
}
