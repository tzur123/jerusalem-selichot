import { haversineDistanceMeters, type LatLng } from "./haversine";

/**
 * Approximate meters-per-degree conversion good enough for short (<2km)
 * urban walking segments, used to project lat/lng onto a local planar
 * frame for point-to-segment distance math.
 */
function toLocalXY(origin: LatLng, point: LatLng): { x: number; y: number } {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (point.lng - origin.lng) * metersPerDegLng,
    y: (point.lat - origin.lat) * metersPerDegLat,
  };
}

function pointToSegmentDistanceMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const origin = a;
  const P = toLocalXY(origin, p);
  const A = { x: 0, y: 0 };
  const B = toLocalXY(origin, b);

  const ABx = B.x - A.x;
  const ABy = B.y - A.y;
  const APx = P.x - A.x;
  const APy = P.y - A.y;

  const abLenSq = ABx * ABx + ABy * ABy;
  const t = abLenSq === 0 ? 0 : Math.max(0, Math.min(1, (APx * ABx + APy * ABy) / abLenSq));

  const closest = { x: A.x + ABx * t, y: A.y + ABy * t };
  const dx = P.x - closest.x;
  const dy = P.y - closest.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Distance in meters from a point to the nearest segment of a polyline.
 * Falls back to a direct haversine distance if the polyline has < 2 points.
 */
export function distanceToPolylineMeters(point: LatLng, polyline: readonly LatLng[]): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineDistanceMeters(point, polyline[0]);

  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentDistanceMeters(point, polyline[i], polyline[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

export const REROUTE_CONFIG = {
  /** Distance (m) from the route polyline considered "off route". */
  offRouteThresholdMeters: 30,
  /** Consecutive off-route samples required before triggering a reroute. */
  offRouteSampleCount: 3,
  /** Minimum time (ms) between two reroutes. */
  cooldownMs: 20000,
  /** Do not reroute once this close to the destination (m). */
  suppressNearDestinationMeters: 40,
};

export type RerouteDecisionState = {
  consecutiveOffRouteSamples: number;
  lastRerouteAtMs: number | null;
};

export function createInitialRerouteState(): RerouteDecisionState {
  return { consecutiveOffRouteSamples: 0, lastRerouteAtMs: null };
}

/**
 * Pure decision function for whether a reroute should be triggered.
 * Mutates nothing; returns the next state + whether to reroute now.
 */
export function evaluateReroute(params: {
  state: RerouteDecisionState;
  distanceToPolylineMeters: number;
  distanceToDestinationMeters: number;
  nowMs: number;
  config?: typeof REROUTE_CONFIG;
}): { nextState: RerouteDecisionState; shouldReroute: boolean } {
  const config = params.config ?? REROUTE_CONFIG;
  const { state, distanceToPolylineMeters, distanceToDestinationMeters, nowMs } = params;

  if (distanceToDestinationMeters <= config.suppressNearDestinationMeters) {
    return {
      nextState: { ...state, consecutiveOffRouteSamples: 0 },
      shouldReroute: false,
    };
  }

  const isOffRoute = distanceToPolylineMeters > config.offRouteThresholdMeters;

  if (!isOffRoute) {
    return {
      nextState: { ...state, consecutiveOffRouteSamples: 0 },
      shouldReroute: false,
    };
  }

  const consecutiveOffRouteSamples = state.consecutiveOffRouteSamples + 1;

  const cooldownElapsed =
    state.lastRerouteAtMs === null || nowMs - state.lastRerouteAtMs >= config.cooldownMs;

  const shouldReroute = consecutiveOffRouteSamples >= config.offRouteSampleCount && cooldownElapsed;

  return {
    nextState: {
      consecutiveOffRouteSamples: shouldReroute ? 0 : consecutiveOffRouteSamples,
      lastRerouteAtMs: shouldReroute ? nowMs : state.lastRerouteAtMs,
    },
    shouldReroute,
  };
}
