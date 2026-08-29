"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, isGoogleMapsConfigured } from "@/lib/google-maps/loader";
import type { LatLng } from "@/lib/geo/haversine";
import type { LocatableStation } from "@/types/station";
import type { ProgressStatus } from "@/lib/supabase/types";
import { Spinner } from "@/components/ui/Spinner";
import { StationListFallback } from "./StationListFallback";

const STATUS_COLOR: Record<ProgressStatus, string> = {
  pending: "#93A6B5",
  arrived: "#D8B57A",
  unlocked: "#00F0A8",
  watching: "#00F0A8",
  completed: "#00325A",
};

export function TourMap({
  stations,
  progressByStationId,
  onSelectStation,
  userPosition,
  className,
  height = 320,
}: {
  stations: LocatableStation[];
  progressByStationId?: Map<string, ProgressStatus>;
  onSelectStation?: (station: LocatableStation) => void;
  userPosition?: LatLng | null;
  className?: string;
  height?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[] | google.maps.Marker[]>([]);
  const userMarker = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() =>
    isGoogleMapsConfigured() ? "loading" : "error"
  );

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return;

    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const center = stations[0] ?? { latitude: 31.7767, longitude: 35.2345 };
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: MAP_DARK_STYLE,
        });

        markers.current = stations.map((station) => {
          const color = STATUS_COLOR[progressByStationId?.get(station.id) ?? "pending"];
          const marker = new google.maps.Marker({
            position: { lat: station.latitude, lng: station.longitude },
            map: mapInstance.current!,
            label: {
              text: String(station.orderIndex),
              color: "#001B33",
              fontWeight: "bold",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#F7FBFF",
              strokeWeight: 2,
              scale: 16,
            },
            title: station.name,
          });
          if (onSelectStation) {
            marker.addListener("click", () => onSelectStation(station));
          }
          return marker;
        });

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      markers.current.forEach((m) => ("setMap" in m ? m.setMap(null) : undefined));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  useEffect(() => {
    if (status !== "ready" || !mapInstance.current) return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g) return;

    if (!userPosition) {
      userMarker.current?.setMap(null);
      userMarker.current = null;
      return;
    }

    if (!userMarker.current) {
      userMarker.current = new g.maps.Marker({
        map: mapInstance.current,
        icon: {
          path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: "#00F0A8",
          fillOpacity: 1,
          strokeColor: "#001B33",
          strokeWeight: 1,
        },
        zIndex: 999,
      });
    }
    userMarker.current.setPosition({ lat: userPosition.lat, lng: userPosition.lng });
  }, [status, userPosition]);

  if (status === "error") {
    return <StationListFallback stations={stations} onSelectStation={onSelectStation} className={className} />;
  }

  return (
    <div className={className} style={{ height }}>
      {status === "loading" && (
        <div className="flex h-full w-full items-center justify-center rounded-3xl glass-card">
          <Spinner />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full rounded-3xl overflow-hidden" style={{ display: status === "ready" ? "block" : "none" }} />
    </div>
  );
}

const MAP_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1f33" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1f33" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#93a6b5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#17324a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#001b33" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];
