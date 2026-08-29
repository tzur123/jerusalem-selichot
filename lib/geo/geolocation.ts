"use client";

export type GeoPosition = {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

export class GeolocationUnavailableError extends Error {
  constructor() {
    super("שירותי מיקום אינם זמינים בדפדפן זה");
    this.name = "GeolocationUnavailableError";
  }
}

export class GeolocationPermissionDeniedError extends Error {
  constructor() {
    super("הגישה למיקום נדחתה");
    this.name = "GeolocationPermissionDeniedError";
  }
}

export class GeolocationTimeoutError extends Error {
  constructor() {
    super("לא הצלחנו לאתר את המיקום שלך בזמן");
    this.name = "GeolocationTimeoutError";
  }
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 5000,
};

function toGeoPosition(pos: GeolocationPosition): GeoPosition {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    heading: typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading) ? pos.coords.heading : null,
    speed: typeof pos.coords.speed === "number" && !Number.isNaN(pos.coords.speed) ? pos.coords.speed : null,
    timestamp: pos.timestamp,
  };
}

function mapGeoError(err: GeolocationPositionError): Error {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new GeolocationPermissionDeniedError();
    case err.TIMEOUT:
      return new GeolocationTimeoutError();
    default:
      return new Error("שגיאה באיתור המיקום");
  }
}

/** One-shot position request. Must be called after an explicit user gesture. */
export function requestCurrentPosition(options: PositionOptions = DEFAULT_OPTIONS): Promise<GeoPosition> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new GeolocationUnavailableError());
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toGeoPosition(pos)),
      (err) => reject(mapGeoError(err)),
      options
    );
  });
}

/** Continuous position tracking for the live navigator. Returns the watch id. */
export function watchUserPosition(
  onUpdate: (position: GeoPosition) => void,
  onError: (error: Error) => void,
  options: PositionOptions = DEFAULT_OPTIONS
): number | null {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError(new GeolocationUnavailableError());
    return null;
  }
  return navigator.geolocation.watchPosition(
    (pos) => onUpdate(toGeoPosition(pos)),
    (err) => onError(mapGeoError(err)),
    options
  );
}

export function stopWatchingPosition(watchId: number | null): void {
  if (watchId !== null && typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}
