"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, isGoogleMapsConfigured } from "@/lib/google-maps/loader";
import type { LatLng } from "@/lib/geo/haversine";
import { Spinner } from "@/components/ui/Spinner";

export type NavigatorMapHandle = {
  recenter: () => void;
};

export function NavigatorMap({
  destination,
  polyline,
  userPosition,
  heading,
  follow,
  onMapReady,
  onUserDrag,
  className,
}: {
  destination: LatLng;
  polyline: LatLng[];
  userPosition: LatLng | null;
  heading: number | null;
  follow: boolean;
  onMapReady?: (recenter: () => void) => void;
  onUserDrag?: () => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const polylineInstance = useRef<google.maps.Polyline | null>(null);
  const userMarker = useRef<google.maps.Marker | null>(null);
  const destMarker = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() =>
    isGoogleMapsConfigured() ? "loading" : "error"
  );

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: userPosition ?? destination,
          zoom: 18,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          styles: NAV_MAP_STYLE,
        });

        destMarker.current = new google.maps.Marker({
          position: destination,
          map: mapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#00F0A8",
            fillOpacity: 1,
            strokeColor: "#F7FBFF",
            strokeWeight: 2,
            scale: 12,
          },
        });

        mapInstance.current.addListener("dragstart", () => onUserDrag?.());

        setStatus("ready");
        onMapReady?.(() => {
          if (mapInstance.current && userPosition) {
            mapInstance.current.panTo(userPosition);
            mapInstance.current.setZoom(18);
          }
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // polyline updates
  useEffect(() => {
    if (status !== "ready" || !mapInstance.current) return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g) return;

    polylineInstance.current?.setMap(null);
    polylineInstance.current = new g.maps.Polyline({
      path: polyline,
      strokeColor: "#00F0A8",
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: mapInstance.current,
    });
  }, [status, polyline]);

  // user marker + follow
  useEffect(() => {
    if (status !== "ready" || !mapInstance.current) return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g || !userPosition) return;

    if (!userMarker.current) {
      userMarker.current = new g.maps.Marker({
        map: mapInstance.current,
        icon: {
          path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#00F0A8",
          fillOpacity: 1,
          strokeColor: "#001B33",
          strokeWeight: 1.5,
          rotation: heading ?? 0,
        },
        zIndex: 999,
      });
    } else {
      userMarker.current.setIcon({
        path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#00F0A8",
        fillOpacity: 1,
        strokeColor: "#001B33",
        strokeWeight: 1.5,
        rotation: heading ?? 0,
      });
    }
    userMarker.current.setPosition(userPosition);

    if (follow) {
      mapInstance.current.panTo(userPosition);
    }
  }, [status, userPosition, heading, follow]);

  if (status === "error") {
    return (
      <div className={`${className ?? ""} flex items-center justify-center rounded-3xl glass-card p-6 text-center`}>
        <p className="text-sm text-muted">
          המפה האינטראקטיבית אינה זמינה כרגע. אפשר להמשיך עם ניווט חיצוני ב-Google Maps.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {status === "loading" && (
        <div className="h-full w-full flex items-center justify-center rounded-3xl glass-card">
          <Spinner />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" style={{ display: status === "ready" ? "block" : "none" }} />
    </div>
  );
}

const NAV_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1f33" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1f33" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#93a6b5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#17324a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#00f0a8" }, { weight: 0.2 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#001b33" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
