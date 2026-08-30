"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { formatClock } from "@/lib/utils/duration";

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Screens that represent an in-progress tour, where the running clock is relevant. */
function isOnActiveTourRoute(pathname: string): boolean {
  return (
    pathname === "/tour" ||
    pathname === "/scan" ||
    pathname.startsWith("/navigate/") ||
    pathname.startsWith("/station/")
  );
}

/**
 * Small floating pill that ticks up the elapsed time since the visitor's tour
 * session started. Reads the session once per route family (cheap, read-only
 * GET) and then counts locally so it doesn't hammer the server every second.
 */
export function TourTimer() {
  const pathname = usePathname();
  const active = isOnActiveTourRoute(pathname);

  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!active || startedAtMs != null) return;
    let cancelled = false;

    fetch("/api/session/start")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { session?: { startedAt?: string; completedAt?: string | null } } | null) => {
        if (cancelled || !data?.session?.startedAt || data.session.completedAt) return;
        setStartedAtMs(new Date(data.session.startedAt).getTime());
        setNowMs(Date.now());
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [active, startedAtMs]);

  useEffect(() => {
    if (startedAtMs == null) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAtMs]);

  if (!active || startedAtMs == null) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none pt-[max(0.75rem,var(--safe-top))]">
      <div
        className="glass-card pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-gold tabular-nums"
        role="timer"
        aria-label={`הזמן שחלף בסיור: ${formatClock(nowMs - startedAtMs)}`}
      >
        <ClockIcon />
        <span aria-hidden>{formatClock(nowMs - startedAtMs)}</span>
      </div>
    </div>
  );
}
