import { LoginClient } from "./login-client";

// Auth pages can't be statically prerendered because Clerk Elements
// depends on the ClerkProvider's runtime context (which only exists
// at request time). `force-dynamic` keeps Next from trying.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginClient />;
}
