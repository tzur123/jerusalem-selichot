"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Station } from "@/types/station";
import { isLocatable } from "@/types/station";
import { findNearest, estimateWalkingSeconds } from "@/lib/geo/haversine";
import {
  requestCurrentPosition,
  GeolocationPermissionDeniedError,
  GeolocationTimeoutError,
  type GeoPosition,
} from "@/lib/geo/geolocation";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";
import { trackEventClient } from "@/lib/analytics/track-client";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type LocationState =
  | { status: "requesting" }
  | { status: "granted"; position: GeoPosition }
  | { status: "denied" }
  | { status: "timeout" }
  | { status: "unsupported" };

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function formatWalkTime(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `כ-${minutes} דק' הליכה`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק"מ`;
}

export function StartFlow({ stations }: { stations: Station[] }) {
  const router = useRouter();
  const [locationState, setLocationState] = useState<LocationState>({ status: "requesting" });
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [showManualList, setShowManualList] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const locatableStations = useMemo(() => stations.filter(isLocatable), [stations]);
  const defaultStation = stations.find((s) => s.isDefaultStart) ?? stations[0];

  const nearest = useMemo(() => {
    if (locationState.status !== "granted") return null;
    return findNearest(
      { lat: locationState.position.lat, lng: locationState.position.lng },
      locatableStations
    );
  }, [locationState, locatableStations]);

  // No synchronous setState here (only after the first await) so this is
  // safe to fire straight from the mount effect below.
  const runGeolocation = useCallback(async () => {
    try {
      const position = await requestCurrentPosition();
      setLocationState({ status: "granted", position });
      trackEventClient("location_permission_granted");
      const nearestResult = findNearest({ lat: position.lat, lng: position.lng }, locatableStations);
      if (nearestResult) {
        trackEventClient("nearest_station_shown", { stationId: nearestResult.item.id });
      }
      const label = await reverseGeocode(position.lat, position.lng);
      setLocationLabel(label ?? "המיקום שלכם אותר בהצלחה");
    } catch (err) {
      if (err instanceof GeolocationPermissionDeniedError) {
        setLocationState({ status: "denied" });
        trackEventClient("location_permission_denied");
      } else if (err instanceof GeolocationTimeoutError) {
        setLocationState({ status: "timeout" });
        trackEventClient("location_permission_denied", { metadata: { reason: "timeout" } });
      } else {
        setLocationState({ status: "unsupported" });
      }
    }
  }, [locatableStations]);

  /** Used by the manual retry button — resets visible state, then re-runs. */
  const requestLocation = useCallback(() => {
    setLocationState({ status: "requesting" });
    setLocationLabel(null);
    void runGeolocation();
  }, [runGeolocation]);

  // Ask for location the moment this screen opens — no click required. If the
  // visitor doesn't approve, the fallback card below offers a manual retry.
  // Deferred to a microtask so this doesn't read as a synchronous
  // setState-in-effect (the state updates only happen once the underlying
  // promise settles, but the linter can't see that far).
  useEffect(() => {
    queueMicrotask(() => void runGeolocation());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectStart(station: Station, startMode: "nearest" | "recommended" | "manual") {
    if (pending) return;
    setPending(station.id);
    try {
      trackEventClient("start_station_selected", { stationId: station.id, metadata: { startMode } });
      await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startMode, startStationId: station.id }),
      });
      router.push(`/navigate/${station.slug}`);
    } catch {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-6">
        <h1 className="text-2xl font-black">מאיפה מתחילים?</h1>
        <p className="text-muted text-sm mt-1">בחרו נקודת התחלה לסיור הסליחות</p>
      </header>

      {locationState.status === "requesting" && (
        <Card className="flex items-center gap-3">
          <Spinner />
          <span>מאתרים את המיקום שלכם...</span>
        </Card>
      )}

      {(locationState.status === "denied" ||
        locationState.status === "timeout" ||
        locationState.status === "unsupported") && (
        <Card className="border-stone/40 flex flex-col gap-3">
          <div>
            <CardTitle className="text-base">אין בעיה, אפשר להמשיך בלי מיקום</CardTitle>
            <CardSubtitle>
              {locationState.status === "timeout"
                ? "לא הצלחנו לאתר את המיקום בזמן."
                : "הגישה למיקום לא אושרה."}{" "}
              תמיד אפשר להתחיל מהמסלול המומלץ או לבחור תחנה ידנית.
            </CardSubtitle>
          </div>
          <Button onClick={requestLocation} variant="secondary" fullWidth>
            אפשרו גישה למיקום
          </Button>
        </Card>
      )}

      {locationState.status === "granted" && (
        <p className="flex items-center gap-1.5 text-xs text-muted -mb-2">
          <PinIcon />
          {locationLabel ?? "מאתרים את הכתובת המדויקת..."}
        </p>
      )}

      {locationState.status === "granted" && nearest && (
        <button
          type="button"
          onClick={() => selectStart(nearest.item, "nearest")}
          disabled={pending !== null}
          className="text-right"
        >
          <Card className="border-mint/50 flex flex-col gap-1">
            <span className="text-xs font-bold text-mint">הכי קרוב אליי</span>
            <CardTitle>{nearest.item.name}</CardTitle>
            <CardSubtitle>
              {formatDistance(nearest.distanceMeters)} · {formatWalkTime(estimateWalkingSeconds(nearest.distanceMeters))}
            </CardSubtitle>
            {pending === nearest.item.id && <Spinner className="mt-2" />}
          </Card>
        </button>
      )}

      {defaultStation && (
        <button
          type="button"
          onClick={() => selectStart(defaultStation, "recommended")}
          disabled={pending !== null}
          className="text-right"
        >
          <Card className="flex flex-col gap-1">
            <span className="text-xs font-bold text-stone">המסלול המומלץ</span>
            <CardTitle>{defaultStation.name}</CardTitle>
            <CardSubtitle>{defaultStation.shortDescription ?? "תחנת הפתיחה של הסיור"}</CardSubtitle>
            {pending === defaultStation.id && <Spinner className="mt-2" />}
          </Card>
        </button>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowManualList((v) => !v)}
          className="w-full text-center text-sm text-muted underline underline-offset-4"
        >
          לבחירת תחנה על המפה
        </button>

        {showManualList && (
          <div className="mt-4 flex flex-col gap-3">
            {stations.map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => selectStart(station, "manual")}
                disabled={pending !== null}
                className="text-right"
              >
                <Card className="flex items-center gap-3 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint font-black">
                    {station.orderIndex}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base">{station.name}</CardTitle>
                    {station.address && <CardSubtitle className="text-xs">{station.address}</CardSubtitle>}
                  </div>
                  {pending === station.id && <Spinner />}
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
