import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { AuthProvider } from "@/components/shared/auth-provider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pawn to Queen — Every Master Was Once A Pawn",
  description:
    "The personal operating system for chess improvement. Track ratings, games, puzzles, habits and insights — transform scattered practice into structured growth.",
};

// Theme the Clerk-hosted UI bits (UserButton, etc.) to match our luxury
// chess-journal palette. The bespoke sign-in / sign-up pages use Clerk
// Elements + our own AuthShell, so they don't read this — but the user
// button in the dashboard layout does.
const clerkAppearance = {
  variables: {
    colorPrimary: "#0E5A3C",
    colorText: "#111111",
    colorBackground: "#FAF8F2",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#111111",
    colorTextSecondary: "#4A463F",
    colorDanger: "#B7411E",
    colorSuccess: "#0E5A3C",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-inter), system-ui, sans-serif",
    fontSize: "15px",
    borderRadius: "0.125rem",
  },
  elements: {
    formButtonPrimary:
      "bg-emerald text-ivory hover:bg-emerald-deep transition-colors",
    card: "bg-white border border-gold/45",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={`${playfair.variable} ${cormorant.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-text-primary">
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
