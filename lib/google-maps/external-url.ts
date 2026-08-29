import type { LatLng } from "@/lib/geo/haversine";

/**
 * Builds a Google Maps URL that opens full walking navigation in the
 * Google Maps app (or maps.google.com on desktop), per
 * https://developers.google.com/maps/documentation/urls/get-started
 */
export function buildGoogleMapsWalkingUrl(destination: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "walking",
    dir_action: "navigate",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
