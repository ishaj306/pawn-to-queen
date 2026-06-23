import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Only public, indexable URLs. Protected dashboard routes are excluded
// since they require auth and shouldn't be in search results.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`,         lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/login`,    lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
    { url: `${SITE_URL}/signup`,   lastModified: now, changeFrequency: "yearly",  priority: 0.8 },
    { url: `${SITE_URL}/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
