import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        // Personal, session-scoped screens — not meaningful as generic search
        // results, and already marked noindex on the page itself.
        "/tour",
        "/scan",
        "/navigate/",
        "/station/",
        "/complete",
        "/q/",
        "/offline",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
