"use client";

import { loadGoogleMaps } from "./loader";
import type { LatLng } from "@/lib/geo/haversine";

export type WalkingRoute = {
  distanceMeters: number;
  durationSeconds: number;
  polyline: LatLng[];
  steps: Array<{
    instruction: string;
    distanceMeters: number;
    start: LatLng;
    end: LatLng;
    /** Google's maneuver hint (e.g. "turn-left", "turn-slight-right",
     * "straight") — empty on the first ("depart") step. Drives which way
     * the arrow icon points, independent of the instruction's language. */
    maneuver: string;
  }>;
};

export class RouteUnavailableError extends Error {
  constructor(message = "לא ניתן היה לחשב מסלול הליכה") {
    super(message);
    this.name = "RouteUnavailableError";
  }
}

/**
 * Computes a walking route between two points using the Google Maps
 * DirectionsService, normalized into a stack-agnostic `WalkingRoute`.
 * All Google-specific types stay inside this module.
 */
export async function computeWalkingRoute(origin: LatLng, destination: LatLng): Promise<WalkingRoute> {
  const google = await loadGoogleMaps();
  const directionsService = new google.maps.DirectionsService();

  const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: false,
      },
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          resolve(response);
        } else {
          reject(new RouteUnavailableError());
        }
      }
    );
  });

  const route = result.routes[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) throw new RouteUnavailableError();

  const polyline: LatLng[] = route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));

  const steps = leg.steps.map((step) => ({
    instruction: stripHtml(step.instructions),
    distanceMeters: step.distance?.value ?? 0,
    start: { lat: step.start_location.lat(), lng: step.start_location.lng() },
    end: { lat: step.end_location.lat(), lng: step.end_location.lng() },
    maneuver: step.maneuver ?? "",
  }));

  return {
    distanceMeters: leg.distance?.value ?? 0,
    durationSeconds: leg.duration?.value ?? 0,
    polyline,
    steps,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
