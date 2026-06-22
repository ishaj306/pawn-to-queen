import { redirect } from "next/navigation";

// Clerk Elements consolidates the password-reset flow inside the
// Sign In tree (as the `forgot-password` and `reset-password` steps).
// We keep `/forgot-password` as a URL for back-compat and shareable
// links — it just bounces to the sign-in page, where clicking
// "Forgot Password" advances to the reset step.

export default function ForgotPasswordPage() {
  redirect("/login");
}
