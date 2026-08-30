"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocatableStation } from "@/types/station";
import { haversineDistanceMeters, AVERAGE_WALKING_SPEED_MPS, type LatLng } from "@/lib/geo/haversine";
import {
  distanceToPolylineMeters,
  evaluateReroute,
  createInitialRerouteState,
} from "@/lib/geo/route-distance";
import {
  requestCurrentPosition,
  watchUserPosition,
  stopWatchingPosition,
  GeolocationPermissionDeniedError,
  type GeoPosition,
} from "@/lib/geo/geolocation";
import { computeWalkingRoute, type WalkingRoute } from "@/lib/google-maps/routes";
import { buildGoogleMapsWalkingUrl } from "@/lib/google-maps/external-url";
import { requestWakeLock, releaseWakeLock } from "@/lib/device/wake-lock";
import { useCompassHeading } from "@/lib/device/heading";
import { trackEventClient } from "@/lib/analytics/track-client";
import { Screen } from "@/components/brand/Screen";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { NavigatorMap } from "./NavigatorMap";
import { NavigationInstructionCard } from "./NavigationInstructionCard";
import { RouteProgress } from "./RouteProgress";
import { NavControlButton } from "./NavControls";
import { ArrivalSheet } from "./ArrivalSheet";

type Phase = "locating" | "routing" | "active" | "location-error" | "route-error";

const STEP_ADVANCE_THRESHOLD_M = 18;

export function Navigator({ station }: { station: LocatableStation }) {
  const router = useRouter();
  const destination = useMemo<LatLng>(
    () => ({ lat: station.latitude, lng: station.longitude }),
    [station.latitude, station.longitude]
  );

  const [phase, setPhase] = useState<Phase>("locating");
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [follow, setFollow] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [usingStraightLineFallback, setUsingStraightLineFallback] = useState(false);

  // Mirrors of the state above, readable synchronously from the geolocation
  // watch callback below without re-subscribing watchPosition on every change.
  const routeRef = useRef<WalkingRoute | null>(null);
  const stepIndexRef = useRef(0);
  const usingStraightLineFallbackRef = useRef(false);
  const arrivedRef = useRef(false);
  const arrivalReportedRef = useRef(false);

  const watchIdRef = useRef<number | null>(null);
  const rerouteStateRef = useRef(createInitialRerouteState());
  const recenterRef = useRef<() => void>(() => {});

  const compass = useCompassHeading();

  const fetchRoute = useCallback(
    async (origin: LatLng) => {
      try {
        const computed = await computeWalkingRoute(origin, destination);
        routeRef.current = computed;
        stepIndexRef.current = 0;
        usingStraightLineFallbackRef.current = false;
        setRoute(computed);
        setUsingStraightLineFallback(false);
        setStepIndex(0);
        return computed;
      } catch {
        const fallbackRoute: WalkingRoute = {
          distanceMeters: haversineDistanceMeters(origin, destination),
          durationSeconds: haversineDistanceMeters(origin, destination) / AVERAGE_WALKING_SPEED_MPS,
          polyline: [origin, destination],
          steps: [
            {
              instruction: `המשיכו ישר לכיוון ${station.name}`,
              distanceMeters: haversineDistanceMeters(origin, destination),
              start: origin,
              end: destination,
            },
          ],
        };
        routeRef.current = fallbackRoute;
        stepIndexRef.current = 0;
        usingStraightLineFallbackRef.current = true;
        setRoute(fallbackRoute);
        setUsingStraightLineFallback(true);
        setStepIndex(0);
        return null;
      }
    },
    [destination, station.name]
  );

  const reportArrival = useCallback(() => {
    if (arrivalReportedRef.current) return;
    arrivalReportedRef.current = true;
    void fetch("/api/session/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "arrived", stationId: station.id }),
    });
  }, [station.id]);

  // Derived per-position logic (arrival, step advancement, reroute) runs
  // directly inside the watchPosition callback rather than a reactive
  // effect, since it depends on the full history of samples, not just the
  // latest React state snapshot.
  const handlePositionUpdate = useCallback(
    (position: GeoPosition) => {
      setUserPosition(position);

      const currentUser: LatLng = { lat: position.lat, lng: position.lng };
      const distanceToDestination = haversineDistanceMeters(currentUser, destination);

      if (!arrivedRef.current && distanceToDestination <= station.arrivalRadiusM) {
        arrivedRef.current = true;
        setArrived(true);
        reportArrival();
      }

      const currentRoute = routeRef.current;
      if (!currentRoute || usingStraightLineFallbackRef.current) return;

      const idx = stepIndexRef.current;
      const step = currentRoute.steps[idx];
      if (step) {
        const distToStepEnd = haversineDistanceMeters(currentUser, step.end);
        if (distToStepEnd <= STEP_ADVANCE_THRESHOLD_M && idx < currentRoute.steps.length - 1) {
          stepIndexRef.current = idx + 1;
          setStepIndex(idx + 1);
        }
      }

      const distToPolyline = distanceToPolylineMeters(currentUser, currentRoute.polyline);
      const { nextState, shouldReroute } = evaluateReroute({
        state: rerouteStateRef.current,
        distanceToPolylineMeters: distToPolyline,
        distanceToDestinationMeters: distanceToDestination,
        nowMs: Date.now(),
      });
      rerouteStateRef.current = nextState;
      if (shouldReroute) {
        trackEventClient("navigation_rerouted", { stationId: station.id });
        void fetchRoute(currentUser);
      }
    },
    [destination, station.arrivalRadiusM, station.id, fetchRoute, reportArrival]
  );

  const handleStart = useCallback(async () => {
    setPhase("locating");
    await requestWakeLock();

    try {
      const initial = await requestCurrentPosition();
      setUserPosition(initial);
      trackEventClient("navigation_started", { stationId: station.id });

      setPhase("routing");
      await fetchRoute({ lat: initial.lat, lng: initial.lng });
      setPhase("active");

      watchIdRef.current = watchUserPosition(handlePositionUpdate, (err) => {
        if (err instanceof GeolocationPermissionDeniedError) {
          setLocationErrorMessage(err.message);
          setPhase("location-error");
        }
      });
    } catch (err) {
      setLocationErrorMessage(err instanceof Error ? err.message : "שגיאה באיתור מיקום");
      setPhase("location-error");
    }
  }, [fetchRoute, handlePositionUpdate, station.id]);

  // Navigation starts the moment this screen mounts — location permission was
  // already requested back on /start, so there's no need to make the visitor
  // tap a second "start" button before we act on it. If something does go
  // wrong (denied/timeout), the location-error phase below offers a retry
  // and the Google Maps fallback. Deferred to a microtask so the setState
  // calls inside handleStart don't read as synchronous setState-in-effect.
  useEffect(() => {
    queueMicrotask(() => void handleStart());
    return () => {
      stopWatchingPosition(watchIdRef.current);
      void releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenGoogleMaps = useCallback(() => {
    trackEventClient("open_google_maps_clicked", { stationId: station.id });
    window.open(buildGoogleMapsWalkingUrl(destination), "_blank", "noopener,noreferrer");
  }, [destination, station.id]);

  const remainingMeters =
    route && userPosition
      ? usingStraightLineFallback
        ? haversineDistanceMeters({ lat: userPosition.lat, lng: userPosition.lng }, destination)
        : route.steps.slice(stepIndex + 1).reduce((sum, s) => sum + s.distanceMeters, 0) +
          haversineDistanceMeters({ lat: userPosition.lat, lng: userPosition.lng }, route.steps[stepIndex]?.end ?? destination)
      : (route?.distanceMeters ?? 0);

  const etaSeconds = remainingMeters / AVERAGE_WALKING_SPEED_MPS;

  if (phase === "locating" || phase === "routing") {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-mint" />
          <p className="text-muted">{phase === "locating" ? "מאתרים את המיקום שלכם..." : "מחשבים מסלול הליכה..."}</p>
        </div>
      </Screen>
    );
  }

  if (phase === "location-error") {
    return (
      <Screen>
        <ErrorState
          title="לא הצלחנו לגשת למיקום שלכם"
          description={locationErrorMessage ?? undefined}
          retryLabel="נסו שוב"
          onRetry={handleStart}
          secondaryAction={
            <Button onClick={handleOpenGoogleMaps} variant="secondary" fullWidth>
              פתחו ניווט ב-Google Maps
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <div className="relative flex-1 min-h-dvh-safe flex flex-col">
      <NavigatorMap
        destination={destination}
        polyline={route?.polyline ?? [destination]}
        userPosition={userPosition ? { lat: userPosition.lat, lng: userPosition.lng } : null}
        heading={
          userPosition?.heading != null && (userPosition.speed ?? 0) > 0.3
            ? userPosition.heading
            : compass.heading
        }
        follow={follow}
        onMapReady={(recenter) => (recenterRef.current = recenter)}
        onUserDrag={() => setFollow(false)}
        className="absolute inset-0"
      />

      <div className="relative z-10 flex flex-col gap-3 p-6 pt-[max(1.5rem,var(--safe-top))] pointer-events-none">
        <div className="pointer-events-auto">
          {route && route.steps[stepIndex] && (
            <NavigationInstructionCard
              instruction={route.steps[stepIndex].instruction}
              distanceToNextMeters={
                userPosition
                  ? haversineDistanceMeters(
                      { lat: userPosition.lat, lng: userPosition.lng },
                      route.steps[stepIndex].end
                    )
                  : route.steps[stepIndex].distanceMeters
              }
            />
          )}
        </div>
        {usingStraightLineFallback && (
          <div className="pointer-events-auto rounded-2xl bg-stone/20 border border-stone/40 px-4 py-2 text-sm">
            לא הצלחנו לחשב מסלול הליכה מדויק — מוצג קו ישר לתחנה. מומלץ להשתמש ב-Google Maps.
          </div>
        )}
      </div>

      <div className="mt-auto relative z-10 flex flex-col gap-3 p-6 pb-[max(1.5rem,var(--safe-bottom))] pointer-events-none">
        <div className="flex justify-end gap-2 pointer-events-auto">
          <NavControlButton
            onClick={() => {
              setFollow(true);
              recenterRef.current();
            }}
            label="מרכוז מחדש"
            active={follow}
          >
            🎯
          </NavControlButton>
          <NavControlButton onClick={() => void compass.enable()} label="הפעלת מצפן" active={Boolean(compass.heading)}>
            🧭
          </NavControlButton>
        </div>

        <div className="pointer-events-auto">
          <RouteProgress remainingMeters={remainingMeters} etaSeconds={etaSeconds} />
        </div>

        <div className="pointer-events-auto">
          <Button onClick={handleOpenGoogleMaps} variant="secondary" fullWidth>
            פתחו ניווט ב-Google Maps
          </Button>
        </div>
      </div>

      <ArrivalSheet
        open={arrived}
        stationName={station.name}
        onScan={() => router.push(`/scan?station=${station.slug}`)}
      />
    </div>
  );
}
