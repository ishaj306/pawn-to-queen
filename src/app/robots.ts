import type { MetadataRoute } from "next";

// Use NEXT_PUBLIC_SITE_URL when deployed to a real domain. Falls back to
// localhost during dev so the file always compiles.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Public surfaces only — protected dashboard routes shouldn't be crawled
        allow: ["/", "/login", "/signup", "/privacy", "/terms"],
        disallow: [
          "/dashboard",
          "/ratings",
          "/games",
          "/puzzles",
          "/goals",
          "/journal",
          "/study",
          "/achievements",
          "/stats",
          "/calendar",
          "/profile",
          "/settings",
          "/api",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
