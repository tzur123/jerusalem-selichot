export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two points in meters.
 */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_M * c;
}

export type WithLatLng = { latitude: number; longitude: number };

/**
 * Finds the nearest item (e.g. station) to a given point.
 * Returns null for an empty list.
 */
export function findNearest<T extends WithLatLng>(
  point: LatLng,
  items: readonly T[]
): { item: T; distanceMeters: number } | null {
  let best: { item: T; distanceMeters: number } | null = null;

  for (const item of items) {
    const distanceMeters = haversineDistanceMeters(point, {
      lat: item.latitude,
      lng: item.longitude,
    });
    if (!best || distanceMeters < best.distanceMeters) {
      best = { item, distanceMeters };
    }
  }

  return best;
}

/** Rough walking speed estimate (meters/second) used before a real route ETA is known. */
export const AVERAGE_WALKING_SPEED_MPS = 1.3;

export function estimateWalkingSeconds(distanceMeters: number): number {
  return Math.round(distanceMeters / AVERAGE_WALKING_SPEED_MPS);
}
