"use client";

import { useEffect, useRef } from "react";
import { trackEventClient } from "@/lib/analytics/track-client";
import type { AnalyticsEventName } from "@/lib/analytics/events";

export function TrackOnMount({
  name,
  stationId,
  metadata,
}: {
  name: AnalyticsEventName;
  stationId?: string;
  metadata?: Record<string, unknown>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEventClient(name, { stationId, metadata });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
