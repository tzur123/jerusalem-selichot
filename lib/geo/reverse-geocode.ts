"use client";

import { loadGoogleMaps, isGoogleMapsConfigured } from "@/lib/google-maps/loader";

/**
 * Best-effort reverse geocode of a coordinate into a human-readable address.
 * Returns null if Google Maps isn't configured or the lookup fails — callers
 * should show a graceful fallback rather than blocking on this.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!isGoogleMapsConfigured()) return null;
  try {
    const google = await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    return results[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}
