import "server-only";
import { env } from "@/lib/config/env";
import { mockStore } from "@/lib/data/mock-store";
import { getAllStationsAdmin } from "@/lib/data/stations";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AnalyticsSummary = {
  sessionsStarted: number;
  toursCompleted: number;
  externalMapsClicks: number;
  perStation: Array<{
    stationId: string;
    stationName: string;
    scans: number;
    completions: number;
  }>;
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const stations = await getAllStationsAdmin();

  if (env.useMockBackend) {
    const scansByStation = new Map<string, number>();
    const completionsByStation = new Map<string, number>();
    let externalMapsClicks = 0;

    for (const event of mockStore.events) {
      if (event.eventName === "qr_scanned" && event.stationId) {
        scansByStation.set(event.stationId, (scansByStation.get(event.stationId) ?? 0) + 1);
      }
      if (event.eventName === "station_completed" && event.stationId) {
        completionsByStation.set(event.stationId, (completionsByStation.get(event.stationId) ?? 0) + 1);
      }
      if (event.eventName === "open_google_maps_clicked") externalMapsClicks += 1;
    }

    const sessionsStarted = mockStore.sessions.size;
    const toursCompleted = Array.from(mockStore.sessions.values()).filter((s) => s.completedAt).length;

    return {
      sessionsStarted,
      toursCompleted,
      externalMapsClicks,
      perStation: stations
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          stationId: s.id,
          stationName: s.name,
          scans: scansByStation.get(s.id) ?? 0,
          completions: completionsByStation.get(s.id) ?? 0,
        })),
    };
  }

  const supabase = getSupabaseAdminClient();

  const [{ count: sessionsStarted }, { count: toursCompleted }, { data: events }] = await Promise.all([
    supabase.from("tour_sessions").select("*", { count: "exact", head: true }),
    supabase.from("tour_sessions").select("*", { count: "exact", head: true }).not("completed_at", "is", null),
    supabase.from("analytics_events").select("event_name, station_id"),
  ]);

  const scansByStation = new Map<string, number>();
  const completionsByStation = new Map<string, number>();
  let externalMapsClicks = 0;

  for (const event of events ?? []) {
    if (event.event_name === "qr_scanned" && event.station_id) {
      scansByStation.set(event.station_id, (scansByStation.get(event.station_id) ?? 0) + 1);
    }
    if (event.event_name === "station_completed" && event.station_id) {
      completionsByStation.set(event.station_id, (completionsByStation.get(event.station_id) ?? 0) + 1);
    }
    if (event.event_name === "open_google_maps_clicked") externalMapsClicks += 1;
  }

  return {
    sessionsStarted: sessionsStarted ?? 0,
    toursCompleted: toursCompleted ?? 0,
    externalMapsClicks,
    perStation: stations
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        stationId: s.id,
        stationName: s.name,
        scans: scansByStation.get(s.id) ?? 0,
        completions: completionsByStation.get(s.id) ?? 0,
      })),
  };
}
