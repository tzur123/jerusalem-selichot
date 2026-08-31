"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { GOOGLE_ADS_ID } from "@/lib/analytics/third-party";

/**
 * The Meta Pixel and Google tag <Script>s in the root layout each fire one
 * PageView on the initial document load. In-app navigation between routes is
 * client-side (no full reload), so without this, Meta/Google would only ever
 * see a single page view per visit. This fires the equivalent event on every
 * subsequent route change, skipping the first render to avoid double-counting
 * the view the boot scripts already reported.
 */
export function ThirdPartyPageViewTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
    window.gtag?.("event", "page_view", { page_path: pathname, send_to: GOOGLE_ADS_ID });
  }, [pathname]);

  return null;
}
