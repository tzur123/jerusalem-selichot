"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEventClient } from "@/lib/analytics/track-client";

/**
 * Fires a lightweight `page_view` event on every route change, site-wide.
 * Distinct from the named milestone events (`landing_viewed`, `tour_completed`,
 * etc.) fired via `TrackOnMount` — this one powers generic "pages viewed" /
 * "most visited pages" analytics regardless of entry point.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackEventClient("page_view", { metadata: { path: pathname } });
  }, [pathname]);

  return null;
}
