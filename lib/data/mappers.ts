import type { StationRow, TourSessionRow, SessionStationProgressRow } from "@/lib/supabase/types";
import type { Station } from "@/types/station";
import type { StationProgress, TourSession } from "@/types/session";

export function stationRowToStation(row: StationRow): Station {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    orderIndex: row.order_index,
    isDefaultStart: row.is_default_start,
    arrivalRadiusM: row.arrival_radius_m,
    videoPath: row.video_path,
    posterPath: row.poster_path,
    captionsPath: row.captions_path,
    isPublished: row.is_published,
  };
}

export function tourSessionRowToSession(row: TourSessionRow): TourSession {
  return {
    id: row.id,
    startMode: row.start_mode,
    startStationId: row.start_station_id,
    currentStationId: row.current_station_id,
    startedAt: row.started_at,
    lastSeenAt: row.last_seen_at,
    completedAt: row.completed_at,
  };
}

export function progressRowToProgress(row: SessionStationProgressRow): StationProgress {
  return {
    stationId: row.station_id,
    status: row.status,
    arrivedAt: row.arrived_at,
    qrScannedAt: row.qr_scanned_at,
    videoStartedAt: row.video_started_at,
    videoCompletedAt: row.video_completed_at,
    completedAt: row.completed_at,
  };
}
