"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Our sw.js calls skipWaiting()/clients.claim() unconditionally, so a
    // freshly-deployed worker takes over an already-open tab right away —
    // but the page's *own* JS/HTML was already loaded under the old
    // controller and won't update on its own. Reload once when control
    // switches over, so visitors who had the site open during a deploy
    // never get stuck seeing stale content/behaviour until they manually
    // clear the cache.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Nudge an update check now, then periodically — service workers
          // are normally only re-checked on navigation, which a
          // long-lived/backgrounded PWA tab may not do for a long time.
          registration.update().catch(() => {});
          setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch(() => {
          // PWA is a progressive enhancement — ignore registration failures.
        });
    });
  }, []);
  return null;
}
