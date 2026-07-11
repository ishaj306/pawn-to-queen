import { LoginClient } from "../login-client";

// Optional catch-all so Clerk's OAuth / verification sub-paths
// (e.g. /login/sso-callback) resolve to this same Elements page
// instead of 404-ing. `force-dynamic` — Clerk Elements needs the
// ClerkProvider runtime context, which only exists at request time.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginClient />;
}
