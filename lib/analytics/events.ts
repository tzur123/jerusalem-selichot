export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "landing_viewed",
  "tour_started",
  "location_permission_granted",
  "location_permission_denied",
  "nearest_station_shown",
  "start_station_selected",
  "navigation_started",
  "navigation_rerouted",
  "arrived_near_station",
  "qr_scanned",
  "station_unlocked",
  "video_started",
  "video_25",
  "video_50",
  "video_90",
  "station_completed",
  "next_station_clicked",
  "open_google_maps_clicked",
  "tour_completed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export function isAnalyticsEventName(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}
