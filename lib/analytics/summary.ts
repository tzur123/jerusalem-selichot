import "server-only";
import { env } from "@/lib/config/env";
import { mockStore } from "@/lib/data/mock-store";
import { getAllStationsAdmin } from "@/lib/data/stations";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Station } from "@/types/station";

export type AnalyticsSummary = {
  homepageViews: number;
  totalPageViews: number;
  sessionsStarted: number;
  toursCompleted: number;
  completionRatePct: number;
  /** Average wall-clock time from start to finish, completed tours only. */
  avgTourDurationMs: number | null;
  /** Average time engaged with the app across every session (completed or abandoned). */
  avgEngagementMs: number | null;
  externalMapsClicks: number;
  locationGranted: number;
  locationDenied: number;
  startModeBreakdown: Array<{ mode: string; label: string; count: number }>;
  videoFunnel: {
    started: number;
    reached25: number;
    reached50: number;
    reached90: number;
    completed: number;
  };
  topPages: Array<{ path: string; views: number }>;
  perStation: Array<{
    stationId: string;
    stationName: string;
    arrived: number;
    scanned: number;
    videoStarted: number;
    videoCompleted: number;
  }>;
};

type NormalizedEvent = {
  eventName: string;
  stationId: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
};

type NormalizedSession = {
  startMode: string | null;
  startedAt: string;
  lastSeenAt: string;
  completedAt: string | null;
};

type NormalizedProgressRow = {
  stationId: string;
  arrivedAt: string | null;
  qrScannedAt: string | null;
  videoStartedAt: string | null;
  videoCompletedAt: string | null;
};

const START_MODE_LABELS: Record<string, string> = {
  nearest: "הנקודה הקרובה",
  recommended: "המסלול המומלץ",
  manual: "בחירה מהמפה",
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const stations = await getAllStationsAdmin();

  if (env.useMockBackend) {
    const events: NormalizedEvent[] = mockStore.events.map((e) => ({
      eventName: e.eventName,
      stationId: e.stationId,
      sessionId: e.sessionId,
      metadata: e.metadata,
    }));

    const sessions: NormalizedSession[] = Array.from(mockStore.sessions.values()).map((s) => ({
      startMode: s.startMode,
      startedAt: s.startedAt,
      lastSeenAt: s.lastSeenAt,
      completedAt: s.completedAt,
    }));

    const progressRows: NormalizedProgressRow[] = [];
    for (const sessionProgress of mockStore.progress.values()) {
      for (const p of sessionProgress.values()) {
        progressRows.push({
          stationId: p.stationId,
          arrivedAt: p.arrivedAt,
          qrScannedAt: p.qrScannedAt,
          videoStartedAt: p.videoStartedAt,
          videoCompletedAt: p.videoCompletedAt,
        });
      }
    }

    return buildSummary(stations, events, sessions, progressRows);
  }

  const supabase = getSupabaseAdminClient();

  const [{ data: eventRows }, { data: sessionRows }, { data: progressData }] = await Promise.all([
    supabase.from("analytics_events").select("event_name, station_id, session_id, metadata"),
    supabase.from("tour_sessions").select("start_mode, started_at, last_seen_at, completed_at"),
    supabase
      .from("session_station_progress")
      .select("station_id, arrived_at, qr_scanned_at, video_started_at, video_completed_at"),
  ]);

  const events: NormalizedEvent[] = (eventRows ?? []).map((e) => ({
    eventName: e.event_name,
    stationId: e.station_id,
    sessionId: e.session_id,
    metadata: (e.metadata as Record<string, unknown> | null) ?? null,
  }));

  const sessions: NormalizedSession[] = (sessionRows ?? []).map((s) => ({
    startMode: s.start_mode,
    startedAt: s.started_at,
    lastSeenAt: s.last_seen_at,
    completedAt: s.completed_at,
  }));

  const progressRows: NormalizedProgressRow[] = (progressData ?? []).map((p) => ({
    stationId: p.station_id,
    arrivedAt: p.arrived_at,
    qrScannedAt: p.qr_scanned_at,
    videoStartedAt: p.video_started_at,
    videoCompletedAt: p.video_completed_at,
  }));

  return buildSummary(stations, events, sessions, progressRows);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Shared aggregation over normalized data, regardless of backend. Per-station
 * funnel counts intentionally come from `session_station_progress` timestamps
 * (idempotent, first-write-wins) rather than raw event counts, since several
 * events (`video_started`, `station_completed`) fire from both client and
 * server and would otherwise double-count.
 */
function buildSummary(
  stations: Station[],
  events: NormalizedEvent[],
  sessions: NormalizedSession[],
  progressRows: NormalizedProgressRow[]
): AnalyticsSummary {
  let homepageViews = 0;
  let totalPageViews = 0;
  let externalMapsClicks = 0;
  let locationGranted = 0;
  let locationDenied = 0;

  const pageViewsByPath = new Map<string, number>();
  const videoStartedPairs = new Set<string>();
  const video25Pairs = new Set<string>();
  const video50Pairs = new Set<string>();
  const video90Pairs = new Set<string>();

  for (const event of events) {
    const pairKey = `${event.sessionId ?? "anon"}:${event.stationId ?? "none"}`;
    switch (event.eventName) {
      case "landing_viewed":
        homepageViews += 1;
        break;
      case "page_view": {
        totalPageViews += 1;
        const path = typeof event.metadata?.path === "string" ? event.metadata.path : "לא ידוע";
        pageViewsByPath.set(path, (pageViewsByPath.get(path) ?? 0) + 1);
        break;
      }
      case "open_google_maps_clicked":
        externalMapsClicks += 1;
        break;
      case "location_permission_granted":
        locationGranted += 1;
        break;
      case "location_permission_denied":
        locationDenied += 1;
        break;
      case "video_started":
        videoStartedPairs.add(pairKey);
        break;
      case "video_25":
        video25Pairs.add(pairKey);
        break;
      case "video_50":
        video50Pairs.add(pairKey);
        break;
      case "video_90":
        video90Pairs.add(pairKey);
        break;
      default:
        break;
    }
  }

  const sessionsStarted = sessions.length;
  const completedSessions = sessions.filter((s) => s.completedAt);
  const toursCompleted = completedSessions.length;
  const completionRatePct = sessionsStarted > 0 ? Math.round((toursCompleted / sessionsStarted) * 100) : 0;

  const tourDurations = completedSessions
    .map((s) => new Date(s.completedAt as string).getTime() - new Date(s.startedAt).getTime())
    .filter((ms) => Number.isFinite(ms) && ms > 0);
  const avgTourDurationMs = average(tourDurations);

  const engagementDurations = sessions
    .map((s) => new Date(s.completedAt ?? s.lastSeenAt).getTime() - new Date(s.startedAt).getTime())
    .filter((ms) => Number.isFinite(ms) && ms > 0);
  const avgEngagementMs = average(engagementDurations);

  const startModeCounts = new Map<string, number>();
  for (const s of sessions) {
    const mode = s.startMode ?? "manual";
    startModeCounts.set(mode, (startModeCounts.get(mode) ?? 0) + 1);
  }
  const startModeBreakdown = Array.from(startModeCounts.entries())
    .map(([mode, count]) => ({ mode, label: START_MODE_LABELS[mode] ?? mode, count }))
    .sort((a, b) => b.count - a.count);

  const videoCompletedTotal = progressRows.filter((p) => p.videoCompletedAt).length;

  const topPages = Array.from(pageViewsByPath.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const arrivedByStation = new Map<string, number>();
  const scannedByStation = new Map<string, number>();
  const videoStartedByStation = new Map<string, number>();
  const videoCompletedByStation = new Map<string, number>();

  for (const row of progressRows) {
    if (row.arrivedAt) arrivedByStation.set(row.stationId, (arrivedByStation.get(row.stationId) ?? 0) + 1);
    if (row.qrScannedAt) scannedByStation.set(row.stationId, (scannedByStation.get(row.stationId) ?? 0) + 1);
    if (row.videoStartedAt)
      videoStartedByStation.set(row.stationId, (videoStartedByStation.get(row.stationId) ?? 0) + 1);
    if (row.videoCompletedAt)
      videoCompletedByStation.set(row.stationId, (videoCompletedByStation.get(row.stationId) ?? 0) + 1);
  }

  const perStation = stations
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({
      stationId: s.id,
      stationName: s.name,
      arrived: arrivedByStation.get(s.id) ?? 0,
      scanned: scannedByStation.get(s.id) ?? 0,
      videoStarted: videoStartedByStation.get(s.id) ?? 0,
      videoCompleted: videoCompletedByStation.get(s.id) ?? 0,
    }));

  return {
    homepageViews,
    totalPageViews,
    sessionsStarted,
    toursCompleted,
    completionRatePct,
    avgTourDurationMs,
    avgEngagementMs,
    externalMapsClicks,
    locationGranted,
    locationDenied,
    startModeBreakdown,
    videoFunnel: {
      started: videoStartedPairs.size,
      reached25: video25Pairs.size,
      reached50: video50Pairs.size,
      reached90: video90Pairs.size,
      completed: videoCompletedTotal,
    },
    topPages,
    perStation,
  };
}
