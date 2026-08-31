import type { MetadataRoute } from "next";
import { STATION_ARTICLE_SLUGS } from "@/lib/content/station-articles";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Only the generic, publicly-shareable marketing pages belong here — every
 * other route reflects a visitor's personal tour session and is excluded
 * (see robots.ts) rather than indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/start`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/info`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...STATION_ARTICLE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/places/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/accessibility`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
