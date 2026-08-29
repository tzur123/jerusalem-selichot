import "server-only";
import { env } from "@/lib/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/data/mock-store";
import { isAnalyticsEventName, type AnalyticsEventName } from "./events";

export type TrackEventInput = {
  name: AnalyticsEventName;
  sessionId?: string | null;
  stationId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Server-side analytics sink. Event names are whitelisted; never pass raw
 * GPS coordinates, IP addresses, or device fingerprints in `metadata`.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  if (!isAnalyticsEventName(input.name)) {
    throw new Error(`Unknown analytics event: ${input.name}`);
  }

  const metadata = sanitizeMetadata(input.metadata);

  if (env.useMockBackend) {
    mockStore.events.push({
      id: mockStore.nextEventId++,
      sessionId: input.sessionId ?? null,
      eventName: input.name,
      stationId: input.stationId ?? null,
      metadata,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("analytics_events").insert({
    session_id: input.sessionId ?? null,
    event_name: input.name,
    station_id: input.stationId ?? null,
    metadata,
  });
  if (error) throw error;
}

const FORBIDDEN_METADATA_KEYS = ["lat", "lng", "latitude", "longitude", "ip", "deviceId", "fingerprint"];

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | null {
  if (!metadata) return null;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.includes(key)) continue;
    clean[key] = value;
  }
  return clean;
}
