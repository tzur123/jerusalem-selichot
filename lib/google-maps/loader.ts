"use client";

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<typeof google> | null = null;
let optionsSet = false;

/**
 * Loads the Google Maps JavaScript API exactly once, only on screens that
 * need it (never on the landing page). Returns the `google` global.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY is not configured."));
  }

  if (!optionsSet) {
    setOptions({ key, v: "weekly" });
    optionsSet = true;
  }

  if (!loaderPromise) {
    loaderPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("geometry"),
      importLibrary("places"),
      importLibrary("routes"),
    ]).then(() => window.google);
  }

  return loaderPromise;
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);
}
