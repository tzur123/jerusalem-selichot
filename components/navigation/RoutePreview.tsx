"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadGoogleMaps, isGoogleMapsConfigured } from "@/lib/google-maps/loader";
import { MAP_DARK_STYLE, statusPinIcon } from "@/components/map/map-style";
import type { LocatableStation } from "@/types/station";
import type { ProgressStatus } from "@/lib/supabase/types";
import { haversineDistanceMeters, estimateWalkingSeconds } from "@/lib/geo/haversine";
import { requestCurrentPosition, type GeoPosition } from "@/lib/geo/geolocation";
import { computeWalkingRoute, type WalkingRoute } from "@/lib/google-maps/routes";
import { trackEventClient } from "@/lib/analytics/track-client";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

const GOLD_PIN_COLOR = "#D8B57A";
const COMPLETED_PIN_COLOR = "#00F0A8";
const TARGET_PIN_COLOR = "#59D6FF";

function formatEta(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return minutes <= 1 ? "פחות מדקה" : `${minutes} דק'`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק"מ`;
}

function WalkingIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="shrink-0">
      <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
      <path d="M12 7v6" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10 8 12" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10 16 9" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13 9 20" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13 15 19" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RoutePreview({
  station,
  allStations,
  progressByStationId,
}: {
  /** The station chosen back on /start — the initial preview target. */
  station: LocatableStation;
  allStations: LocatableStation[];
  progressByStationId?: Map<string, ProgressStatus>;
}) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const boundsFitRef = useRef(false);

  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(() =>
    isGoogleMapsConfigured() ? "loading" : "error"
  );
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [target, setTarget] = useState<LocatableStation>(station);
  const [selectedPreview, setSelectedPreview] = useState<LocatableStation | null>(null);
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [switching, setSwitching] = useState(false);
  const [starting, setStarting] = useState(false);

  // Location was already requested back on /start — this just reads the
  // (likely still-fresh) result again so the preview can show a real ETA.
  useEffect(() => {
    let cancelled = false;
    requestCurrentPosition()
      .then((pos) => {
        if (!cancelled) setUserPosition(pos);
      })
      .catch(() => {
        if (!cancelled) setLocationDenied(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real walking route (distance/time) to whichever station is currently targeted.
  useEffect(() => {
    if (!userPosition) return;
    let cancelled = false;
    computeWalkingRoute(
      { lat: userPosition.lat, lng: userPosition.lng },
      { lat: target.latitude, lng: target.longitude }
    )
      .then((r) => {
        if (!cancelled) setRoute(r);
      })
      .catch(() => {
        if (!cancelled) setRoute(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userPosition, target]);

  // Map + station pins, created once.
  useEffect(() => {
    if (!isGoogleMapsConfigured()) return;
    let cancelled = false;
    const markers = markersRef.current;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: target.latitude, lng: target.longitude },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: MAP_DARK_STYLE,
        });

        allStations.forEach((s) => {
          const marker = new google.maps.Marker({
            position: { lat: s.latitude, lng: s.longitude },
            map: mapInstance.current!,
            title: s.name,
            optimized: false,
          });
          marker.addListener("click", () => setSelectedPreview(s));
          markers.set(s.id, marker);
        });

        setMapStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setMapStatus("error");
      });

    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
      markers.clear();
      userMarkerRef.current?.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-tint pins whenever the target (or progress) changes, and keep the
  // currently-open popup's pin visually distinct from the rest.
  useEffect(() => {
    if (mapStatus !== "ready") return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g) return;
    markersRef.current.forEach((marker, id) => {
      const s = allStations.find((st) => st.id === id);
      if (!s) return;
      const isCompleted = progressByStationId?.get(id) === "completed";
      const isTarget = id === target.id;
      marker.setIcon(
        statusPinIcon(g, s.orderIndex, isCompleted ? COMPLETED_PIN_COLOR : isTarget ? TARGET_PIN_COLOR : GOLD_PIN_COLOR)
      );
      marker.setZIndex(isTarget ? 700 : isCompleted ? 500 : 400);
    });
  }, [mapStatus, target, allStations, progressByStationId]);

  // "You are here" marker.
  useEffect(() => {
    if (mapStatus !== "ready" || !mapInstance.current || !userPosition) return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g) return;
    const pos = { lat: userPosition.lat, lng: userPosition.lng };
    if (!userMarkerRef.current) {
      userMarkerRef.current = new g.maps.Marker({
        map: mapInstance.current,
        position: pos,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#00F0A8",
          fillOpacity: 1,
          strokeColor: "#001B33",
          strokeWeight: 2,
        },
        zIndex: 999,
      });
    } else {
      userMarkerRef.current.setPosition(pos);
    }
  }, [mapStatus, userPosition]);

  // Zoom out to fit the user + every station, once — after that the visitor
  // is free to pan/zoom without the map jumping back.
  useEffect(() => {
    if (mapStatus !== "ready" || !mapInstance.current || boundsFitRef.current) return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g) return;
    if (allStations.length === 0) return;

    const bounds = new g.maps.LatLngBounds();
    allStations.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }));
    if (userPosition) bounds.extend({ lat: userPosition.lat, lng: userPosition.lng });
    mapInstance.current.fitBounds(bounds, 72);
    boundsFitRef.current = true;
  }, [mapStatus, userPosition, allStations]);

  const chooseAsStart = useCallback(
    async (next: LocatableStation) => {
      setSelectedPreview(null);
      if (next.id === target.id) return;
      setSwitching(true);
      try {
        trackEventClient("start_station_selected", { stationId: next.id, metadata: { startMode: "manual" } });
        await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startMode: "manual", startStationId: next.id }),
        });
      } catch {
        // Non-fatal — worst case the session keeps the earlier start station,
        // navigation itself doesn't depend on it.
      }
      setTarget(next);
      setSwitching(false);
    },
    [target.id]
  );

  function handleStartNavigation() {
    setStarting(true);
    router.push(`/navigate/${target.slug}`);
  }

  const fallbackDistance = userPosition
    ? haversineDistanceMeters(
        { lat: userPosition.lat, lng: userPosition.lng },
        { lat: target.latitude, lng: target.longitude }
      )
    : null;
  const distanceMeters = route?.distanceMeters ?? fallbackDistance;
  const durationSeconds = route?.durationSeconds ?? (fallbackDistance != null ? estimateWalkingSeconds(fallbackDistance) : null);

  return (
    <div id="main-content" className="relative flex-1 min-h-dvh-safe flex flex-col">
      {mapStatus === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-muted">המפה אינה זמינה כרגע — אפשר להתחיל את הניווט בכל זאת.</p>
        </div>
      ) : (
        <>
          {mapStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}
          <div ref={mapRef} className="absolute inset-0" style={{ display: mapStatus === "ready" ? "block" : "none" }} />
        </>
      )}

      <div className="relative z-10 flex flex-col gap-3 p-6 pt-[calc(max(1.5rem,var(--safe-top))+40px)] pointer-events-none">
        <div className="pointer-events-auto self-center rounded-2xl glass-card px-4 py-2 text-center text-sm text-white/80">
          לחצו על נקודה אחרת במפה כדי להתחיל משם
        </div>

        {selectedPreview && (
          <div className="pointer-events-auto">
            <Card className="flex items-center gap-3 py-3 px-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-navy font-stencil text-lg">
                {selectedPreview.orderIndex}
              </span>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{selectedPreview.name}</CardTitle>
                {selectedPreview.address && (
                  <CardSubtitle className="text-xs truncate">{selectedPreview.address}</CardSubtitle>
                )}
              </div>
              <Button
                onClick={() => void chooseAsStart(selectedPreview)}
                size="md"
                disabled={switching || selectedPreview.id === target.id}
                className="shrink-0"
              >
                {switching ? <Spinner /> : selectedPreview.id === target.id ? "תחנת ההתחלה שלכם" : "בחרו כתחנת התחלה"}
              </Button>
            </Card>
          </div>
        )}
      </div>

      <div className="mt-auto relative z-10 flex flex-col gap-3 p-6 pb-[max(1.5rem,var(--safe-bottom))] pointer-events-none">
        <div className="pointer-events-auto">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-navy font-stencil text-lg">
                {target.orderIndex}
              </span>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{target.name}</CardTitle>
                {target.address && <CardSubtitle className="text-xs truncate">{target.address}</CardSubtitle>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted">זמן הליכה</p>
                <p className="flex items-center gap-1.5 text-2xl font-black text-mint">
                  <WalkingIcon />
                  {durationSeconds != null ? formatEta(durationSeconds) : "—"}
                </p>
              </div>
              <div className="h-9 w-px bg-white/10" aria-hidden />
              <div>
                <p className="text-xs text-muted">מרחק</p>
                <p className="text-lg font-bold">
                  {distanceMeters != null ? formatDistance(distanceMeters) : "—"}
                </p>
              </div>
            </div>

            {locationDenied && (
              <p className="text-xs text-muted">
                לא אותר מיקום — נבקש גישה שוב במסך הניווט כדי לחשב את המסלול.
              </p>
            )}

            <Button onClick={handleStartNavigation} size="lg" fullWidth disabled={starting || switching}>
              {starting ? <Spinner /> : "התחל ניווט"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
