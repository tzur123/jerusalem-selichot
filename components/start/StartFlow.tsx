"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Station } from "@/types/station";
import { isLocatable } from "@/types/station";
import { findNearest } from "@/lib/geo/haversine";
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
import { StationMapPicker } from "@/components/start/StationMapPicker";

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

function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StartFlow({ stations }: { stations: Station[] }) {
  const router = useRouter();
  const [locationState, setLocationState] = useState<LocationState>({ status: "requesting" });
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
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
    <>
      <div className="h-[38vh]" aria-hidden />
      <div className="flex flex-col gap-6 translate-y-[15px]">
        <header className="pt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
          <h1 className="text-2xl font-black">מאיפה מתחילים?</h1>
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
          <p className="flex items-center gap-1.5 text-xs text-muted -mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
            <PinIcon />
            {locationLabel ?? "מאתרים את הכתובת המדויקת..."}
          </p>
        )}

        {defaultStation && (
          <button
            type="button"
            onClick={() => selectStart(defaultStation, "recommended")}
            disabled={pending !== null}
            className="group relative flex w-full items-center justify-between gap-4 rounded-3xl bg-gradient-to-b from-mint to-[#00d494] px-6 py-5 text-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-all active:scale-[0.97] mint-glow disabled:opacity-50"
          >
            <span className="flex flex-col items-start gap-0.5">
              <span className="text-lg font-black leading-tight">התחל את הסיור המומלץ</span>
              <span className="text-sm font-semibold text-navy/70">{defaultStation.name}</span>
            </span>
            {pending === defaultStation.id ? (
              <Spinner />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10 transition-transform group-active:-translate-x-0.5">
                <ArrowIcon />
              </span>
            )}
          </button>
        )}

        {locationState.status === "granted" && nearest && (
          <button
            type="button"
            onClick={() => selectStart(nearest.item, "nearest")}
            disabled={pending !== null}
            className="flex w-full items-center justify-between gap-3 rounded-2xl glass-button border border-mint/30 px-5 py-3 text-white/90 transition-colors hover:border-mint/60 disabled:opacity-50"
          >
            <span className="text-sm font-semibold">התחל מנקודה אחרת שקרובה אלי</span>
            {pending === nearest.item.id ? <Spinner /> : <ArrowIcon size={15} />}
          </button>
        )}

        <button
          type="button"
          onClick={() => setMapPickerOpen(true)}
          className="w-full text-center text-sm text-muted underline underline-offset-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
        >
          לבחירת תחנה על המפה
        </button>

        <StationMapPicker
          stations={stations}
          open={mapPickerOpen}
          onClose={() => setMapPickerOpen(false)}
          pendingId={pending}
          onSelect={(station) => {
            setMapPickerOpen(false);
            void selectStart(station, "manual");
          }}
        />
      </div>
    </>
  );
}
