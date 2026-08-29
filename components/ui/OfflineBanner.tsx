"use client";

import { useEffect, useRef, useState } from "react";

// `navigator.onLine` and the `online`/`offline` events are notoriously
// unreliable (they can report `false` even with a working connection, and
// browsers don't always fire `online` again on reconnect). To avoid a
// persistent false-positive banner, we treat those signals only as a hint
// and confirm real connectivity with a lightweight same-origin request
// before showing/hiding the banner, retrying periodically while "offline".
async function isActuallyOnline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      if (checkingRef.current) return;
      checkingRef.current = true;
      const online = await isActuallyOnline();
      checkingRef.current = false;
      if (!cancelled) setOffline(!online);
    }

    window.addEventListener("offline", runCheck);
    window.addEventListener("online", runCheck);

    // Initial check, deferred slightly so we don't flag a page still
    // finishing its own network setup as "offline". Then poll periodically
    // so we recover even if the browser never fires an `online` event.
    const initialTimer = setTimeout(runCheck, 300);
    const pollTimer = setInterval(runCheck, 15_000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(pollTimer);
      window.removeEventListener("offline", runCheck);
      window.removeEventListener("online", runCheck);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[100] bg-stone text-navy text-center text-sm font-bold py-2 safe-top"
    >
      אין חיבור לאינטרנט — חלק מהתכונות עלולות לא לפעול
    </div>
  );
}
