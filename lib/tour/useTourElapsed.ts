"use client";

import { useEffect, useState } from "react";

/**
 * Elapsed milliseconds since the visitor's tour session started, ticking
 * once a second locally after a single cheap read of the session start
 * time — shared by the top-of-screen timer pill and the inline navigation
 * timer so both stay in sync without duplicating the fetch.
 */
export function useTourElapsedMs(active: boolean): number | null {
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
  return nowMs - startedAtMs;
}
