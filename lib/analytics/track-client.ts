"use client";

import type { AnalyticsEventName } from "./events";

/**
 * Fire-and-forget client-side analytics call. Never include GPS coordinates.
 */
export function trackEventClient(
  name: AnalyticsEventName,
  opts?: { stationId?: string; metadata?: Record<string, unknown> }
): void {
  try {
    const body = JSON.stringify({ name, stationId: opts?.stationId, metadata: opts?.metadata });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics must never break the user flow.
  }
}
